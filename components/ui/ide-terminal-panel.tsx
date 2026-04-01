import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Pencil,
  Plus,
  Terminal as TerminalIcon,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateVibeShellCommand } from '../../lib/gemini';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';

export type ShellKind = 'cmd' | 'powershell' | 'git-bash';

export type IdeTerminalPanelHandle = {
  sendLine: (line: string) => void;
  runVibeInstruction: (instruction: string) => void;
};

type TermTab = {
  id: string;
  shell: ShellKind;
  /** Sessions with the same id render as one split group (side‑by‑side, max 2). */
  groupId: string;
  /** Optional display name in the session list; defaults to shell label. */
  title?: string;
};

const PANEL_TABS = ['Problems', 'Output', 'Debug Console', 'Terminal', 'Ports'] as const;
type TopPanelTab = (typeof PANEL_TABS)[number];

const EXACT_WIN_HEADER =
  'Microsoft Windows [Version 10.0.26200.7840]\r\n(c) Microsoft Corporation. All rights reserved.';

const monoTheme = {
  background: '#000000',
  foreground: '#e4e4e4',
  cursor: '#ffffff',
  cursorAccent: '#000000',
  selectionBackground: '#2a2a2a',
  black: '#000000',
  red: '#c8c8c8',
  green: '#c8c8c8',
  yellow: '#c8c8c8',
  blue: '#b0b0b0',
  magenta: '#b0b0b0',
  cyan: '#b0b0b0',
  white: '#e8e8e8',
  brightBlack: '#707070',
  brightRed: '#e8e8e8',
  brightGreen: '#e8e8e8',
  brightYellow: '#e8e8e8',
  brightBlue: '#e8e8e8',
  brightMagenta: '#e8e8e8',
  brightCyan: '#e8e8e8',
  brightWhite: '#ffffff',
};

/** Full ANSI palette so Git Bash prompt and ls --color render correctly. */
const gitBashColorTheme = {
  background: '#0c0c0c',
  foreground: '#d4d4d4',
  cursor: '#7cfc00',
  cursorAccent: '#0c0c0c',
  selectionBackground: '#264f78',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#ffffff',
};

/**
 * Git Bash over pipes: normalize CRLF only. Do NOT convert lone \\r to \\n — that breaks
 * readline prompt redraw and causes text to jump / center randomly in xterm.
 * Also strip non-TTY job-control noise (server filters too; this is a safety net).
 */
function normalizeGitBashChunk(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/bash: cannot set terminal process group[^\n]*/g, '')
    .replace(/bash: no job control in this shell[^\n]*/g, '');
}

/** Keep PowerShell output compact in the integrated terminal view. */
function normalizePowerShellChunk(s: string): string {
  let out = s;
  // Remove PowerShell location banners even if chunked differently.
  out = out.replace(/^\s*Directory:\s+[^\r\n]*\r?\n?/gim, '');
  out = out.replace(/^\s*Mode\s+LastWriteTime\s+Length\s+Name\s*\r?\n?/gim, '');
  out = out.replace(/^\s*-{2,}\s+-{2,}\s+-{2,}\s+-{2,}\s*\r?\n?/gim, '');
  // Collapse repeated blank lines to a single break.
  out = out.replace(/(\r?\n){2,}/g, '\r\n');
  return out;
}

/** Normalizes cmd.exe banner to the exact two-line block + one blank line before the prompt. */
class CmdBannerNormalizer {
  private buf = '';
  private done = false;

  feed(chunk: string): string {
    if (this.done) return chunk;
    this.buf += chunk;
    const marker = 'All rights reserved.';
    const mi = this.buf.indexOf(marker);
    if (mi === -1) {
      if (this.buf.length > 16_000) {
        this.done = true;
        const o = this.buf;
        this.buf = '';
        return o;
      }
      return '';
    }
    const headerEnd = mi + marker.length;
    const head = this.buf.slice(0, headerEnd);
    const tail = this.buf.slice(headerEnd);
    const winRe =
      /Microsoft\s+Windows\s+\[Version[^\]]+\]\s*\r?\n\s*\(c\)\s+Microsoft Corporation\.\s+All rights reserved\./i;
    if (!winRe.test(head)) {
      this.done = true;
      const o = this.buf;
      this.buf = '';
      return o;
    }
    this.done = true;
    this.buf = '';
    const rest = tail.replace(/^[\r\n]+/, '');
    return `${EXACT_WIN_HEADER}\r\n\r\n${rest}`;
  }
}

function shellLabel(s: ShellKind): string {
  if (s === 'git-bash') return 'Git Bash';
  if (s === 'powershell') return 'PowerShell';
  if (s === 'cmd') return 'Command Prompt';
  return s;
}

function tabDisplayLabel(t: TermTab): string {
  const custom = t.title?.trim();
  if (custom) return custom;
  return shellLabel(t.shell);
}

function wsUrl(): string {
  const p = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${p}//${window.location.host}/__terminal_ws`;
}

/** White-outline session glyphs (text-free, VS Code–style) */
function CmdListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2.5" width="12" height="11" rx="1" stroke="#ffffff" strokeWidth="1.1" fill="none" />
      <path
        d="M4.5 7.5h4M4.5 9.5h5.5M4.5 11.5h3"
        stroke="#ffffff"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PowerShellListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2.5" width="12" height="11" rx="1" stroke="#ffffff" strokeWidth="1.1" fill="none" />
      <path d="M5 11.5L9.5 8 5 4.5" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GitBashListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="5" cy="5" r="2" stroke="#ffffff" strokeWidth="1.1" fill="none" />
      <circle cx="11" cy="5" r="2" stroke="#ffffff" strokeWidth="1.1" fill="none" />
      <circle cx="8" cy="11" r="2" stroke="#ffffff" strokeWidth="1.1" fill="none" />
      <path d="M6.3 6.2L7.2 9M9.7 6.2L8.8 9" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

