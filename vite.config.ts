import path from 'path';
import fs from 'node:fs';
import { exec, spawn, type ChildProcess } from 'node:child_process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { WebSocketServer, WebSocket } from 'ws';

/** Strip MSYS/bash non-TTY job-control noise when Git Bash runs over pipes (stderr, sometimes stdout). */
function isGitBashNoiseLine(line: string): boolean {
  const t = line.trimEnd();
  if (t === 'bash: no job control in this shell') return true;
  if (t.startsWith('bash: cannot set terminal process group')) return true;
  return false;
}

function filterGitBashStreamChunk(
  shell: string,
  buf: Buffer,
  lineCarry: { value: string },
): string {
  if (shell !== 'git-bash') return buf.toString('utf8');
  let s = lineCarry.value + buf.toString('utf8');
  s = s.replace(/\r\n/g, '\n');
  const parts = s.split(/\r?\n/);
  lineCarry.value = parts.pop() ?? '';
  const out: string[] = [];
  for (const line of parts) {
    if (isGitBashNoiseLine(line)) continue;
    out.push(line);
  }
  return out.length ? out.join('\n') + '\n' : '';
}

function flushGitBashLineCarry(shell: string, lineCarry: { value: string }): string {
  if (shell !== 'git-bash' || !lineCarry.value) return '';
  const line = lineCarry.value.replace(/\r\n/g, '\n');
  lineCarry.value = '';
  if (isGitBashNoiseLine(line)) return '';
  return line;
}

function findGitBash(): string | null {
  const pf = process.env.ProgramFiles;
  const pf86 = process.env['ProgramFiles(x86)'];
  const pf6432 = process.env.ProgramW6432;
  const local = process.env.LOCALAPPDATA;
  const underGit = (root: string) => [
    `${root}\\bin\\bash.exe`,
    `${root}\\usr\\bin\\bash.exe`,
  ];
  const candidates: string[] = [];
  for (const base of [pf, pf6432, pf86, 'C:\\Program Files', 'C:\\Program Files (x86)'].filter(Boolean) as string[]) {
    candidates.push(...underGit(`${base}\\Git`));
  }
  if (local) {
    candidates.push(`${local}\\Programs\\Git\\bin\\bash.exe`, `${local}\\Programs\\Git\\usr\\bin\\bash.exe`);
  }
  const seen = new Set<string>();
  for (const p of candidates) {
    const norm = path.normalize(p);
    if (seen.has(norm)) continue;
    seen.add(norm);
    try {
      if (fs.existsSync(norm)) return norm;
    } catch {
      /* ignore */
    }
  }
  return null;
}

const VIBE_SANDBOX_DIRNAME = '.vibe-sandbox';

/** Reserved names under the sandbox (shell profiles). */
const VIBE_SANDBOX_PROFILE_FILES = new Set(['vibe-profile.ps1', '.bashrc']);

function getVibePaths() {
  const projectRoot = path.resolve(process.cwd());
  const sandboxDir = path.join(projectRoot, VIBE_SANDBOX_DIRNAME);
  return { projectRoot, sandboxDir };
}

/** Reject path traversal; returns posix-style relative path or null. */
function sanitizeVibeRelPath(rel: string): string | null {
  const n = rel.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!n) return null;
  const segments = n.split('/').filter(Boolean);
  if (segments.some((s) => s === '..')) return null;
  return segments.join('/');
}

function writeVibeSandboxFiles(
  sandboxDir: string,
  files: Record<string, string>,
): void {
  fs.mkdirSync(sandboxDir, { recursive: true });
  if (!fs.existsSync(sandboxDir)) return;
  for (const name of fs.readdirSync(sandboxDir)) {
    if (VIBE_SANDBOX_PROFILE_FILES.has(name)) continue;
    fs.rmSync(path.join(sandboxDir, name), { recursive: true, force: true });
  }
  for (const [rel, content] of Object.entries(files)) {
    const safe = sanitizeVibeRelPath(rel);
    if (!safe) continue;
    const fp = path.join(sandboxDir, safe);
    const resolved = path.resolve(fp);
    const absSandbox = path.resolve(sandboxDir);
    const relFromSandbox = path.relative(absSandbox, resolved);
    if (relFromSandbox.startsWith('..') || path.isAbsolute(relFromSandbox)) continue;
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content ?? '', 'utf8');
  }
}

