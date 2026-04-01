export type VibeFileForStats = { code: string; language: string };

export function utf8ByteLength(s: string): number {
  try {
    return new TextEncoder().encode(s).length;
  } catch {
    return s.length;
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'] as const;
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  const digits = u === 0 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(digits)} ${units[u]}`;
}

export function computeProjectTotalBytes(files: Record<string, VibeFileForStats>): number {
  let n = 0;
  for (const f of Object.values(files || {})) {
    n += utf8ByteLength(f?.code ?? '');
  }
  return n;
}

const LANG_LABEL: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  python: 'Python',
  text: 'Plain text',
};

function langFromPath(path: string): string {
  const n = path.toLowerCase();
  if (n.endsWith('.tsx')) return 'typescript';
  if (n.endsWith('.ts')) return 'typescript';
  if (n.endsWith('.jsx') || n.endsWith('.js')) return 'javascript';
  if (n.endsWith('.html') || n.endsWith('.htm')) return 'html';
  if (n.endsWith('.css')) return 'css';
  if (n.endsWith('.json')) return 'json';
  if (n.endsWith('.py')) return 'python';
  return 'text';
}

/** Dominant language by UTF-8 size of files in that language. */
export function dominantProgrammingLabel(files: Record<string, VibeFileForStats>): string {
  const weights: Record<string, number> = {};
  for (const [path, f] of Object.entries(files || {})) {
    const key = (f?.language || langFromPath(path)).toLowerCase();
    weights[key] = (weights[key] ?? 0) + utf8ByteLength(f?.code ?? '');
  }
  let best = 'text';
  let max = -1;
  for (const [k, w] of Object.entries(weights)) {
    if (w > max) {
      max = w;
      best = k;
    }
  }
  return LANG_LABEL[best] ?? best.charAt(0).toUpperCase() + best.slice(1);
}