/** VS Code split list: ┌ first, └ last, ├ between (grey). */
function splitListConnector(allTabs: TermTab[], tab: TermTab): string {
  const group = allTabs.filter((t) => t.groupId === tab.groupId);
  if (group.length < 2) return '';
  const idx = group.findIndex((t) => t.id === tab.id);
  if (idx === 0) return '\u250c';
  if (idx === group.length - 1) return '\u2514';
  return '\u251c';
}

function VsCodeMenuShortcut({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto shrink-0 pl-4 text-[11px] font-normal tabular-nums text-[#858585]">{children}</span>
  );
}

type VibePhase = 'idle' | 'input' | 'thinking' | 'streaming';

type VibeState = {
  tabId: string | null;
  phase: VibePhase;
  buffer: string;
  ghostVisible: boolean;
  /** Italic SGR for typed intent (distinct from shell; not a color change). */
  intentItalic: boolean;
  /** Whether we used ANSI cursor save (`\x1b[s`) before rendering thinking below the prompt. */
  cursorSaved: boolean;
};

const VIBE_GHOST = 'Type intent · Enter to run · Esc exits';
const VIBE_GHOST_BASH = 'vibe> enter to run, esc cancel';

function vibeGhostHint(shell: ShellKind): string {
  if (shell === 'git-bash') return VIBE_GHOST_BASH;
  return VIBE_GHOST;
}

/** Plain resume prompt (no ANSI) — matches shell, neutral for Vibe mode. */
function vibePromptPlain(shell: ShellKind): string {
  // IMPORTANT: include the trailing space after `>` / `$` because PTY echo starts at
  // the cursor position right after that space.
  if (shell === 'powershell')
    return 'PS C:\\Users\\Luke\\Downloads\\Lyra AI\\.vibe-sandbox> ';
  if (shell === 'cmd') return 'C:\\Users\\Luke\\Downloads\\Lyra AI\\.vibe-sandbox> ';
  return 'vibe@host MINGW64 ~/Downloads/Lyra AI/.vibe-sandbox (main) $ ';
}

async function sleepMs(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Smooth shimmer tick while waiting for AI (whole line redraws each frame, not char-by-char). */
const THINK_SHIMMER_TICK_MS = 55;

/** Same shimmer, but draws it *after* the shell prompt on the current line. */
function renderThinkingShimmerAtPrompt(term: Terminal, promptLen: number, frame: number) {
  const label = 'thinking';
  const phase = frame * 0.35;
  const minGray = 240;
  const maxGray = 255;

  let out = '';
  for (let i = 0; i < label.length; i++) {
    const t = (i / Math.max(label.length - 1, 1)) * Math.PI * 2;
    const wave = (Math.cos(t - phase) + 1) / 2;
    const gray = Math.round(minGray + wave * (maxGray - minGray));
    out += `\x1b[38;5;${gray}m${label[i]}`;
  }

  // Go to column after prompt, clear remainder, then render shimmer inline.
  term.write('\r');
  term.write(`\x1b[${promptLen}C`);
  term.write('\x1b[K');
  term.write(`\x1b[90m▸ \x1b[0m${out}\x1b[90m…\x1b[0m`);
}

type TabSessionProps = {
  tab: TermTab;
  /** Keyboard focus target within the panel. */
  isFocused: boolean;
  /** Pane is visible and in the active split group (receives pointer events + fit). */
  interactive: boolean;
  registerWs: (id: string, ws: WebSocket | null) => void;
  registerTerminal: (id: string, term: Terminal | null) => void;
  /** For aligning AI output: track xterm cursor position. */
  registerCursorPos: (id: string, x: number, y: number) => void;
  /** Return true if the keystroke was consumed (e.g. Vibe Ctrl+K line). */
  onTerminalDataRef: React.MutableRefObject<(tabId: string, data: string) => boolean>;
  terminalVisible: boolean;
  /** Mirrored Vibe Coder files for the sandbox (ls/dir only see these). */
  workspaceFiles: Record<string, string>;
  onFocusPane?: () => void;
};

function TabSession({
  tab,
  isFocused,
  interactive,
  registerWs,
  registerTerminal,
  registerCursorPos,
  onTerminalDataRef,
  terminalVisible,
  workspaceFiles,
  onFocusPane,
}: TabSessionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const workspaceFilesRef = useRef(workspaceFiles);
  useEffect(() => {
    workspaceFilesRef.current = workspaceFiles;
  }, [workspaceFiles]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const cmdNormalizer = tab.shell === 'cmd' ? new CmdBannerNormalizer() : null;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Consolas, "Cascadia Mono", "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.25,
      letterSpacing: 0,
      theme: tab.shell === 'git-bash' ? gitBashColorTheme : monoTheme,
      scrollback: 5000,
      padding: { top: 6, bottom: 6, left: 14, right: 10 },
      windowsMode: tab.shell === 'cmd' || tab.shell === 'powershell',
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    termRef.current = term;
    registerTerminal(tab.id, term);
    fitRef.current = fit;

    const cursorDisposable = term.onCursorMove(() => {
      // xterm buffer cursorX is 0-based (cells), cursorY is 0-based (rows).
      // We store it so AI execution can align its output precisely.
      registerCursorPos(tab.id, term.buffer.cursorX, term.buffer.cursorY);
    });

    const ws = new WebSocket(wsUrl());

    const flushFit = () => {
      try {
        fit.fit();
      } catch {
        /* ignore */
      }
    };

    ws.onopen = () => {
      wsRef.current = ws;
      registerWs(tab.id, ws);
      ws.send(
        JSON.stringify({
          type: 'init',
          shell: tab.shell,
          files: workspaceFilesRef.current,
        }),
      );
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as {
          type: string;
          data?: string;
          message?: string;
          code?: number | null;
        };
        if (msg.type === 'out' && msg.data !== undefined) {
          if (tab.shell === 'cmd' && cmdNormalizer) {
            const out = cmdNormalizer.feed(msg.data);
            if (out) term.write(out);
          } else if (tab.shell === 'powershell') {
            term.write(normalizePowerShellChunk(msg.data));
          } else if (tab.shell === 'git-bash') {
            term.write(normalizeGitBashChunk(msg.data));
          } else {
            term.write(msg.data);
          }
        } else if (msg.type === 'err' && msg.message) {
          term.writeln(`\r\n\x1b[37m${msg.message}\x1b[0m`);
        } else if (msg.type === 'exit') {
          term.writeln(`\r\n\x1b[37m[Process exited with code ${msg.code ?? '?'}]\x1b[0m`);
        }
      } catch {
        /* ignore */
      }
    };

    ws.onerror = () => {
      term.writeln(
        '\r\n\x1b[37mCould not connect to the terminal bridge. Is the dev server running?\x1b[0m',
      );
    };

    ws.onclose = () => {
      wsRef.current = null;
      registerWs(tab.id, null);
    };

    const onData = (data: string) => {
      if (onTerminalDataRef.current(tab.id, data)) return;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stdin', data }));
      }
    };
    const dataDisposable = term.onData(onData);

    const ro = new ResizeObserver(() => {
      flushFit();
    });
    ro.observe(el);
    queueMicrotask(flushFit);

    return () => {
      ro.disconnect();
      dataDisposable.dispose();
      cursorDisposable.dispose();
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      registerWs(tab.id, null);
      registerTerminal(tab.id, null);
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [tab.id, tab.shell, registerWs, registerTerminal, onTerminalDataRef]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ type: 'sync', files: workspaceFiles }));
    } catch {
      /* ignore */
    }
  }, [workspaceFiles]);

  useEffect(() => {
    if (!interactive || !terminalVisible || !fitRef.current || !containerRef.current) return;
    const timer = window.setTimeout(() => {
      try {
        fitRef.current?.fit();
      } catch {
        /* ignore */
      }
    }, 60);
    return () => window.clearTimeout(timer);
  }, [interactive, terminalVisible]);

  useEffect(() => {
    if (!isFocused || !terminalVisible || !termRef.current) return;
    const id = window.setTimeout(() => {
      try {
        termRef.current?.focus();
      } catch {
        /* ignore */
      }
    }, 80);
    return () => window.clearTimeout(id);
  }, [isFocused, terminalVisible]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'ide-terminal-session-root box-border h-full min-h-0 w-full min-w-0 overflow-hidden select-text',
        interactive && terminalVisible && 'pointer-events-auto',
      )}
      aria-hidden={!interactive || !terminalVisible}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        onFocusPane?.();
        termRef.current?.focus();
      }}
    />
  );
}