function escapePsSingleQuoted(s: string): string {
  return s.replace(/'/g, "''");
}

function toMsysPath(winPath: string): string {
  if (process.platform !== 'win32') return winPath.replace(/\\/g, '/');
  const m = /^([a-zA-Z]):[/\\](.*)$/.exec(winPath.trim());
  if (!m) return winPath.replace(/\\/g, '/');
  return `/${m[1].toLowerCase()}/${m[2].replace(/\\/g, '/')}`;
}

function isBlockedTerminalCommand(line: string, shell: string): string | null {
  const cmd = line.trim();
  if (!cmd) return null;

  // 1) Never allow remove/delete style commands from integrated terminal.
  const removeRe =
    /\b(rm|rmdir|del|erase|rd|remove-item|ri|unlink|rmitem|remove)\b/i;
  if (removeRe.test(cmd)) {
    return 'Deletion/removal commands are blocked in Vibe terminal sandbox.';
  }

  // 2) Prevent path escaping attempts outside sandbox.
  if (/(^|[\s"'`])\.\.[\\/]/.test(cmd)) {
    return 'Path traversal outside sandbox is blocked.';
  }
  if (/[a-zA-Z]:[\\/]/.test(cmd)) {
    return 'Absolute Windows paths are blocked. Use sandbox-relative paths only.';
  }
  if (/(^|[\s"'`])~[\\/]/.test(cmd)) {
    return 'Home-directory paths are blocked. Use sandbox-relative paths only.';
  }

  // Git Bash absolute roots like /c/..., /d/... and /Users/... are blocked.
  if (shell === 'git-bash' && /(^|[\s"'`])\/([a-zA-Z]\/|Users\/|home\/|mnt\/)/.test(cmd)) {
    return 'Absolute Unix-style paths are blocked. Use sandbox-relative paths only.';
  }

  // Generic command forms that jump location out of sandbox.
  if (/\b(cd|chdir|set-location|sl)\s+([/~]|[a-zA-Z]:|\.{2}([\\/]|$))/i.test(cmd)) {
    return 'Changing to non-sandbox locations is blocked.';
  }

  return null;
}

function writeVibePowerShellProfile(sandboxDir: string, projectRoot: string): void {
  const s = escapePsSingleQuoted(path.resolve(sandboxDir));
  const p = escapePsSingleQuoted(path.resolve(projectRoot));
  const body = `
$global:VibeSandboxRoot = '${s}'
$global:VibeProjectRoot = '${p}'
function Global:Set-LocationVibe {
  param([Parameter(Position=0)][string]$Path)
  $targetPath = $null
  if ($null -eq $Path -or $Path -eq '') {
    $targetPath = $global:VibeSandboxRoot
  } else {
    try {
      $targetPath = (Resolve-Path -LiteralPath $Path -ErrorAction Stop).Path
    } catch {
      try {
        $joined = Join-Path -Path (Get-Location).Path -ChildPath $Path
        $targetPath = (Resolve-Path -LiteralPath $joined -ErrorAction Stop).Path
      } catch {
        Write-Host '[Vibe] Path not found.' -ForegroundColor Red
        return
      }
    }
  }
  $norm = [System.IO.Path]::GetFullPath($targetPath.TrimEnd([char]'\\'))
  $root = [System.IO.Path]::GetFullPath($global:VibeSandboxRoot.TrimEnd([char]'\\'))
  $ok = ($norm.Equals($root, [StringComparison]::OrdinalIgnoreCase)) -or
        ($norm.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase))
  if (-not $ok) {
    Write-Host '[Vibe] Cannot leave the workspace sandbox (only files you create in Vibe Coder appear here).' -ForegroundColor Red
    return
  }
  Microsoft.PowerShell.Management\\Set-Location -LiteralPath $targetPath
}
Set-Alias -Name cd -Value Set-LocationVibe -Scope Global -Force -Option AllScope
Microsoft.PowerShell.Management\\Set-Location -LiteralPath $global:VibeSandboxRoot
`.trimStart();
  fs.writeFileSync(path.join(sandboxDir, 'vibe-profile.ps1'), body, 'utf8');
}

function writeVibeBashRc(sandboxDir: string, projectRoot: string): void {
  const ms = toMsysPath(path.resolve(sandboxDir));
  const mp = toMsysPath(path.resolve(projectRoot));
  const body = `# Vibe Terminal (piped shell — not a real TTY)
set +m 2>/dev/null
unset PROMPT_COMMAND 2>/dev/null
export VIBE_SANDBOX='${ms.replace(/'/g, `'\\''`)}'
export VIBE_PROJECT_ROOT='${mp.replace(/'/g, `'\\''`)}'
export TERM=xterm-256color
# Colored single-line prompt: user@host / dim path, then bright prompt char
PS1='\\[\\e[1;32m\\]\\u\\[\\e[0m\\]@\\[\\e[1;36m\\]\\h\\[\\e[0m\\] \\[\\e[1;33m\\]\\w\\[\\e[0m\\] \\[\\e[1;35m\\]\\$\\[\\e[0m\\] '
cd() {
  if [ $# -eq 0 ]; then set -- "$VIBE_SANDBOX"; fi
  local dest
  dest="$(builtin cd "$1" 2>/dev/null && pwd -P)" || { echo "[Vibe] cd: $1: No such file or directory"; return 1; }
  case "$dest" in
    "$VIBE_SANDBOX"|"$VIBE_SANDBOX"/*) builtin cd "$dest" || return 1 ;;
    *) echo "[Vibe] Cannot leave the workspace sandbox."; return 1 ;;
  esac
}
builtin cd "$VIBE_SANDBOX" || true
`;
  fs.writeFileSync(path.join(sandboxDir, '.bashrc'), body, 'utf8');
}

function spawnVibeShell(
  shell: string,
  sandboxDir: string,
  projectRoot: string,
): { child: ChildProcess } | { error: string } {
  const env = { ...process.env } as NodeJS.ProcessEnv;
  writeVibePowerShellProfile(sandboxDir, projectRoot);
  writeVibeBashRc(sandboxDir, projectRoot);
  try {
    if (shell === 'cmd') {
      if (process.platform !== 'win32') {
        return { error: 'cmd.exe is only available on Windows.' };
      }
      const comspec = process.env.ComSpec || 'cmd.exe';
      // UTF-8 code page + stable prompt over piped stdio (no TTY).
      const child = spawn(comspec, ['/K', 'chcp 65001>nul & prompt $P$G'], {
        cwd: sandboxDir,
        env: {
          ...env,
          PROMPT: '$P$G',
        },
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { child };
    }
    if (shell === 'powershell') {
      const profilePath = path.join(sandboxDir, 'vibe-profile.ps1');
      const dotSource = `& { . '${escapePsSingleQuoted(profilePath)}' }`;
      if (process.platform !== 'win32') {
        const child = spawn('pwsh', ['-NoLogo', '-NoExit', '-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', dotSource], {
          cwd: sandboxDir,
          env,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        return { child };
      }
      const child = spawn(
        process.env.SystemRoot
          ? `${process.env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
          : 'powershell.exe',
        ['-NoLogo', '-NoExit', '-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', dotSource],
        {
          cwd: sandboxDir,
          env,
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );
      return { child };
    }
    if (shell === 'git-bash') {
      if (process.platform === 'win32') {
        const bash = findGitBash();
        if (!bash) {
          return {
            error:
              'Git Bash not found. Install Git for Windows or ensure bash.exe exists.',
          };
        }
        const bashrcPath = path.join(sandboxDir, '.bashrc');
        const envNoLcAll = { ...env } as NodeJS.ProcessEnv;
        delete envNoLcAll.LC_ALL;
        const child = spawn(
          bash,
          ['--noprofile', '--rcfile', bashrcPath, '-i'],
          {
            cwd: sandboxDir,
            env: {
              ...envNoLcAll,
              HOME: sandboxDir,
              VIBE_SANDBOX: sandboxDir,
              VIBE_PROJECT_ROOT: projectRoot,
              TERM: 'xterm-256color',
              // Avoid "cannot change locale (en_US.UTF-8)" on Windows Git Bash over pipes.
              LANG: env.LANG || 'C.UTF-8',
              MSYS2_ARG_CONV_EXCL: '*',
              SHELL: bash,
            },
            windowsHide: true,
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        );
        return { child };
      }
      const bashrcPath = path.join(sandboxDir, '.bashrc');
      const child = spawn('/bin/bash', ['--noprofile', '--rcfile', bashrcPath, '-i'], {
        cwd: sandboxDir,
        env: {
          ...env,
          HOME: sandboxDir,
          VIBE_SANDBOX: sandboxDir,
          VIBE_PROJECT_ROOT: projectRoot,
          TERM: 'xterm-256color',
          LANG: env.LANG || 'en_US.UTF-8',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { child };
    }
    return { error: 'Unknown shell' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // The IDE/preview sandbox is written + deleted frequently at runtime.
        // Ignore it so Vite's watcher doesn't crash on transient/missing paths.
        watch: {
          ignored: ['**/.vibe-sandbox/**'],
        },
        // Browser CORS to Clearbit can fail; proxy in dev for company domain lookup.
        proxy: {
          '/api/clearbit-suggest': {
            target: 'https://autocomplete.clearbit.com',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/api\/clearbit-suggest/, '/v1/companies/suggest'),
          },
        },
      },
      plugins: [
        react(),
        {
          name: 'page-theme-api',
          configureServer(server) {
            server.middlewares.use('/api/page-theme', async (req, res, next) => {
              if (req.method !== 'GET') {
                next();
                return;
              }
              try {
                const host = req.headers.host ?? 'localhost';
                const u = new URL(req.url || '/', `http://${host}`);
                const raw = u.searchParams.get('url');
                if (!raw) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'missing url' }));
                  return;
                }
                let target: URL;
                try {
                  target = new URL(raw);
                } catch {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'invalid url' }));
                  return;
                }
                if (target.protocol !== 'http:' && target.protocol !== 'https:') {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'only http(s)' }));
                  return;
                }
                const ctrl = new AbortController();
                const to = setTimeout(() => ctrl.abort(), 8000);
                const r = await fetch(target.toString(), {
                  signal: ctrl.signal,
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (compatible; LyraThemeBot/1.0)',
                    Accept: 'text/html,application/xhtml+xml',
                  },
                });
                clearTimeout(to);
                const html = await r.text();
                const limited = html.slice(0, 600_000);
                const title = limited
                  .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
                  ?.replace(/<[^>]+>/g, '')
                  ?.replace(/\s+/g, ' ')
                  ?.trim();
                const themeColor =
                  limited.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
                  limited.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i)?.[1];
                const description =
                  limited.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
                  limited.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
                const ogImage = limited.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
                const stripped = limited
                  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                const headings: string[] = [];
                const hre = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
                let hm: RegExpExecArray | null;
                while ((hm = hre.exec(limited)) && headings.length < 14) {
                  const text = hm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                  if (text) headings.push(text);
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    url: target.toString(),
                    title,
                    description,
                    themeColor,
                    ogImage,
                    headingHints: headings,
                    sampleText: stripped.slice(0, 4000),
                  }),
                );
              } catch (e) {
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'fetch failed' }));
              }
            });
          },
        },
        {
          name: 'vibe-sandbox-http-sync',
          configureServer(server) {
            server.middlewares.use('/__vibe_sync_sandbox', (req, res, next) => {
              if (req.method !== 'POST') {
                next();
                return;
              }
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body || '{}');
                  const files =
                    parsed.files && typeof parsed.files === 'object'
                      ? (parsed.files as Record<string, string>)
                      : {};
                  const { sandboxDir } = getVibePaths();
                  fs.mkdirSync(sandboxDir, { recursive: true });
                  writeVibeSandboxFiles(sandboxDir, files);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true }));
                } catch (e) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      ok: false,
                      error: e instanceof Error ? e.message : String(e),
                    }),
                  );
                }
              });
            });
          },
        },
        {
          name: 'ide-terminal-ws',
          configureServer(server) {
            server.httpServer?.once('listening', () => {
              const httpServer = server.httpServer;
              if (!httpServer) return;

              const wss = new WebSocketServer({ noServer: true });

              httpServer.on(
                'upgrade',
                (request, socket, head) => {
                  const host = request.headers.host ?? 'localhost';
                  const pathname = new URL(
                    request.url ?? '/',
                    `http://${host}`,
                  ).pathname;
                  if (pathname !== '/__terminal_ws') return;

                  wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
                    let child: ChildProcess | null = null;
                    let currentShell: string = 'powershell';
                    let stdinLineBuffer = '';

                    const cleanup = () => {
                      if (child) {
                        try {
                          child.kill();
                        } catch {
                          /* ignore */
                        }
                        child = null;
                      }
                    };

                    const send = (obj: unknown) => {
                      if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(obj));
                      }
                    };

                    ws.on('message', (raw) => {
                      let msg: {
                        type?: string;
                        shell?: string;
                        data?: string;
                        files?: Record<string, string>;
                      };
                      try {
                        msg = JSON.parse(raw.toString());
                      } catch {
                        return;
                      }

                      if (msg.type === 'sync' && msg.files && typeof msg.files === 'object') {
                        const { sandboxDir } = getVibePaths();
                        try {
                          writeVibeSandboxFiles(
                            sandboxDir,
                            msg.files as Record<string, string>,
                          );
                        } catch (e) {
                          send({
                            type: 'err',
                            message:
                              e instanceof Error ? e.message : 'Sandbox sync failed',
                          });
                        }
                        return;
                      }

                      if (msg.type === 'init' && msg.shell) {
                        cleanup();
                        stdinLineBuffer = '';
                        currentShell = msg.shell;
                        const { projectRoot, sandboxDir } = getVibePaths();
                        fs.mkdirSync(sandboxDir, { recursive: true });
                        const files =
                          msg.files && typeof msg.files === 'object'
                            ? (msg.files as Record<string, string>)
                            : {};
                        try {
                          writeVibeSandboxFiles(sandboxDir, files);
                        } catch (e) {
                          send({
                            type: 'err',
                            message:
                              e instanceof Error ? e.message : 'Sandbox write failed',
                          });
                          return;
                        }
                        const r = spawnVibeShell(msg.shell, sandboxDir, projectRoot);
                        if ('error' in r) {
                          send({ type: 'err', message: r.error });
                          return;
                        }
                        child = r.child;

                        const stdoutLineCarry = { value: '' };
                        const stderrLineCarry = { value: '' };

                        child.stdout?.on('data', (buf: Buffer) => {
                          const data = filterGitBashStreamChunk(
                            msg.shell,
                            buf,
                            stdoutLineCarry,
                          );
                          if (data) send({ type: 'out', data });
                        });
                        child.stderr?.on('data', (buf: Buffer) => {
                          const data = filterGitBashStreamChunk(
                            msg.shell,
                            buf,
                            stderrLineCarry,
                          );
                          if (data) send({ type: 'out', data });
                        });
                        child.on('exit', (code) => {
                          const tail = [
                            flushGitBashLineCarry(msg.shell, stdoutLineCarry),
                            flushGitBashLineCarry(msg.shell, stderrLineCarry),
                          ]
                            .filter(Boolean)
                            .join('');
                          if (tail) send({ type: 'out', data: tail });
                          send({ type: 'exit', code });
                          child = null;
                        });
                        child.on('error', (err: Error) => {
                          send({ type: 'err', message: err.message });
                        });
                        return;
                      }

                      if (msg.type === 'stdin' && child && msg.data !== undefined) {
                        // Normalize line endings so \r\n pastes don't split across UTF-16 code units.
                        // Iterate Unicode code points (for...of) so emoji and surrogate pairs are one unit.
                        const normalized = String(msg.data)
                          .replace(/\r\n/g, '\n')
                          .replace(/\r/g, '\n');

                        for (const ch of normalized) {
                          if (ch === '\b' || ch === '\u007f') {
                            if (stdinLineBuffer.length > 0) {
                              stdinLineBuffer = [...stdinLineBuffer].slice(0, -1).join('');
                              const isWinShell =
                                process.platform === 'win32' &&
                                (currentShell === 'powershell' || currentShell === 'cmd');
                              const out =
                                isWinShell && ch === '\u007f' ? '\b' : ch;
                              child.stdin?.write(out);
                            }
                            continue;
                          }

                          if (ch === '\u0003') {
                            stdinLineBuffer = '';
                            child.stdin?.write(ch);
                            continue;
                          }

                          if (ch === '\n') {
                            const reason = isBlockedTerminalCommand(stdinLineBuffer, currentShell);
                            stdinLineBuffer = '';
                            if (reason) {
                              child.stdin?.write('\u0003');
                              send({ type: 'err', message: `[Vibe] ${reason}` });
                              continue;
                            }
                            child.stdin?.write(currentShell === 'git-bash' ? '\n' : '\r\n');
                            continue;
                          }

                          stdinLineBuffer += ch;
                          child.stdin?.write(ch);
                        }
                      }
                    });

                    ws.on('close', cleanup);
                  });
                },
              );
            });
          },
        },
        {
          name: 'vibe-coder-cmd-bridge',
          configureServer(server) {
            server.middlewares.use('/__vibe_cmd', (req, res, next) => {
              if (req.method !== 'POST') {
                next();
                return;
              }

              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });

              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body || '{}');
                  const command = typeof parsed.command === 'string' ? parsed.command.trim() : '';
                  const requestedCwd = typeof parsed.cwd === 'string' && parsed.cwd.trim() ? parsed.cwd.trim() : process.cwd();

                  if (!command) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing command' }));
                    return;
                  }

                  const escapedCwd = requestedCwd.replace(/"/g, '""');
                  const wrappedCommand = `cd /d "${escapedCwd}" && ${command} & echo __VIBE_CWD__ & cd`;

                  exec(wrappedCommand, {
                    cwd: process.cwd(),
                    shell: 'cmd.exe',
                    timeout: 30_000,
                    windowsHide: true,
                  }, (error, stdout, stderr) => {
                    let cleanStdout = stdout ?? '';
                    let resolvedCwd = requestedCwd;
                    const marker = '__VIBE_CWD__';
                    const markerIndex = cleanStdout.lastIndexOf(marker);
                    if (markerIndex !== -1) {
                      const beforeMarker = cleanStdout.slice(0, markerIndex).trimEnd();
                      const afterMarker = cleanStdout.slice(markerIndex + marker.length).trim();
                      const cwdLines = afterMarker.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
                      if (cwdLines.length > 0) {
                        resolvedCwd = cwdLines[cwdLines.length - 1];
                      }
                      cleanStdout = beforeMarker;
                    }

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      stdout: cleanStdout,
                      stderr: stderr ?? '',
                      exitCode: typeof (error as NodeJS.ErrnoException | null)?.code === 'number'
                        ? (error as NodeJS.ErrnoException).code
                        : 0,
                      error: error?.message ?? null,
                      cwd: resolvedCwd,
                    }));
                  });
                } catch (error) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    error: error instanceof Error ? error.message : 'Failed to execute command',
                  }));
                }
              });
            });
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