function defaultInitialTabs(): { tabs: TermTab[]; activeId: string } {
  const id = crypto.randomUUID();
  const groupId = crypto.randomUUID();
  return {
    tabs: [{ id, shell: 'powershell', groupId }],
    activeId: id,
  };
}

function placeholderCopy(tab: TopPanelTab): { title: string; subtitle: string } {
  switch (tab) {
    case 'Problems':
      return {
        title: 'No problems',
        subtitle: 'Workspace diagnostics will appear here when available.',
      };
    case 'Output':
      return {
        title: 'Output',
        subtitle: 'Task and extension output streams will show in this panel.',
      };
    case 'Debug Console':
      return {
        title: 'Debug Console',
        subtitle: 'Start a debug session to view evaluation and log output.',
      };
    case 'Ports':
      return {
        title: 'Ports',
        subtitle: 'Forwarded ports from running processes will be listed here.',
      };
    default:
      return { title: '', subtitle: '' };
  }
}

export const IdeTerminalPanel = forwardRef<
  IdeTerminalPanelHandle,
  {
    isOpen: boolean;
    onClose: () => void;
    /** Vibe Coder virtual files mirrored to the server sandbox (terminal cwd). */
    workspaceFiles?: Record<string, string>;
  }
>(function IdeTerminalPanel({ isOpen, onClose, workspaceFiles }, ref) {
  const [tabs, setTabs] = useState<TermTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [maximized, setMaximized] = useState(false);
  const [topPanelTab, setTopPanelTab] = useState<TopPanelTab>('Terminal');
  const [renameState, setRenameState] = useState<{ id: string; value: string } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const skipRenameBlurCommitRef = useRef(false);
  const panelRootRef = useRef<HTMLDivElement>(null);
  const [panelHeightPx, setPanelHeightPx] = useState(256);
  const wsMapRef = useRef<Map<string, WebSocket>>(new Map());
  const terminalMapRef = useRef<Map<string, Terminal>>(new Map());
  const activeTabIdRef = useRef<string | null>(null);
  const cursorPosByTabRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const registerCursorPos = useCallback((id: string, x: number, y: number) => {
    cursorPosByTabRef.current.set(id, { x, y });
  }, []);

  const registerTerminal = useCallback((id: string, term: Terminal | null) => {
    const m = terminalMapRef.current;
    if (term) m.set(id, term);
    else m.delete(id);
  }, []);

  const vibeStateRef = useRef<VibeState>({
    tabId: null,
    phase: 'idle',
    buffer: '',
    ghostVisible: false,
    intentItalic: false,
    cursorSaved: false,
  });
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const vibeRunIdRef = useRef(0);

  const onTerminalDataRef = useRef<(tabId: string, data: string) => boolean>(() => false);

  const exitVibeMode = useCallback(() => {
    const st = vibeStateRef.current;
    const term = st.tabId ? terminalMapRef.current.get(st.tabId) : null;
    vibeRunIdRef.current++;
    if (term && st.intentItalic) term.write('\x1b[23m');

    if (term && (st.phase === 'thinking' || st.phase === 'streaming')) {
      // Clear inline thinking shimmer and keep cursor at prompt end.
      const shell = tabsRef.current.find((t) => t.id === st.tabId)?.shell ?? 'powershell';
      const prompt = vibePromptPlain(shell);
      term.write('\r');
      term.write(`\x1b[${prompt.length}C`);
      term.write('\x1b[K');
    } else if (term && st.cursorSaved) {
      // Restore the cursor back to the shell prompt line so cancel does not
      // leave an extra blank line.
      term.write('\x1b8');
      term.write('\x1b[K');
    } else if (term && st.phase === 'input' && st.buffer.length > 0) {
      // Clear the locally-rendered intent so the next shell prompt is clean.
      term.write(`\x1b[${st.buffer.length}D`);
      term.write('\x1b[K');
    }

    vibeStateRef.current = {
      tabId: null,
      phase: 'idle',
      buffer: '',
      ghostVisible: false,
      intentItalic: false,
      cursorSaved: false,
    };
    term?.focus();
  }, []);

  const runVibeAiStream = useCallback(async (instruction: string, tabId: string) => {
    const term = terminalMapRef.current.get(tabId);
    const ws = wsMapRef.current.get(tabId);
    if (!term) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      term.write('\r\n\x1b[90m[vibe] terminal not connected\x1b[0m\r\n');
      return;
    }
    const shell = tabsRef.current.find((t) => t.id === tabId)?.shell ?? 'powershell';
    const runId = ++vibeRunIdRef.current;
    const prompt = vibePromptPlain(shell);
    const promptLen = prompt.length;
    vibeStateRef.current = {
      tabId,
      phase: 'thinking',
      buffer: '',
      ghostVisible: false,
      intentItalic: false,
      cursorSaved: false,
    };
    // Clear any locally-typed intent that may exist after the prompt
    // and draw thinking inline on the prompt line.
    term.write('\r');
    term.write(`\x1b[${promptLen}C`);
    term.write('\x1b[K');

    const cmdPromise = generateVibeShellCommand(instruction, shell);
    const TICK = Symbol('tick');
    let frame = 0;
    let cmd = '';
    try {
      while (true) {
        if (vibeRunIdRef.current !== runId) return;
        const r = await Promise.race([
          cmdPromise,
          sleepMs(THINK_SHIMMER_TICK_MS).then(() => TICK as const),
        ]);
        if (r === TICK) {
          if (vibeRunIdRef.current !== runId) return;
          renderThinkingShimmerAtPrompt(term, promptLen, frame++);
          continue;
        }
        cmd = String(r).trim();
        break;
      }
    } catch {
      term.write('\r\n\x1b[90m[vibe] could not plan a command\x1b[0m\r\n');
      vibeStateRef.current = {
        tabId: null,
        phase: 'idle',
        buffer: '',
        ghostVisible: false,
        intentItalic: false,
        cursorSaved: false,
      };
      return;
    }

    if (!cmd) {
      term.write('\r\n\x1b[90m[vibe] empty command\x1b[0m\r\n');
      vibeStateRef.current = {
        tabId: null,
        phase: 'idle',
        buffer: '',
        ghostVisible: false,
        intentItalic: false,
        cursorSaved: false,
      };
      return;
    }

    if (vibeRunIdRef.current !== runId) return;
    vibeStateRef.current = { ...vibeStateRef.current, phase: 'streaming' };
    // Move to prompt end, clear inline thinking, then let the shell echo render the command.
    term.write('\r');
    term.write(`\x1b[${promptLen}C`);
    term.write('\x1b[K');
    // Wait a tick so xterm updates internal cursor state, then correct any
    // off-by-one alignment using the tracked cursor position.
    await new Promise((r) => setTimeout(r, 0));
    const pos = cursorPosByTabRef.current.get(tabId);
    if (pos) {
      const delta = promptLen - pos.x;
      if (delta > 0) term.write(`\x1b[${delta}C`);
      else if (delta < 0) term.write(`\x1b[${Math.abs(delta)}D`);
    }

    const eol = shell === 'git-bash' ? '\n' : '\r\n';
    try {
      // Now type into the real shell via stdin (shell echo will render the command).
      // This keeps cursor alignment correct for PowerShell/cmd and reduces "off by line" issues.
      // Small per-char delay for a "user typing" feel.
      for (let i = 0; i < cmd.length; i++) {
        if (vibeRunIdRef.current !== runId) return;
        ws.send(JSON.stringify({ type: 'stdin', data: cmd[i] }));
        await sleepMs(cmd[i] === ' ' ? 18 : 10);
      }

      // Wait 1s before "Enter" so it feels deliberate.
      await sleepMs(1000);
      if (vibeRunIdRef.current !== runId) return;

      // Execute.
      ws.send(JSON.stringify({ type: 'stdin', data: eol }));
    } catch {
      term.write('\r\n\x1b[90m[vibe] could not send to shell\x1b[0m\r\n');
    }

    vibeStateRef.current = {
      tabId: null,
      phase: 'idle',
      buffer: '',
      ghostVisible: false,
      intentItalic: false,
      cursorSaved: false,
    };
  }, []);

  const startVibeInputLine = useCallback((tabId: string) => {
    const tab = tabsRef.current.find((t) => t.id === tabId);
    const term = terminalMapRef.current.get(tabId);
    if (!tab || !term) return;
    const ghost = vibeGhostHint(tab.shell);
    vibeStateRef.current = {
      tabId,
      phase: 'input',
      buffer: '',
      ghostVisible: true,
      intentItalic: false,
      cursorSaved: false,
    };
    // The real shell prompt already exists; we only overlay a ghost hint on the same line
    // and move the cursor back to the start of that ghost text for intent typing.
    term.write(`\x1b[90m${ghost}\x1b[0m`);
    term.write(`\x1b[${ghost.length}D`);
    term.focus();
  }, []);

  useLayoutEffect(() => {
    onTerminalDataRef.current = (tabId: string, data: string) => {
      const st = vibeStateRef.current;
      if (!st.tabId || st.tabId !== tabId) return false;
      if (st.phase === 'thinking' || st.phase === 'streaming') {
        // Allow cancelling Vibe execution immediately.
        if (data.includes('\x03') || data === '\x1b') {
          exitVibeMode();
        }
        return true;
      }
      if (st.phase !== 'input') return false;

      const term = terminalMapRef.current.get(tabId);
      if (!term) return false;

      if (data.includes('\x1b[200~') || data.includes('\x1b[201~')) return false;

      for (const unit of data) {
        const code = unit.codePointAt(0)!;

        if (code === 3) {
          exitVibeMode();
          return true;
        }
        if (code === 13 || code === 10) {
          const rawIntent = st.buffer;
          const rawLen = rawIntent.length;
          const cmd = rawIntent.trim();
          st.buffer = '';
          st.ghostVisible = false;
          if (st.intentItalic) {
            term.write('\x1b[23m');
            st.intentItalic = false;
          }

          if (cmd) {
            // Save the cursor at the end of the shell prompt (start of the intent text),
            // then move the cursor back to the end of the line so thinking renders below
            // without deleting the user's request text.
            if (rawLen > 0) {
              term.write(`\x1b[${rawLen}D`);
              term.write('\x1b7');
              vibeStateRef.current.cursorSaved = true;
              term.write(`\x1b[${rawLen}C`);
            } else {
              vibeStateRef.current.cursorSaved = false;
            }
            void runVibeAiStream(cmd, tabId);
          } else {
            vibeStateRef.current = {
              tabId: null,
              phase: 'idle',
              buffer: '',
              ghostVisible: false,
              intentItalic: false,
              cursorSaved: false,
            };
            term.write('\r\n');
          }
          return true;
        }
        if (code === 27) {
          exitVibeMode();
          return true;
        }
        if (code === 8 || code === 127) {
          if (st.buffer.length > 0) {
            st.buffer = st.buffer.slice(0, -1);
            term.write('\b \b');
          }
          continue;
        }
        if (code < 32) continue;
        if (st.ghostVisible) {
          term.write('\x1b[K');
          st.ghostVisible = false;
          term.write('\x1b[3m');
          st.intentItalic = true;
        }
        st.buffer += unit;
        term.write(unit);
      }
      return true;
    };
  }, [exitVibeMode, runVibeAiStream]);

  useEffect(() => {
    if (!isOpen || topPanelTab !== 'Terminal') return;
    const onKey = (e: KeyboardEvent) => {
      const vs = vibeStateRef.current;
      if (vs.phase === 'thinking' || vs.phase === 'streaming') {
        if (e.key === 'Escape' || (e.ctrlKey && e.key.toLowerCase() === 'c')) {
          e.preventDefault();
          e.stopPropagation();
          exitVibeMode();
        }
        return;
      }
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        const id = activeTabIdRef.current;
        if (!id) return;
        if (vs.phase === 'input' && vs.tabId === id) {
          exitVibeMode();
        } else {
          startVibeInputLine(id);
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, topPanelTab, exitVibeMode, startVibeInputLine]);

  useEffect(() => {
    if (!renameState) return;
    const el = renameInputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [renameState?.id]);

  useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  const registerWs = useCallback((id: string, ws: WebSocket | null) => {
    const m = wsMapRef.current;
    if (ws) m.set(id, ws);
    else m.delete(id);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setTabs((prev) => {
        if (prev.length > 0) return prev;
        const { tabs: t, activeId } = defaultInitialTabs();
        setActiveTabId(activeId);
        return t;
      });
    });
  }, [isOpen]);

  useEffect(() => {
    if (tabs.length === 1 && activeTabId === null) {
      const id = tabs[0]?.id;
      if (id) queueMicrotask(() => setActiveTabId(id));
    }
  }, [tabs, activeTabId]);

  useImperativeHandle(ref, () => ({
    sendLine: (line: string) => {
      const id = activeTabIdRef.current;
      if (!id) return;
      const ws = wsMapRef.current.get(id);
      if (ws?.readyState !== WebSocket.OPEN) return;
      const shell = tabsRef.current.find((t) => t.id === id)?.shell ?? 'powershell';
      const eol = shell === 'git-bash' ? '\n' : '\r\n';
      ws.send(JSON.stringify({ type: 'stdin', data: `${line}${eol}` }));
    },
    runVibeInstruction: (instruction: string) => {
      const id = activeTabIdRef.current;
      if (!id) return;
      const cmd = String(instruction || '').trim();
      if (!cmd) return;
      setTopPanelTab('Terminal');
      void runVibeAiStream(cmd, id);
    },
  }));

  const addTab = useCallback((shell: ShellKind) => {
    const id = crypto.randomUUID();
    const groupId = crypto.randomUUID();
    setTabs((prev) => [...prev, { id, shell, groupId }]);
    setActiveTabId(id);
    setTopPanelTab('Terminal');
  }, []);

  const splitTerminal = useCallback((shell?: ShellKind) => {
    const id = activeTabIdRef.current;
    const cur = tabs.find((t) => t.id === id);
    if (!cur) return;
    if (tabs.filter((t) => t.groupId === cur.groupId).length >= 2) return;
    const newId = crypto.randomUUID();
    const nextShell = shell ?? cur.shell;
    const idx = tabs.findIndex((t) => t.id === id);
    setTabs((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, { id: newId, shell: nextShell, groupId: cur.groupId });
      return next;
    });
    setActiveTabId(newId);
    setTopPanelTab('Terminal');
  }, [tabs]);

  const commitRename = useCallback(() => {
    if (skipRenameBlurCommitRef.current) return;
    setRenameState((cur) => {
      if (!cur) return null;
      const v = cur.value.trim();
      setTabs((prev) =>
        prev.map((t) => (t.id === cur.id ? { ...t, title: v || undefined } : t)),
      );
      return null;
    });
  }, []);

  const cancelRename = useCallback(() => {
    skipRenameBlurCommitRef.current = true;
    setRenameState(null);
    queueMicrotask(() => {
      skipRenameBlurCommitRef.current = false;
    });
  }, []);

  const removeTab = (id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const { tabs: t, activeId } = defaultInitialTabs();
        setActiveTabId(activeId);
        return t;
      }
      if (activeTabId === id) {
        const idx = prev.findIndex((t) => t.id === id);
        const fallback = next[Math.max(0, idx - 1)] ?? next[0];
        setActiveTabId(fallback ? fallback.id : null);
      }
      return next;
    });
    wsMapRef.current.delete(id);
    terminalMapRef.current.delete(id);
    setRenameState((cur) => (cur?.id === id ? null : cur));
  };

  const MIN_PANEL_HEIGHT = 120;

  const startPanelResize = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      let startH = panelHeightPx;
      if (maximized && panelRootRef.current) {
        startH = Math.round(panelRootRef.current.getBoundingClientRect().height);
        setPanelHeightPx(startH);
      }
      setMaximized(false);
      const startY = e.clientY;
      const maxH = Math.floor(window.innerHeight * 0.92);
      const onMove = (ev: MouseEvent) => {
        const delta = startY - ev.clientY;
        const next = Math.min(maxH, Math.max(MIN_PANEL_HEIGHT, startH + delta));
        setPanelHeightPx(next);
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [maximized, panelHeightPx],
  );

  const clearActiveTerminal = useCallback(() => {
    const id = activeTabIdRef.current;
    if (!id) return;
    const ws = wsMapRef.current.get(id);
    if (ws?.readyState !== WebSocket.OPEN) return;
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    let data = 'cls\r\n';
    if (tab.shell === 'powershell') data = 'Clear-Host\r\n';
    else if (tab.shell === 'git-bash') data = 'clear\r\n';
    ws.send(JSON.stringify({ type: 'stdin', data }));
  }, [tabs]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return;
      const backtick = e.code === 'Backquote' || e.key === '`';
      if (backtick && !e.altKey) {
        e.preventDefault();
        addTab('powershell');
        return;
      }
      if (e.key === '5' || e.code === 'Digit5') {
        e.preventDefault();
        splitTerminal();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, addTab, splitTerminal]);

  if (!isOpen) return null;

  const sandboxFiles = workspaceFiles ?? {};

  const showTerminal = topPanelTab === 'Terminal';

  const activeGroupId =
    tabs.find((t) => t.id === activeTabId)?.groupId ?? tabs[0]?.groupId ?? '';
  const isSplitActive = tabs.filter((t) => t.groupId === activeGroupId).length > 1;

  const toolbarIconBtn =
    'inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-[#c8c8c8] transition-colors duration-150 hover:bg-white/[0.06] hover:text-[#f2f2f2] focus-visible:ring-1 focus-visible:ring-[#0078d4] focus-visible:ring-offset-0 focus-visible:ring-offset-black';
  const dropdownClass =
    'min-w-[10rem] rounded-md border border-[#3c3c3c] bg-[#1e1e1e] p-1 text-[13px] text-[#cccccc] shadow-[0_8px_24px_rgba(0,0,0,0.45)]';
  const dropdownItemClass =
    'cursor-pointer rounded-sm px-2.5 py-1.5 text-[13px] text-[#cccccc] data-[highlighted]:bg-[#2a2d2e] data-[highlighted]:text-[#cccccc] focus:bg-[#2a2d2e] focus:text-[#cccccc]';
  const vsTerminalMenuClass =
    'min-w-[280px] rounded-md border border-[#3c3c3c] bg-[#1e1e1e] p-1 text-[13px] text-[#cccccc] shadow-[0_8px_24px_rgba(0,0,0,0.45)] data-[state=open]:duration-200';
  const vsTerminalMenuItemClass =
    'relative flex w-full cursor-default select-none items-center rounded-sm px-2.5 py-[7px] text-[13px] text-[#cccccc] outline-none transition-colors duration-150 ease-out data-[highlighted]:bg-[#2a2d2e] data-[highlighted]:text-[#f3f3f3] focus:bg-[#2a2d2e] focus:text-[#f3f3f3]';

  const sessionToolbar = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-7 shrink-0 items-center gap-0.5 rounded px-1.5 text-[#cccccc] transition-colors duration-150 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0078d4] focus-visible:ring-offset-0 focus-visible:ring-offset-black"
            title="Terminal menu"
            aria-label="Terminal menu"
          >
            <Plus className="size-[15px]" strokeWidth={1.5} />
            <ChevronDown className="size-3 opacity-90" strokeWidth={1.75} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={vsTerminalMenuClass}>
          <DropdownMenuItem className={vsTerminalMenuItemClass} onSelect={() => addTab('powershell')}>
            <span className="flex-1 text-left">New Terminal</span>
            <VsCodeMenuShortcut>{'Ctrl+Shift+' + '`'}</VsCodeMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={vsTerminalMenuItemClass}>
              <span className="flex-1 text-left">Split Terminal</span>
              <VsCodeMenuShortcut>Ctrl+Shift+5</VsCodeMenuShortcut>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={vsTerminalMenuClass}>
              <DropdownMenuItem className={vsTerminalMenuItemClass} onSelect={() => splitTerminal('powershell')}>
                <span className="flex-1 text-left">PowerShell</span>
              </DropdownMenuItem>
              <DropdownMenuItem className={vsTerminalMenuItemClass} onSelect={() => splitTerminal('git-bash')}>
                <span className="flex-1 text-left">Git Bash</span>
              </DropdownMenuItem>
              <DropdownMenuItem className={vsTerminalMenuItemClass} onSelect={() => splitTerminal('cmd')}>
                <span className="flex-1 text-left">Command Prompt</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator className="my-1 h-px bg-[#3c3c3c]" />
          <DropdownMenuItem className={vsTerminalMenuItemClass} onSelect={() => addTab('powershell')}>
            <span className="flex-1 text-left">PowerShell</span>
          </DropdownMenuItem>
          <DropdownMenuItem className={vsTerminalMenuItemClass} onSelect={() => addTab('git-bash')}>
            <span className="flex-1 text-left">Git Bash</span>
          </DropdownMenuItem>
          <DropdownMenuItem className={vsTerminalMenuItemClass} onSelect={() => addTab('cmd')}>
            <span className="flex-1 text-left">Command Prompt</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" title="More actions" className={toolbarIconBtn}>
            <MoreHorizontal className="size-[15px]" strokeWidth={1.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={dropdownClass}>
          <DropdownMenuItem
            className={dropdownItemClass}
            onSelect={() => {
              setTopPanelTab('Terminal');
              clearActiveTerminal();
            }}
          >
            Clear Terminal
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-[#3c3c3c]" />
          <DropdownMenuItem className={dropdownItemClass} onSelect={() => setMaximized((m) => !m)}>
            {maximized ? 'Restore panel size' : 'Maximize panel size'}
          </DropdownMenuItem>
          <DropdownMenuItem className={dropdownItemClass} onSelect={onClose}>
            Close panel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        title={maximized ? 'Restore panel size' : 'Maximize panel size'}
        onClick={() => setMaximized((m) => !m)}
        className={toolbarIconBtn}
      >
        {maximized ? (
          <ChevronDown className="size-[15px]" strokeWidth={1.5} />
        ) : (
          <ChevronUp className="size-[15px]" strokeWidth={1.5} />
        )}
      </button>
      <button type="button" title="Close panel" onClick={onClose} className={toolbarIconBtn}>
        <X className="size-[15px]" strokeWidth={1.5} />
      </button>
    </>
  );

  return (
    <div
      ref={panelRootRef}
      className={cn(
        'absolute bottom-0 left-0 right-0 z-20 flex flex-col overflow-hidden rounded-none rounded-t-none border-t border-[#2a2a2a] bg-black',
      )}
      style={{
        fontFamily: '"Segoe WPC", "Segoe UI", system-ui, sans-serif',
        height: maximized ? 'min(52vh, 500px)' : `${panelHeightPx}px`,
      }}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize terminal panel"
        className="group relative h-1.5 shrink-0 cursor-ns-resize select-none touch-none rounded-t-none border-b border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#1a1a1a]"
        onMouseDown={startPanelResize}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-px w-10 -translate-y-1/2 bg-[#5a5a5a] opacity-70" />
      </div>
      <header className="grid h-9 shrink-0 grid-cols-[minmax(0,1fr)_172px] items-stretch bg-black">
        <nav
          className="flex min-h-0 min-w-0 items-center gap-0 overflow-x-auto pl-2 pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Panel tabs"
        >
          {PANEL_TABS.map((name) => {
            const active = topPanelTab === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setTopPanelTab(name)}
                className={cn(
                  'shrink-0 px-2.5 py-1.5 text-[11px] font-normal leading-none tracking-tight transition-colors duration-150',
                  active
                    ? 'bg-white/[0.09] text-[#f2f2f2]'
                    : 'text-[#8f8f8f] hover:bg-white/[0.06] hover:text-[#d4d4d4]',
                )}
              >
                {name}
              </button>
            );
          })}
        </nav>
        <div
          className="flex items-center justify-end gap-0.5 border-l border-[#2a2a2a] bg-black px-1"
          role="toolbar"
          aria-label="Terminal actions"
        >
          {sessionToolbar}
        </div>
      </header>

      <div className="relative grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-1 bg-black">
        <div
          className={cn(
            'col-start-1 row-start-1 flex min-h-0 min-w-0 flex-col',
            !showTerminal && 'pointer-events-none invisible z-0',
            showTerminal && 'z-10',
          )}
          aria-hidden={!showTerminal}
        >
          <div className="relative grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)_172px]">
            <div className="ide-terminal-xterm-host relative z-0 flex min-h-0 min-w-0 flex-1 overflow-hidden bg-black select-text">
              {tabs.map((tab, idx) => {
                const inActiveGroup = tab.groupId === activeGroupId;
                const splitVisible = isSplitActive && inActiveGroup;
                const singleVisible = !isSplitActive && inActiveGroup;
                const hidden = !inActiveGroup;
                return (
                  <div
                    key={tab.id}
                    className={cn(
                      'min-h-0 min-w-0',
                      splitVisible &&
                        'relative z-10 flex flex-1 flex-col border-r border-[#2a2a2a] last:border-r-0',
                      singleVisible && 'absolute inset-0 z-10',
                      hidden && 'pointer-events-none absolute inset-0 z-0 opacity-0',
                    )}
                    aria-hidden={hidden}
                    style={splitVisible ? { order: idx } : undefined}
                  >
                    <TabSession
                      tab={tab}
                      isFocused={activeTabId === tab.id}
                      interactive={showTerminal && inActiveGroup}
                      registerWs={registerWs}
                      registerTerminal={registerTerminal}
                      registerCursorPos={registerCursorPos}
                      onTerminalDataRef={onTerminalDataRef}
                      terminalVisible={showTerminal}
                      workspaceFiles={sandboxFiles}
                      onFocusPane={() => setActiveTabId(tab.id)}
                    />
                  </div>
                );
              })}
            </div>
            <aside
              className="flex min-h-0 min-w-0 flex-col border-l border-[#2a2a2a] bg-black"
              aria-label="Terminal sessions"
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain">
                {tabs.map((t) => {
                  const active = activeTabId === t.id;
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        'group/row flex min-h-[36px] shrink-0 items-center px-1.5 py-1 text-[12px] font-normal',
                        active
                          ? 'bg-[#2a2a2a] text-[#cccccc]'
                          : 'text-[#a0a0a0] hover:bg-[#141414] hover:text-[#cccccc]',
                      )}
                    >
                      {renameState?.id === t.id ? (
                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                          <span
                            className="w-3 shrink-0 text-center font-mono text-[12px] leading-none text-[#6e6e6e]"
                            aria-hidden
                          >
                            {splitListConnector(tabs, t) || '\u00a0'}
                          </span>
                          {t.shell === 'powershell' ? (
                            <PowerShellListIcon className="-ml-0.5 size-[15px] shrink-0" />
                          ) : t.shell === 'cmd' ? (
                            <CmdListIcon className="size-[14px] shrink-0" />
                          ) : (
                            <GitBashListIcon className="size-[14px] shrink-0" />
                          )}
                          <input
                            ref={renameInputRef}
                            type="text"
                            className="min-w-0 flex-1 rounded border border-[#3a3a3a] bg-[#1a1a1a] px-1.5 py-0.5 text-[12px] font-normal leading-tight text-[#ededed] outline-none ring-0 focus:border-[#0078d4]"
                            value={renameState.value}
                            onChange={(e) =>
                              setRenameState((s) => (s ? { ...s, value: e.target.value } : s))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitRename();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelRename();
                              }
                            }}
                            onBlur={() => commitRename()}
                            aria-label="Rename terminal"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-left"
                          onClick={() => setActiveTabId(t.id)}
                        >
                          <span
                            className="w-3 shrink-0 text-center font-mono text-[12px] leading-none text-[#6e6e6e]"
                            aria-hidden
                          >
                            {splitListConnector(tabs, t) || '\u00a0'}
                          </span>
                          {t.shell === 'powershell' ? (
                            <PowerShellListIcon className="-ml-0.5 size-[15px] shrink-0" />
                          ) : t.shell === 'cmd' ? (
                            <CmdListIcon className="size-[14px] shrink-0" />
                          ) : (
                            <GitBashListIcon className="size-[14px] shrink-0" />
                          )}
                          <span className="min-w-0 truncate text-[#cccccc]">{tabDisplayLabel(t)}</span>
                        </button>
                      )}
                      <div
                        className={cn(
                          'flex shrink-0 items-center gap-px transition-opacity duration-150',
                          active
                            ? 'opacity-100'
                            : 'pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100',
                        )}
                      >
                        {renameState?.id !== t.id && (
                          <button
                            type="button"
                            title="Rename"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameState({ id: t.id, value: tabDisplayLabel(t) });
                            }}
                            className="flex size-7 items-center justify-center rounded text-[#c8c8c8] transition-colors hover:bg-white/10 hover:text-[#f3f3f3]"
                          >
                            <Pencil className="size-3" strokeWidth={1.75} />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Kill terminal"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTab(t.id);
                          }}
                          className="flex size-7 items-center justify-center rounded text-[#c8c8c8] transition-colors hover:bg-white/10 hover:text-[#f3f3f3]"
                        >
                          <Trash2 className="size-3" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>

        {!showTerminal && (
          <div className="col-start-1 row-start-1 z-10 flex min-h-0 flex-col items-center justify-center gap-3 bg-black px-6 py-8">
            <TerminalIcon className="size-8 text-[#3d3d3d]" strokeWidth={1.25} aria-hidden />
            <div className="max-w-sm text-center">
              <p className="text-[12px] font-normal text-[#d0d0d0]">{placeholderCopy(topPanelTab).title}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#8a8a8a]">
                {placeholderCopy(topPanelTab).subtitle}
              </p>
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
.ide-terminal-xterm-host .xterm { padding: 0; }
.ide-terminal-xterm-host .xterm-viewport { background-color: #000000 !important; }
.ide-terminal-xterm-host .xterm-screen { background-color: #000000 !important; }
.ide-terminal-xterm-host .xterm .xterm-helper-textarea {
  z-index: 50 !important;
  pointer-events: auto !important;
}
`,
        }}
      />
    </div>
  );
});

IdeTerminalPanel.displayName = 'IdeTerminalPanel2';
