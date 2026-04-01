import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2,
  CheckCircle2,
  Search,
  RotateCcw,
  Plus,
  MoreHorizontal,
  Layers,
  Globe,
  Eye,
  LayoutGrid,
  ChevronRight,
  Rocket,
  ChevronDown,
  FileCode,
  FileJson,
  Folder,
  FolderPlus,
  XCircle,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { PromptInputBox } from './prompt-input-box';
import { ConfirmDialog, PromptDialog } from './native-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  streamChat,
  generateVibeQuickPrompts,
  generateTitle,
  streamVibeWorkspaceAudit,
  type StreamChatImageAttachment,
} from '../../lib/gemini';
import { ChatMessage } from './chat-message';
import {
  TextShimmer,
  ShimmerOrb,
  VIBE_THINKING_SHIMMER_DURATION,
  vibeThinkingShimmerClassName,
} from './text-shimmer';
import Editor from '@monaco-editor/react';
import { IdeTerminalPanel, type IdeTerminalPanelHandle } from './ide-terminal-panel';
import vibePreviewRuntimeSource from './vibe-preview-runtime.js?raw';
import {
  buildWebsiteIntentAddendum,
  buildWebsiteThemeResearchAddendumAsync,
  detectWebsiteThemeKey,
  extractCompanyNameFromPrompt,
  resolveCompanySite,
} from '../../lib/theme-research';
import {
  VibeProjectsDashboard,
  type VibeDashboardProjectVM,
  type VibeDashboardTab,
} from './vibe-projects-dashboard';
import {
  computeProjectTotalBytes,
  dominantProgrammingLabel,
  formatBytes,
  utf8ByteLength,
} from '../../lib/vibe-project-stats';

const HtmlIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128" aria-hidden>
    <path
      fill="#E44D26"
      d="M19.037 113.876L9.032 1.661h109.936l-10.016 112.198-45.019 12.48z"
    />
    <path fill="#F16529" d="M64 116.8l36.378-10.086 8.559-95.878H64z" />
    <path
      fill="#EBEBEB"
      d="M64 52.455H45.788L44.53 38.361H64V24.599H29.489l.33 3.692 3.382 37.927H64zm0 35.743l-.061.017-15.327-4.14-.979-10.975H33.816l1.928 21.609 28.193 7.826.063-.017z"
    />
    <path
      fill="#fff"
      d="M63.952 52.455v13.763h16.947l-1.597 17.849-15.35 4.143v14.319l28.215-7.82.207-2.325 3.234-36.233.335-3.696h-3.708zm0-27.856v13.762h33.244l.276-3.092.628-6.978.329-3.692z"
    />
  </svg>
);

const CssIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128" aria-hidden>
    <path
      fill="#1572B6"
      d="M18.814 114.123L8.76 1.352h110.48l-10.064 112.754-45.243 12.543-45.119-12.526z"
    />
    <path fill="#33A9DC" d="M64.001 117.062l36.559-10.136 8.601-96.354h-45.16v106.49z" />
    <path
      fill="#fff"
      d="M64.001 51.429h18.302l1.264-14.163H64.001V23.435h34.682l-.332 3.711-3.4 38.114h-30.95V51.429z"
    />
    <path
      fill="#EBEBEB"
      d="M64.083 87.349l-.061.018-15.403-4.159-.985-11.031H33.752l1.937 21.717 28.331 7.863.063-.018v-14.39z"
    />
    <path
      fill="#fff"
      d="M81.127 64.675l-1.666 18.522-15.426 4.164v14.39l28.354-7.858.208-2.337 2.406-26.881H81.127z"
    />
    <path
      fill="#EBEBEB"
      d="M64.048 23.435v13.831H30.64l-.277-3.108-.63-7.012-.331-3.711h34.646zm-.047 27.996v13.831H48.792l-.277-3.108-.631-7.012-.33-3.711h16.447z"
    />
  </svg>
);

const JsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128" aria-hidden>
    <path fill="#F0DB4F" d="M1.408 1.408h125.184v125.185H1.408z" />
    <path
      fill="#323330"
      d="M116.347 96.736c-.917-5.711-4.641-10.508-15.672-14.981-3.832-1.761-8.104-3.022-9.377-5.926-.452-1.69-.512-2.642-.226-3.665.821-3.32 4.784-4.355 7.925-3.403 2.023.678 3.938 2.237 5.093 4.724 5.402-3.498 5.391-3.475 9.163-5.879-1.381-2.141-2.118-3.129-3.022-4.045-3.249-3.629-7.676-5.498-14.756-5.355l-3.688.477c-3.534.893-6.902 2.748-8.877 5.235-5.926 6.724-4.236 18.492 2.975 23.335 7.104 5.332 17.54 6.545 18.873 11.531 1.297 6.104-4.486 8.08-10.234 7.378-4.236-.881-6.592-3.034-9.139-6.949-4.688 2.713-4.688 2.713-9.508 5.485 1.143 2.499 2.344 3.63 4.26 5.795 9.068 9.198 31.76 8.746 35.83-5.176.165-.478 1.261-3.666.38-8.581zM69.462 58.943H57.753l-.048 30.272c0 6.438.333 12.34-.714 14.149-1.713 3.558-6.152 3.117-8.175 2.427-2.059-1.012-3.106-2.451-4.319-4.485-.333-.584-.583-1.036-.667-1.071l-9.52 5.83c1.583 3.249 3.915 6.069 6.902 7.901 4.462 2.678 10.459 3.499 16.731 2.059 4.082-1.189 7.604-3.652 9.448-7.401 2.666-4.915 2.094-10.864 2.07-17.444.06-10.735.001-21.468.001-32.237z"
    />
  </svg>
);

const PythonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128">
    <path fill="#306998" d="M63 12c-25 0-23 11-23 11v12h23v4H31s-15-1-15 23 13 23 13 23h8v-12s0-13 13-13h23s13 0 13-12V23s2-11-23-11z"/>
    <circle cx="52" cy="25" r="4" fill="#fff"/>
    <path fill="#FFD43B" d="M65 116c25 0 23-11 23-11V93H65v-4h32s15 1 15-23-13-23-13-23h-8v12s0 13-13 13H55s-13 0-13 12v25s-2 11 23 11z"/>
    <circle cx="76" cy="103" r="4" fill="#fff"/>
  </svg>
);

const TsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128" aria-hidden>
    <path
      fill="#007acc"
      d="M2 63.91v62.5h125v-125H2zm100.73-5a15.56 15.56 0 017.82 4.5 20.58 20.58 0 013 4c0 .16-5.4 3.81-8.69 5.85-.12.08-.6-.44-1.13-1.23a7.09 7.09 0 00-5.87-3.53c-3.79-.26-6.23 1.73-6.21 5a4.58 4.58 0 00.54 2.34c.83 1.73 2.38 2.76 7.24 4.86 8.95 3.85 12.78 6.39 15.16 10 2.66 4 3.25 10.46 1.45 15.24-2 5.2-6.9 8.73-13.83 9.9a38.32 38.32 0 01-9.52-.1A23 23 0 0180 109.19c-1.15-1.27-3.39-4.58-3.25-4.82a9.34 9.34 0 011.15-.73l4.6-2.64 3.59-2.08.75 1.11a16.78 16.78 0 004.74 4.54c4 2.1 9.46 1.81 12.16-.62a5.43 5.43 0 00.69-6.92c-1-1.39-3-2.56-8.59-5-6.45-2.78-9.23-4.5-11.77-7.24a16.48 16.48 0 01-3.43-6.25 25 25 0 01-.22-8c1.33-6.23 6-10.58 12.82-11.87a31.66 31.66 0 019.49.26zm-29.34 5.24v5.12H57.16v46.23H45.65V69.26H29.38v-5a49.19 49.19 0 01.14-5.16c.06-.08 10-.12 22-.1h21.81z"
    />
  </svg>
);

function truncateStepLabel(text: string | undefined | null, max = 28) {
  const t = String(text ?? '')
    .trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + '…';
}

function tryExtractTextFromJsonString(s: string): string | null {
  const t = s.trim();
  if (!t.startsWith('{') || !t.endsWith('}')) return null;
  try {
    const obj = JSON.parse(t) as unknown;
    if (typeof obj === 'object' && obj && 'text' in obj) {
      const maybe = (obj as { text?: unknown }).text;
      if (typeof maybe === 'string') return maybe;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function shortenStepTitle(raw: string, maxLen = 32): string {
  let t = String(raw ?? '').trim();
  if (!t) return t;

  const extracted = tryExtractTextFromJsonString(t);
  if (extracted) t = extracted;

  t = t
    .replace(/^[-*]\s*/g, '')
    .replace(/^\d+[.)]\s*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.?!]+$/g, '')
    .trim();

  // Remove common “planner” verbs to keep checklist titles short and scannable.
  t = t.replace(
    /^(Inspect|Fix|Patch|Apply|Wire|Build|Rebuild|Diagnose|Stabilize|Rebuild|Harden|Finalize|Final hardening pass)\s+(the\s+)?/i,
    '',
  );

  t = t
    .replace(/\blive preview\b/gi, 'preview')
    .replace(/\bruntime error\b/gi, 'preview error')
    .replace(/\bthe\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Keep the first clause only (avoid long multi-part sentences).
  if (/\s+and\s+/i.test(t)) t = t.split(/\s+and\s+/i)[0]?.trim() ?? t;
  if (t.includes(',')) t = t.split(',')[0]?.trim() ?? t;
  if (t.includes(';')) t = t.split(';')[0]?.trim() ?? t;

  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1) + '…';
}

function estimatePromptComplexity(prompt: string): 'simple' | 'medium' | 'complex' {
  const raw = String(prompt ?? '');
  const p = raw.toLowerCase();
  const complexRe =
    /\b(dashboard|admin|table|auth|login|signup|payment|checkout|stripe|realtime|websocket|chat|terminal|canvas|drag|dnd|multiplayer|game|3d|three)\b/;
  const simpleRe = /\b(landing page|landing|portfolio|pricing|hero|brochure|product page)\b/;
  const microRe =
    /\b(fix|bug|typo|tweak|rename|adjust|change|remove|add a|one thing|single|small|quick|just|only|minor|patch)\b/i;
  if (complexRe.test(p)) return 'complex';
  if (raw.length < 200 && microRe.test(p)) return 'simple';
  if (simpleRe.test(p)) return 'simple';
  return 'medium';
}

function planUiPolicy(
  rawSteps: string[],
  promptForPolicy: string,
  mode: 'normal' | 'fix',
  fileCount: number,
): string[] {
  const complexity = estimatePromptComplexity(promptForPolicy);
  const cap =
    mode === 'fix'
      ? 2 + (complexity === 'complex' ? 2 : 0)
      : complexity === 'simple'
        ? 3 + (fileCount >= 10 ? 1 : 0)
        : complexity === 'complex'
          ? 14
          : 6 + (fileCount >= 12 ? 1 : 0);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const step of rawSteps) {
    const cleaned = shortenStepTitle(step, 34);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= cap) break;
  }
  return out;
}

async function filesToStreamImageAttachments(files: File[] | undefined): Promise<StreamChatImageAttachment[]> {
  if (!files?.length) return [];
  const out: StreamChatImageAttachment[] = [];
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ''));
      r.onerror = () => reject(r.error ?? new Error('read failed'));
      r.readAsDataURL(f);
    });
    const comma = dataUrl.indexOf(',');
    if (comma < 0) continue;
    out.push({ mimeType: f.type || 'image/png', dataBase64: dataUrl.slice(comma + 1) });
  }
  return out;
}

/** Map each checklist step to a slice of project files so every step has previews when files exist */
function getStepFilesForPreview(
  stepIndex: number,
  totalSteps: number,
  fileEntries: [string, { code: string }][]
): [string, { code: string }][] {
  if (fileEntries.length === 0) return [];
  const sorted = [...fileEntries].sort((a, b) => a[0].localeCompare(b[0]));
  const n = Math.max(1, totalSteps);
  const chunk = Math.max(1, Math.ceil(sorted.length / n));
  const start = stepIndex * chunk;
  const slice = sorted.slice(start, start + chunk);
  if (slice.length > 0) return slice;
  return [sorted[sorted.length - 1]];
}

const WORKSPACE_CONTEXT_MAX_CHARS = 110_000;

function buildWorkspaceContextForPrompt(files: Record<string, { code: string }>): string {
  const keys = Object.keys(files).sort();
  if (keys.length === 0) return '';
  let out = '';
  for (const k of keys) {
    const block = `\n\n--- ${k} ---\n${files[k]?.code ?? ''}`;
    if (out.length + block.length > WORKSPACE_CONTEXT_MAX_CHARS) {
      out += '\n\n[Workspace truncated. Prefer editing these paths; do not duplicate conflicting patterns.]';
      break;
    }
    out += block;
  }
  return `\n\nCURRENT WORKSPACE (CONTINUATION MODE) — before changing anything, perform a deep file audit of ALL workspace files end-to-end and infer how modules connect. Do not start editing until you understand current architecture, data flow, shared utilities, and UI patterns. Preserve architecture, naming, and imports unless the user asks to replace them. Your plan must reflect this audit first, then implementation.${out}`;
}

const FALLBACK_VIBE_PROMPTS = [
  'SaaS dashboard: sidebar, KPIs, feed, responsive collapse.',
  'Landing: hero, proof strip, pricing, subtle motion.',
  'Admin table: search, row actions, empty & error states.',
] as const;

const VIBE_CODER_SYSTEM_PROMPT = `You are a senior product engineer shipping production-quality web apps. Aim for **rich, memorable UIs**: layered depth (cards, panels, glass/blur where appropriate), strong typography, intentional color systems, and motion that supports hierarchy — never thin, generic, or “lorem” placeholders.

CRITICAL PRODUCT INTERPRETATION:
- If the user says “make a landing page for X” (e.g. “YouTube”), assume they mean a **marketing landing page about X / for a channel or product**, not a pixel-perfect recreation of X’s full app. Do **not** rebuild the entire product UI unless explicitly asked to clone it.
- When the user names a famous brand, avoid cloning brand assets. Use neutral, original design language unless they explicitly request a clone.

CRITICAL IMAGES:
- Do **not** pull random remote images or random URLs. Prefer: CSS gradients, SVG shapes, tasteful placeholders, or user-provided images.
- Only introduce real images when the user provides them or explicitly asks for sourced imagery.

Process: study the full workspace when provided, reason step-by-step, then emit artifacts only.

Output format (strict) — checklist depends on this:
1) First line exactly: json:plan then a newline, then ONE valid JSON array (multi-line allowed) of short task strings. The array length **must match scope**: **1–3** steps for tiny/single-file fixes or one small change; **4–7** for a moderate feature or multi-file tweak; **8–14** only for a large app, full site, or major multi-area work. Close the array, newline, then the first code fence \`\`\`lang:path ...
2) After that, only fenced code blocks \`\`\`lang:path/to/file ...\`\`\`

Plan rules: tasks must be concrete (e.g. "Wire theme + motion tokens", "Add staggered hero + CTA micro-interactions") — not vague filler. Do **not** pad with extra steps when the user asked for something small.

**Attached images:** When the user includes images in a message, treat them as first-class input — describe or analyze them when asked, and use layout/colors/text/UI details from them in code and design when relevant.

**Project structure (like Cursor / real repos):** Use **nested folders and many files** — never dump everything in the project root. Prefer \`src/main.tsx\`, \`src/App.tsx\`, \`src/components/...\`, \`src/features/...\`, \`src/hooks/...\`, \`src/lib/...\`, \`src/styles/...\`. For a new app, emit **at least 10 files** across folders (entry, styles, layout, feature UI, small utilities). Use path fences exactly: \`\`\`tsx:src/components/Card.tsx\`\`\`

Build bar (raise the bar every time):
- **Stack:** TypeScript + React; typed props; sensible layout (src/, components/, hooks/).
- **Visual complexity:** multi-section layouts, grids, asymmetry or editorial rhythm where it fits; dark/light considerations; hover/focus/active states on every control.
- **Motion:** framer-motion for layout, presence, stagger, scroll-linked or gesture-driven details where appropriate — purposeful, not random.
- **Interactivity:** real state, derived UI, validation, optimistic feedback, empty/loading/error/success states; no dead buttons or fake forms without handlers.
- **Polish:** keyboard focus rings, aria labels on icon-only controls, reduced-motion friendly fallbacks when animation is heavy.
- **Icons (CRITICAL):** Use **professional, context-matching lucide icons** only. Keep a consistent icon style (stroke width, size, spacing). Avoid “random” icons that don’t match the feature. Every icon-only button/link must have an **aria-label** and a meaningful icon.
- **Brand / URL cloning (CRITICAL):** When the user names a company, product, or pastes a **reference URL**, match **layout structure** (nav, hero, sections, grids, footer), **typography hierarchy**, **spacing rhythm**, **component shapes** (cards, inputs, buttons), and **motion personality** — not only colors. Follow any **THEME RESEARCH** or **REFERENCE URL** blocks in the prompt verbatim for evidence.
- **Multi-page sites (CRITICAL):** For **any** website, marketing page, or product UI, ship a **real multi-view app** — not a single long scroll with fake nav. Use **client-side routing** (hash routes \`#/about\` or in-app state) so **every** top nav item and footer link opens a **dedicated screen** with its own layout and content. Create **one component file per major page** (e.g. \`src/pages/Home.tsx\`, \`src/pages/About.tsx\`, \`src/pages/Pricing.tsx\`, \`src/pages/Contact.tsx\`) and wire **nav + CTA buttons** to switch views. **Do not** leave “secondary” pages as empty placeholders — implement full content, motion, and forms on each. Use initiative: add sensible extra pages (FAQ, Docs, Legal) when they fit the product.
- **Completeness (CRITICAL):** If the user asks for a **landing page / marketing site / product page**, build a complete mini-site with internal navigation and multiple routes/sections: **Home**, **Features**, **Pricing**, plus an **Auth area** with **Log in** + **Sign up**. Implement working client-side auth with **localStorage** (simulated session), route protection where appropriate, and real form validation + state transitions.
- **Entry:** \`index.html\` at repo root with \`<div id="root"></div>\`; \`src/main.tsx\` mounts \`App\` with \`createRoot\`; **default export** \`App\` from \`src/App.tsx\`.
- **React runtime safety (CRITICAL):** Never render plain objects as JSX children. If you have an object/record, render it as text (e.g. \`JSON.stringify(obj)\`) or map it into elements/components. Ensure component functions always return valid JSX (no \`return;\` or \`return { ... }\` from render).
- **No top-level returns:** Do not use \`return\` statements at module scope; all early exits must be inside functions/components.
- **Export shape:** Do not export an object as the default export. \`src/App.tsx\` default export must be a function/component type (not \`export default { App }\`).
- **Images (CRITICAL):** All visible images must load reliably. Use real \`<img>\` with \`alt\`, \`loading="lazy"\` (except primary hero can be eager), \`decoding="async"\`, and stable sizing (\`width/height\` or fixed aspect-ratio) to prevent layout shifts.
- **Stock URLs (CRITICAL):** When **THEME RESEARCH** lists specific \`images.unsplash.com/photo-...\` URLs, use **only** those for stock photos. Never use \`source.unsplash.com\`, never build Unsplash URLs from arbitrary search queries, and never paste unrelated “company name + keyword” stock links. If no curated URL fits a slot, use CSS/SVG gradients or abstract shapes instead of random photos.
- **Image fallback (CRITICAL):** Add \`onError\` fallback behavior (swap to backup URL, neutral placeholder block, or hide broken image frame cleanly). Never leave broken-image icons in UI.
- **Image relevance verification (CRITICAL):** Before final output, verify each selected image matches the section (hero, team, product, analytics). Write \`alt\` text that describes the visual, not the brand name as a vague keyword.
- **Typography quality (CRITICAL):** Keep text production-grade: clear hierarchy, readable spacing (line-height ~1.4–1.7 for body), strong contrast, no cramped paragraphs, no random all-caps blocks, and balanced max widths for long text.
- **Continuation discipline (CRITICAL):** When a workspace already has files, deeply analyze ALL files first (not just likely entry points) before proposing or emitting edits. Reuse existing patterns/components and avoid conflicting rewrites.

Environment: React 18, Tailwind (class names in components), framer-motion, lucide-react, recharts — import from package names (e.g. \`import { motion } from "framer-motion"\`). **Do not** put \`<script src="cdn...\` in index.html (preview injects tooling). No prose outside json:plan + code fences.`;

/** Parse json:plan block — must allow multi-line JSON (old regex stopped at first newline). */
function extractJsonPlanArray(fullResponse: string): string[] | null {
  const m = fullResponse.match(/json:plan\s*\n/i);
  if (!m || m.index === undefined) return null;
  const rest = fullResponse.slice(m.index + m[0].length);
  const fenceIdx = rest.search(/\n```/);
  const jsonChunk = fenceIdx >= 0 ? rest.slice(0, fenceIdx).trim() : rest.trim();
  if (!jsonChunk.startsWith('[')) return null;
  try {
    const plan = JSON.parse(jsonChunk) as unknown;
    if (!Array.isArray(plan) || plan.length === 0) return null;
    return plan.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).filter(Boolean);
  } catch {
    return null;
  }
}

function extractPlanFromMessages(messages: { role: 'user' | 'model'; content: string }[]): string[] | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'model') continue;
    const p = extractJsonPlanArray(String(messages[i].content ?? ''));
    if (p && p.length > 0) return p;
  }
  return null;
}

const WORKSPACE_AUDIT_MAX_CHARS = 80_000;

function buildWorkspaceAuditSnippet(files: Record<string, { code: string }>): string {
  const keys = Object.keys(files).sort();
  if (keys.length === 0) return '';
  let out = '';
  for (const k of keys) {
    const block = `\n\n--- ${k} ---\n${files[k]?.code ?? ''}`;
    if (out.length + block.length > WORKSPACE_AUDIT_MAX_CHARS) {
      out += '\n\n[Truncated for audit.]';
      break;
    }
    out += block;
  }
  return out;
}

function modelOrdinalAtMessageIndex(messages: { role: string }[], idx: number): number | null {
  if (!messages[idx] || messages[idx].role !== 'model') return null;
  return messages.slice(0, idx + 1).filter((m) => m.role === 'model').length - 1;
}

function normalizeStoredPlanSteps(raw: unknown): (string | { text: string; failed?: boolean })[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: (string | { text: string; failed?: boolean })[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      out.push(item);
    } else if (item && typeof item === 'object' && 'text' in item) {
      out.push({
        text: String((item as { text?: unknown }).text ?? ''),
        failed: Boolean((item as { failed?: boolean }).failed),
      });
    }
  }
  return out.length ? out : null;
}

/** Strip plan + fenced code from model bubble. Only remove json:plan once a code fence exists (avoids eating a partial stream). */
function modelMessageVisibleText(content: string | undefined | null): string {
  let s = String(content ?? '');
  if (/\n```/.test(s)) {
    s = s.replace(/json:plan\s*\n[\s\S]*?(?=\n```)/i, '');
  }
  s = s.replace(/```[\w+-]*(?::[^\n`]+)?\n[\s\S]*?```/g, '');
  return s.trim();
}

function extractGeneratedCodeBlocks(text: string): Array<{ lang: string; filename?: string; code: string }> {
  const blocks: Array<{ lang: string; filename?: string; code: string }> = [];
  const fence = /```([a-zA-Z0-9_+-]+)(?::([^\n`]+))?\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text)) !== null) {
    blocks.push({
      lang: (m[1] || 'text').toLowerCase(),
      filename: m[2]?.trim(),
      code: m[3] ?? '',
    });
  }
  return blocks;
}

/** Models sometimes emit JSON-style escapes (literal \\n) inside fences — normalize for editor + preview */
function decodeEscapedSourceCode(raw: string): string {
  if (!raw || !raw.includes('\\n')) return raw;
  const realNl = (raw.match(/\n/g) || []).length;
  const escNl = (raw.match(/\\n/g) || []).length;
  if (escNl > 0 && realNl < escNl / 2) {
    return raw
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"');
  }
  return raw;
}

/** Monaco editor language id from file path (no manual picker). */
function getMonacoLanguageId(path: string): string {
  const p = path.toLowerCase();
  if (p.endsWith('.tsx') || p.endsWith('.ts')) return 'typescript';
  if (p.endsWith('.jsx') || p.endsWith('.js')) return 'javascript';
  if (p.endsWith('.html') || p.endsWith('.htm')) return 'html';
  if (p.endsWith('.css')) return 'css';
  if (p.endsWith('.json')) return 'json';
  if (p.endsWith('.py')) return 'python';
  if (p.endsWith('.md')) return 'markdown';
  if (p.endsWith('.xml')) return 'xml';
  return 'plaintext';
}

/** JSON safe inside <script type="application/json"> (breaks on </script> in strings). */
function escapeJsonForScriptTag(json: string): string {
  return json.replace(/</g, '\\u003c');
}

/** Body markup from user index.html, or default #root (scripts stripped — preview runtime mounts React). */
function extractPreviewBodyShell(indexHtml: string | undefined): string {
  if (!indexHtml?.trim()) return '<div id="root"></div>';
  const m = indexHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let inner = m ? m[1] : indexHtml;
  inner = inner.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
  if (!inner) return '<div id="root"></div>';
  return inner;
}

const PREVIEW_IMPORT_MAP = {
  imports: {
    react: 'https://esm.sh/react@18.3.1',
    'react/jsx-runtime': 'https://esm.sh/react@18.3.1/jsx-runtime',
    'react/jsx-dev-runtime': 'https://esm.sh/react@18.3.1/jsx-dev-runtime',
    'react-dom': 'https://esm.sh/react-dom@18.3.1?deps=react@18.3.1',
    'react-dom/client': 'https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1',
    'framer-motion': 'https://esm.sh/framer-motion@11?deps=react@18,react-dom@18',
    'lucide-react': 'https://esm.sh/lucide-react@0.460.0?deps=react@18',
    recharts: 'https://esm.sh/recharts@2.13.3?deps=react@18,react-dom@18',
  },
} as const;

/**
 * Full iframe document: Tailwind + import map + Babel + virtual FS + vibe-preview-runtime.js
 * compiles TS/TSX in-browser and mounts default App (same approach as Sandpack-style previews).
 */
function buildPreviewSrcDoc(files: Record<string, { code: string }>): string {
  const keys = Object.keys(files);
  if (keys.length === 0) {
    return '<!DOCTYPE html><html><body style="margin:0;background:#0a0a0a;color:#737373;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh">No files yet.</body></html>';
  }

  const lower = (k: string) => k.toLowerCase();
  const indexKey =
    keys.find((k) => lower(k) === 'index.html') ||
    keys.find((k) => lower(k) === 'public/index.html') ||
    keys.find((k) => lower(k).endsWith('/index.html'));
  const indexHtml = indexKey ? files[indexKey]?.code : undefined;

  const fs: Record<string, string> = {};
  for (const k of keys) {
    fs[k] = files[k]?.code ?? '';
  }

  const hasJsEntry = keys.some((k) =>
    /\.(tsx|ts|jsx|js)$/i.test(k),
  );
  if (!hasJsEntry) {
    return `<!DOCTYPE html><html><body style="margin:0;background:#0a0a0a;color:#737373;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center">Add a JS/TS entry (e.g. src/main.tsx) to run Live Preview.</body></html>`;
  }

  const bodyShell = extractPreviewBodyShell(indexHtml);
  const filesJson = escapeJsonForScriptTag(JSON.stringify(fs));
  const importMapJson = escapeJsonForScriptTag(JSON.stringify(PREVIEW_IMPORT_MAP));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="importmap">${importMapJson}</script>
  <script src="https://unpkg.com/@babel/standalone@7.26.0/babel.min.js"></script>
  <style>html,body{margin:0;min-height:100%;background:#0a0a0a;}</style>
</head>
<body>
${bodyShell}
<script type="application/json" id="__vibe_files">${filesJson}</script>
<script>${vibePreviewRuntimeSource}</script>
</body>
</html>`;
}

/** Full-screen overlay — gradient sweep + TextShimmer until checklist + runtime ready */
function LivePreviewBuildingOverlay({
  phase,
}: {
  phase: 'stream' | 'checklist' | 'compile';
}) {
  const label =
    phase === 'stream'
      ? 'Generating workspace…'
      : phase === 'checklist'
        ? 'Finishing build checklist…'
        : 'Starting live preview…';
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden bg-[var(--vibe-bg)]/94 backdrop-blur-[3px]">
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
        animate={{ opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(59,130,246,0.08), transparent 70%)',
          }}
        />
      </motion.div>
      <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <motion.div
          className="absolute top-0 bottom-0 w-[min(55%,420px)]"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.11), rgba(59,130,246,0.06), transparent)',
          }}
          initial={{ left: '-45%' }}
          animate={{ left: ['-40%', '105%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
      <div className="relative z-[1] flex flex-col items-center gap-3 px-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--vibe-border-strong)] border-t-sky-400" />
        <TextShimmer as="span" duration={2.2} className="text-[13px] font-medium tracking-wide text-white/90">
          {label}
        </TextShimmer>
        <p className="max-w-[280px] text-[11px] leading-relaxed text-[var(--vibe-text-secondary)]">
          {phase === 'compile'
            ? 'Compiling modules and mounting your app in a secure sandbox.'
            : 'Hang tight — preview unlocks when every step is complete.'}
        </p>
      </div>
    </div>
  );
}

function detectMiniCodeLanguage(fileName: string): 'ts' | 'js' | 'css' | 'html' | 'json' | 'other' {
  const n = fileName.toLowerCase();
  if (n.endsWith('.ts') || n.endsWith('.tsx')) return 'ts';
  if (n.endsWith('.js') || n.endsWith('.jsx')) return 'js';
  if (n.endsWith('.css')) return 'css';
  if (n.endsWith('.html') || n.endsWith('.htm')) return 'html';
  if (n.endsWith('.json')) return 'json';
  return 'other';
}

function buildAdaptiveFixChecklist(errorText: string, fileCount: number): string[] {
  const e = errorText.toLowerCase();
  const smallQuickFix =
    /\b(undefined|not defined|null|typo|missing|invalid prop|cannot read)\b/.test(e) &&
    !/\b(minified react error|invariant|hydration|module|import|entry|mount)\b/.test(e);
  if (smallQuickFix) return ['Patch runtime error and verify preview loads.'];

  let complexity = 2;
  if (fileCount >= 10) complexity += 1;
  if (/\b(module|import|export|entry|mount|createRoot|render|jsx-runtime)\b/.test(e)) complexity += 1;
  complexity = Math.max(2, Math.min(4, complexity));

  const steps = [
    'Diagnose the preview crash and isolate the failing file.',
    'Fix the entry/render path so the app mounts reliably.',
    'Apply minimal edits to restore runtime stability.',
    'Rebuild preview and confirm it loads cleanly.',
  ];
  return steps.slice(0, complexity);
}

function highlightMiniCodeLine(line: string, lang: ReturnType<typeof detectMiniCodeLanguage>) {
  const keywordRe =
    lang === 'css'
      ? /\b(display|position|absolute|relative|fixed|grid|flex|padding|margin|border|background|color|font|width|height|overflow|transition|transform)\b/g
      : /\b(import|from|export|default|function|return|const|let|var|if|else|for|while|switch|case|break|continue|class|extends|new|try|catch|finally|await|async|type|interface)\b/g;
  const stringRe = /(".*?"|'.*?'|`.*?`)/g;
  const numberRe = /\b\d+(\.\d+)?\b/g;
  const commentRe = /(\/\/.*$|\/\*.*?\*\/)/g;

  const parts: Array<{ text: string; cls: string }> = [{ text: line, cls: 'text-white/82' }];

  const apply = (re: RegExp, cls: string) => {
    const next: Array<{ text: string; cls: string }> = [];
    for (const p of parts) {
      if (p.cls !== 'text-white/82') {
        next.push(p);
        continue;
      }
      let last = 0;
      for (const m of p.text.matchAll(re)) {
        const i = m.index ?? 0;
        if (i > last) next.push({ text: p.text.slice(last, i), cls: 'text-white/82' });
        next.push({ text: m[0], cls });
        last = i + m[0].length;
      }
      if (last < p.text.length) next.push({ text: p.text.slice(last), cls: 'text-white/82' });
    }
    parts.splice(0, parts.length, ...next);
  };

  apply(commentRe, 'text-[#6a9955]');
  apply(stringRe, 'text-[#ce9178]');
  apply(keywordRe, 'text-[#569cd6]');
  apply(numberRe, 'text-[#b5cea8]');

  return parts;
}

function StepMiniCodeBox({
  fileName,
  code,
  isTyping,
  show,
  onDone,
}: {
  fileName: string;
  code: string;
  isTyping: boolean;
  show: boolean;
  onDone?: () => void;
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const fullCode = useMemo(() => code.replace(/\r\n/g, '\n'), [code]);
  const [len, setLen] = useState(1);
  const rafRef = useRef<number | null>(null);
  const restartTypingRef = useRef<number | null>(null);
  const hasFiredDoneRef = useRef(false);

  useEffect(() => {
    hasFiredDoneRef.current = false;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (restartTypingRef.current != null) {
      window.clearTimeout(restartTypingRef.current);
      restartTypingRef.current = null;
    }
    if (!show || !isTyping) return;

    restartTypingRef.current = window.setTimeout(() => {
      restartTypingRef.current = null;
      setLen(1);
      const start = performance.now();
      // Duration scales sub-linearly with code length for a smoother feel.
      const durationMs = Math.max(700, Math.min(1800, 520 + Math.sqrt(fullCode.length) * 26));

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const next = Math.max(1, Math.floor(t * fullCode.length));
        setLen(next);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }, 0);

    return () => {
      if (restartTypingRef.current != null) {
        window.clearTimeout(restartTypingRef.current);
        restartTypingRef.current = null;
      }
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [fullCode, isTyping, show]);

  const displayLen = isTyping ? Math.min(Math.max(len, 1), fullCode.length) : fullCode.length;

  /** Avoid smooth scroll on every tick — causes jitter; snap follow while typing */
  useEffect(() => {
    const el = preRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: isTyping ? 'auto' : 'smooth' });
  }, [displayLen, isTyping]);

  useEffect(() => {
    if (!show) return;
    if (!isTyping) return;
    if (hasFiredDoneRef.current) return;
    if (displayLen < fullCode.length) return;
    hasFiredDoneRef.current = true;
    onDone?.();
  }, [show, isTyping, displayLen, fullCode.length, onDone]);

  if (!show) return null;

  const displayed = fullCode.slice(0, displayLen);
  const lineCount = displayed ? displayed.split('\n').length : 0;
  const visibleLines = Math.min(3, lineCount);
  const miniLang = detectMiniCodeLanguage(fileName);
  const codeLines = displayed.split('\n');

  const linePx = 17;
  const padY = 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.72 }}
      className="mb-1 max-w-full overflow-hidden rounded-[10px] border border-white/[0.07] bg-[var(--vibe-bg)] shadow-[0_1px_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[var(--vibe-bg-raised)] px-2.5 py-1.5">
        {isTyping ? (
          <TextShimmer
            as="span"
            duration={VIBE_THINKING_SHIMMER_DURATION}
            className={cn(vibeThinkingShimmerClassName, 'min-w-0 flex-1 truncate')}
          >
            {fileName}
          </TextShimmer>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium tracking-wide text-white/75">{fileName}</span>
        )}
        <span className="shrink-0 tabular-nums text-[10px] font-medium text-emerald-400/90">+{Math.max(0, Math.min(99, lineCount))}</span>
        <span className="shrink-0 tabular-nums text-[10px] font-medium text-rose-400/90">-{Math.max(0, Math.min(9, Math.floor(lineCount / 8)))}</span>
      </div>
      <pre
        ref={preRef}
        className="custom-scrollbar w-full overflow-auto bg-[var(--vibe-bg-deep)] px-2.5 py-1.5 font-mono text-[11px] leading-[17px] text-white/80"
        style={{
          height: visibleLines > 0 ? `${visibleLines * linePx + padY}px` : '0px',
          maxHeight: `${3 * linePx + padY}px`,
        }}
      >
        {codeLines.map((line, i) => {
          const segs = highlightMiniCodeLine(line, miniLang);
          const isLast = i === codeLines.length - 1;
          const showCaret = Boolean(isTyping && displayLen < fullCode.length && isLast);
          return (
            <div key={`code-line-${i}`} className="whitespace-pre">
              {segs.map((seg, j) => (
                <span key={`seg-${i}-${j}`} className={seg.cls}>
                  {seg.text}
                </span>
              ))}
              {showCaret && (
                <span
                  className="inline-block h-[13px] w-px translate-y-px rounded-[1px] bg-white/90 align-middle motion-safe:animate-pulse"
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </pre>
    </motion.div>
  );
}

function StepSequentialMiniBoxes({
  pairs,
  isActiveStep,
  onStepComplete,
}: {
  pairs: [string, { code: string }][];
  isActiveStep: boolean;
  onStepComplete?: () => void;
}) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const target = isActiveStep ? 0 : Math.max(0, pairs.length - 1);
    const t = window.setTimeout(() => setStage(target), 0);
    return () => window.clearTimeout(t);
  }, [isActiveStep, pairs.length]);

  return (
    <div className="flex max-w-full flex-col gap-1 pt-0.5 pb-0.5">
      {pairs.map(([fname, file], j) => {
        const visible = j <= stage;
        const isCurrentTyping = Boolean(isActiveStep && visible && j === stage);
        const shouldAdvance = isCurrentTyping && stage < pairs.length - 1;
        const isLastInStep = j === pairs.length - 1;

        return (
          <StepMiniCodeBox
            key={`seq-${fname}-${j}`}
            fileName={fname}
            code={file.code}
            isTyping={isCurrentTyping}
            show={visible}
            onDone={
              shouldAdvance
                ? () => {
                    setStage((s) => Math.min(pairs.length - 1, s + 1));
                  }
                : isActiveStep && isLastInStep
                  ? () => onStepComplete?.()
                  : undefined
            }
          />
        );
      })}
    </div>
  );
}

/** Mini checklist code: show real file slices as soon as the panel opens — no synthetic “waiting” copy. */
function StepChecklistCodeBody({
  isActiveStep,
  codePairs,
  onStepComplete,
}: {
  isActiveStep: boolean;
  codePairs: [string, { code: string }][];
  onStepComplete: () => void;
}) {
  return codePairs.length > 0 ? (
    <StepSequentialMiniBoxes
      pairs={codePairs}
      isActiveStep={isActiveStep}
      onStepComplete={onStepComplete}
    />
  ) : (
    <div className="rounded-md border border-[var(--vibe-border)] bg-[var(--vibe-bg-deep)] px-3 py-2 text-[11px] text-[var(--vibe-text-muted)]">
      No files in workspace yet.
    </div>
  );
}

function GenerationProgress({
  isStreaming,
  paused = false,
  steps,
  files,
  onLayoutShift,
  onChecklistComplete,
  onActiveStepChange,
  restoredComplete = false,
}: {
  isStreaming: boolean;
  paused?: boolean;
  steps: (string | { text: string; failed?: boolean })[];
  files?: Record<string, { code: string; language: string }>;
  onLayoutShift?: () => void;
  /** Fired once when the last checklist step completes (all rows done). */
  onChecklistComplete?: () => void;
  onActiveStepChange?: (payload: {
    index: number;
    total: number;
    label: string;
    checklistDone: boolean;
    progress: number;
  }) => void;
  /** When true (reopened completed task), jump to all steps done without firing onChecklistComplete. */
  restoredComplete?: boolean;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [stepPanelOpen, setStepPanelOpen] = useState<Record<number, boolean | undefined>>({});
  const pausedRef = useRef<boolean>(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  const currentStepRef = useRef(0);
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const stepAdvanceTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (!paused) return;
    // Freeze everything while a repair checklist starts:
    // - collapse all code panels
    // - stop “Thinking” shimmer
    // - cancel pending step-advance timers
    if (stepAdvanceTimeoutRef.current != null) {
      window.clearTimeout(stepAdvanceTimeoutRef.current);
      stepAdvanceTimeoutRef.current = null;
    }
    queueMicrotask(() => {
      setIsWaiting(false);
      setStepPanelOpen({});
    });
  }, [paused]);

  const fileEntries = useMemo(() => (files ? Object.entries(files) : []), [files]);
  const stepsSig = useMemo(
    () =>
      JSON.stringify(
        steps.map((s) => (typeof s === 'string' ? s : String((s as { text?: unknown })?.text ?? ''))),
      ),
    [steps],
  );

  const stepsRef = useRef(steps);
  const onActiveStepChangeRef = useRef(onActiveStepChange);
  const onChecklistCompleteRef = useRef(onChecklistComplete);
  const onLayoutShiftRef = useRef(onLayoutShift);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);
  useEffect(() => {
    onActiveStepChangeRef.current = onActiveStepChange;
    onChecklistCompleteRef.current = onChecklistComplete;
    onLayoutShiftRef.current = onLayoutShift;
  }, [onActiveStepChange, onChecklistComplete, onLayoutShift]);

  const lastProgressEmitKeyRef = useRef<string>('');

  const checklistCompleteNotifiedRef = useRef(false);
  useEffect(() => {
    checklistCompleteNotifiedRef.current = false;
  }, [stepsSig]);

  useEffect(() => {
    if (!restoredComplete || steps.length === 0) return;
    queueMicrotask(() => {
      setCurrentStep(steps.length);
      checklistCompleteNotifiedRef.current = true;
    });
  }, [restoredComplete, stepsSig, steps.length]);

  /** Brief “Thinking” shimmer before checklist rows; stays visible while streaming with a plan. */
  const [thinkingShimmer, setThinkingShimmer] = useState(false);
  useEffect(() => {
    // Avoid synchronous setState warnings; schedule into next microtask/paint.
    if (paused || !isStreaming || steps.length === 0) {
      queueMicrotask(() => setThinkingShimmer(false));
      return;
    }
    queueMicrotask(() => setThinkingShimmer(true));
    const t = window.setTimeout(() => setThinkingShimmer(false), 1400);
    return () => window.clearTimeout(t);
  }, [stepsSig, isStreaming, steps.length, paused]);

  useEffect(() => {
    if (restoredComplete) return;
    const st = stepsRef.current;
    if (st.length === 0) return;
    if (currentStep < st.length) return;
    if (paused) return;
    if (checklistCompleteNotifiedRef.current) return;
    checklistCompleteNotifiedRef.current = true;
    onChecklistCompleteRef.current?.();
  }, [currentStep, steps.length, paused, restoredComplete]);

  useEffect(() => {
    if (paused) return;
    const cb = onActiveStepChangeRef.current;
    if (!cb) return;
    const st = stepsRef.current;
    if (!st.length) {
      const key = 'empty|done';
      if (lastProgressEmitKeyRef.current === key) return;
      lastProgressEmitKeyRef.current = key;
      cb({ index: 0, total: 0, label: '', checklistDone: true, progress: 100 });
      return;
    }
    const done = currentStep >= st.length;
    const idx = done ? st.length - 1 : Math.min(currentStep, st.length - 1);
    const stepItem = st[idx];
    const labelRaw =
      typeof stepItem === 'string'
        ? stepItem
        : String((stepItem as { text?: unknown })?.text ?? '');
    const progress = done ? 100 : Math.round(((currentStep + 1) / Math.max(1, st.length)) * 100);
    const label = truncateStepLabel(labelRaw);
    const key = `${paused}|${stepsSig}|${currentStep}|${done}|${progress}|${label}`;
    if (lastProgressEmitKeyRef.current === key) return;
    lastProgressEmitKeyRef.current = key;
    cb({
      index: currentStep,
      total: st.length,
      label,
      checklistDone: done,
      progress,
    });
  }, [currentStep, stepsSig, paused, steps.length]);

  useEffect(() => {
    const t = window.setTimeout(() => setStepPanelOpen({}), 0);
    return () => window.clearTimeout(t);
  }, [stepsSig]);

  /** Only scroll when step progress changes — not when user toggles a row (avoids jump-to-bottom). */
  useEffect(() => {
    const t = window.setTimeout(() => onLayoutShiftRef.current?.(), 50);
    return () => window.clearTimeout(t);
  }, [currentStep, isWaiting]);

  /** New plan while streaming: restart checklist from step 0. Do not jump to end when stream finishes — mini boxes must finish. */
  useEffect(() => {
    if (restoredComplete) return;
    if (!isStreaming || paused) return;
    queueMicrotask(() => {
      if (currentStepRef.current >= steps.length) return;
      setCurrentStep(0);
      setIsWaiting(false);
    });
  }, [stepsSig, isStreaming, paused, steps.length, restoredComplete]);

  const handleStepVisualComplete = useCallback(() => {
    const doneIdx = currentStepRef.current;
    if (doneIdx >= steps.length) return;
    if (pausedRef.current) return;
    setIsWaiting(true);
    stepAdvanceTimeoutRef.current = window.setTimeout(() => {
      setStepPanelOpen((open) => ({ ...open, [doneIdx]: false }));
      setIsWaiting(false);
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) return steps.length;
        return prev + 1;
      });
      stepAdvanceTimeoutRef.current = null;
    }, 1000);
  }, [steps.length]);

  /** Stream ended but this step still has no files — advance after a short wait so checklist never hangs. */
  const codePairsForActiveStep = useMemo(() => {
    if (currentStep >= steps.length || steps.length === 0) return [] as [string, { code: string }][];
    return getStepFilesForPreview(currentStep, steps.length, fileEntries);
  }, [currentStep, steps.length, fileEntries]);

  useEffect(() => {
    if (isStreaming) return;
    if (currentStep >= steps.length) return;
    if (paused) return;
    if (codePairsForActiveStep.length > 0) return;
    const t = window.setTimeout(() => handleStepVisualComplete(), 1000);
    return () => window.clearTimeout(t);
  }, [isStreaming, currentStep, steps.length, paused, codePairsForActiveStep.length, handleStepVisualComplete]);

  // Failsafe: if streaming is done and we're still stuck mid-checklist after 3s, force-advance to completion.
  useEffect(() => {
    if (isStreaming) return;
    if (steps.length === 0) return;
    if (currentStep >= steps.length) return;
    if (paused) return;
    const t = window.setTimeout(() => {
      setCurrentStep(steps.length);
    }, 3000);
    return () => window.clearTimeout(t);
  }, [isStreaming, steps.length, currentStep, paused]);

  const computeCodeExpanded = (index: number, isFailed: boolean, reachedStep: boolean, checklistDone: boolean) => {
    // `computeCodeExpanded` runs during render; use `paused` (not `pausedRef.current`).
    if (paused) return false;
    const u = stepPanelOpen[index];
    if (u === true) return true;
    if (u === false) return false;
    if (isFailed || !reachedStep) return false;
    if (checklistDone) return false;
    if (index > currentStep) return false;
    if (index < currentStep) return false;
    return index === currentStep;
  };

  return (
    <div className="mt-2 space-y-2">
      {steps.length > 0 && (
        <>
          {thinkingShimmer && isStreaming && (
            <div className="mb-2 pl-0.5" aria-live="polite">
              <TextShimmer
                as="span"
                duration={VIBE_THINKING_SHIMMER_DURATION}
                className={vibeThinkingShimmerClassName}
              >
                Thinking
              </TextShimmer>
            </div>
          )}
          {(!thinkingShimmer || !isStreaming) && (
        <div className="flex flex-col gap-1.5">
          {steps.map((stepItem, index) => {
            const stepTextRaw =
              typeof stepItem === 'string'
                ? stepItem
                : String((stepItem as { text?: unknown })?.text ?? '');
            const stepText = truncateStepLabel(stepTextRaw);
            const isFailed =
              typeof stepItem === 'object' &&
              stepItem != null &&
              Boolean((stepItem as { failed?: boolean }).failed);
            const checklistDone = currentStep >= steps.length;
            /** Current row in the checklist (must stay true after the model stream ends so mini-box typing + onStepComplete still run). */
            const isCurrentRow = Boolean(!isFailed && index === currentStep && !checklistDone && !paused);
            const showRowStreamSpinner = isCurrentRow && isStreaming;
            const isStepDone =
              !isFailed &&
              (index < currentStep || checklistDone || (isWaiting && index === currentStep));
            const reachedStep = index <= currentStep || checklistDone;

            const rawPairs =
              fileEntries.length > 0
                ? getStepFilesForPreview(index, steps.length, fileEntries)
                : [];
            const codePairs: [string, { code: string }][] =
              rawPairs.length > 0
                ? rawPairs
                : fileEntries.length > 0
                  ? fileEntries.map(([k, v]) => [k, { code: v.code }] as [string, { code: string }])
                  : [];

            const codeExpanded = computeCodeExpanded(index, isFailed, reachedStep, checklistDone);
            const showChevron = reachedStep && !paused;
            const showStepLabelShimmer = isCurrentRow && isStreaming && !paused;

            const togglePanel = () => {
              if (pausedRef.current) return;
              const next = !codeExpanded;
              setStepPanelOpen((prev) => ({ ...prev, [index]: next }));
            };

            return (
              <div key={`${index}-${stepText.slice(0, 24)}`} className="flex flex-col">
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    layout: { type: 'spring', stiffness: 380, damping: 32 },
                    duration: 0.38,
                    delay: Math.min(index * 0.035, 0.35),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={cn(
                    'flex items-center gap-2 py-1 text-[13px] font-medium transition-colors duration-200',
                    isFailed
                      ? 'text-[#ef4444]'
                      : isStepDone
                        ? 'text-[var(--vibe-text-secondary)]'
                        : isCurrentRow
                          ? 'text-[#f5f5f5]'
                          : 'text-[var(--vibe-text-dim)]'
                  )}
                >
                  <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    {isFailed ? (
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      >
                        <XCircle className="h-4 w-4 text-[#ef4444]" />
                      </motion.div>
                    ) : isStepDone ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 1 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 560, damping: 32 }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={2} />
                      </motion.div>
                    ) : showRowStreamSpinner ? (
                      <ShimmerOrb speed="fast" label="Plan streaming" />
                    ) : isCurrentRow ? (
                      <ShimmerOrb speed="slow" aria-hidden />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-[var(--vibe-border-strong)]" />
                    )}
                  </div>
                  {isCurrentRow ? (
                    showStepLabelShimmer ? (
                      <TextShimmer
                        as="span"
                        duration={VIBE_THINKING_SHIMMER_DURATION}
                        className={cn(vibeThinkingShimmerClassName, 'min-w-0 flex-1')}
                      >
                        {stepText}
                      </TextShimmer>
                    ) : (
                      <span className="min-w-0 flex-1 truncate tracking-tight" title={stepTextRaw}>
                        {stepText}
                      </span>
                    )
                  ) : (
                    <span className="min-w-0 flex-1 truncate tracking-tight" title={stepTextRaw}>
                      {stepText}
                    </span>
                  )}
                  {showChevron && (
                    <button
                      type="button"
                      aria-expanded={codeExpanded}
                      aria-label={codeExpanded ? 'Collapse code preview' : 'Expand code preview'}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePanel();
                      }}
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-[var(--vibe-text-secondary)] transition-colors hover:border-[var(--vibe-border)] hover:bg-[var(--vibe-bg-elevated)] hover:text-[var(--vibe-text)]',
                        codeExpanded && 'text-[var(--vibe-text-secondary)]'
                      )}
                    >
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          codeExpanded && 'rotate-90'
                        )}
                      />
                    </button>
                  )}
                </motion.div>

                <AnimatePresence initial={false} mode="popLayout">
                  {codeExpanded && (
                    <motion.div
                      key={`code-wrap-${index}`}
                      layout
                      initial={{ opacity: 0, height: 0, y: -4 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        y: -2,
                        transition: {
                          opacity: { duration: 0.12 },
                          y: { duration: 0.12 },
                          height: { delay: 0.16, type: 'spring', stiffness: 440, damping: 36 },
                        },
                      }}
                      transition={{
                        height: { type: 'spring', stiffness: 420, damping: 34 },
                        opacity: { duration: 0.2 },
                        y: { duration: 0.18 },
                      }}
                      className="ml-7 overflow-visible"
                    >
                      <StepChecklistCodeBody
                        isActiveStep={isCurrentRow}
                        codePairs={codePairs as [string, { code: string }][]}
                        onStepComplete={handleStepVisualComplete}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {/* Completion hint removed — preview should auto-run when ready. */}
        </div>
          )}
        </>
      )}
    </div>
  );
}

const VIBE_PATH_DRAG = 'application/x-vibe-path';

function collectAllFolderPaths(fileKeys: string[], emptyFolders: string[]): Set<string> {
  const s = new Set<string>();
  for (const k of fileKeys) {
    const parts = k.split('/');
    let acc = '';
    for (let i = 0; i < parts.length - 1; i++) {
      acc = acc ? acc + '/' + parts[i] : parts[i];
      s.add(acc);
    }
  }
  for (const ef of emptyFolders) {
    const n = ef.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    if (!n) continue;
    let acc = '';
    for (const p of n.split('/')) {
      acc = acc ? acc + '/' + p : p;
      s.add(acc);
    }
  }
  return s;
}

function getTreeChildren(parentPath: string, allFiles: string[], allFolders: Set<string>) {
  const prefix = parentPath ? parentPath + '/' : '';
  const folderNames = new Set<string>();
  const fileNames: string[] = [];

  for (const p of allFiles) {
    if (!p.startsWith(prefix)) continue;
    const rest = p.slice(prefix.length);
    const i = rest.indexOf('/');
    if (i === -1) fileNames.push(p);
    else folderNames.add(rest.slice(0, i));
  }
  for (const fp of allFolders) {
    if (fp === parentPath || !fp.startsWith(prefix)) continue;
    const rest = fp.slice(prefix.length);
    if (!rest) continue;
    const i = rest.indexOf('/');
    if (i === -1) folderNames.add(rest);
    else folderNames.add(rest.slice(0, i));
  }
  return { folders: [...folderNames].sort(), files: fileNames.sort() };
}

function IdeFileTreeBranch({
  parentPath,
  depth,
  filePaths,
  allFolders,
  files,
  selectedFile,
  expandedFolders,
  onToggleFolder,
  onSelectFile,
  onMovePath,
  onRename,
  onRemove,
}: {
  parentPath: string;
  depth: number;
  filePaths: string[];
  allFolders: Set<string>;
  files: Record<string, { code: string; language: string; icon: React.ElementType; color: string }>;
  selectedFile: string;
  expandedFolders: Record<string, boolean>;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
  onMovePath: (from: string, toFolder: string) => void;
  onRename: (path: string, e: React.MouseEvent) => void;
  onRemove: (path: string, e: React.MouseEvent) => void;
}) {
  const { folders, files: filesHere } = getTreeChildren(parentPath, filePaths, allFolders);
  const pad = 12 + depth * 14;

  return (
    <>
      {folders.map((name) => {
        const fullPath = parentPath ? parentPath + '/' + name : name;
        const open = expandedFolders[fullPath] !== false;
        return (
          <div key={`folder-${fullPath}`}>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleFolder(fullPath);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = e.dataTransfer.getData(VIBE_PATH_DRAG);
                if (from) onMovePath(from, fullPath);
              }}
              className="flex cursor-pointer items-center gap-2 py-[5px] pr-2 text-[13px] text-[var(--vibe-text-secondary)] hover:bg-[var(--vibe-bg-elevated)] hover:text-[var(--vibe-text)]"
              style={{ paddingLeft: pad }}
              onClick={() => onToggleFolder(fullPath)}
            >
              <ChevronRight
                className={cn('h-3.5 w-3.5 shrink-0 text-[var(--vibe-text-dim)] transition-transform', open && 'rotate-90')}
              />
              <Folder className="h-3.5 w-3.5 shrink-0 text-[var(--vibe-text-secondary)]" strokeWidth={2} />
              <span className="truncate font-medium">{name}</span>
            </div>
            {open && (
              <IdeFileTreeBranch
                parentPath={fullPath}
                depth={depth + 1}
                filePaths={filePaths}
                allFolders={allFolders}
                files={files}
                selectedFile={selectedFile}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
                onMovePath={onMovePath}
                onRename={onRename}
                onRemove={onRemove}
              />
            )}
          </div>
        );
      })}
      {filesHere.map((path) => {
        const file = files[path];
        if (!file) return null;
        const Icon = file.icon;
        return (
          <div
            key={path}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(VIBE_PATH_DRAG, path);
              e.dataTransfer.effectAllowed = 'move';
            }}
          >
            <FileRow
              treeIndentPx={pad + 18}
              icon={<Icon className={cn('h-3.5 w-3.5 shrink-0', file.color)} />}
              label={path.includes('/') ? path.split('/').pop() ?? path : path}
              active={selectedFile === path}
              onClick={() => onSelectFile(path)}
              onRename={(e) => onRename(path, e)}
              onRemove={(e) => onRemove(path, e)}
            />
          </div>
        );
      })}
    </>
  );
}

type StoredVibeFile = { code: string; language: string };
type VibeAgentMeta = {
  status: 'idle' | 'running' | 'completed';
  currentTask?: string;
  progress?: number;
  lastUpdated?: number;
};

type StoredVibeProject = {
  id: string;
  title: string;
  prompt: string;
  createdAt: number;
  updatedAt: number;
  files: Record<string, StoredVibeFile>;
  messages: { role: 'user' | 'model'; content: string }[];
  agentMeta?: VibeAgentMeta;
  /** Snapshot of the last completed build checklist (for reopen UI). */
  completedPlanSteps?: (string | { text: string; failed?: boolean })[];
  /** One checklist per assistant turn (index 0 = first model message). */
  planChecklistsByModel?: (string | { text: string; failed?: boolean })[][];
};

/**
 * Fill missing `planChecklistsByModel` slots from each model message's `json:plan`, then `completedPlanSteps`.
 * Used on open so checklists survive after we strip model bodies for the UI (saves would otherwise erase json:plan).
 */
function mergePlanChecklistsIntoProject(proj: StoredVibeProject): {
  planChecklistsByModel: (string | { text: string; failed?: boolean })[][];
  changed: boolean;
} {
  const msgs = proj.messages ?? [];
  const modelContents: string[] = [];
  for (const m of msgs) {
    if (m.role === 'model') modelContents.push(String(m.content ?? ''));
  }
  const nModel = modelContents.length;
  const raw: (string | { text: string; failed?: boolean })[][] = Array.isArray(proj.planChecklistsByModel)
    ? proj.planChecklistsByModel.map((row) => [...(row ?? [])])
    : [];

  const completedFallback = normalizeStoredPlanSteps(proj.completedPlanSteps);

  for (let i = 0; i < nModel; i++) {
    const row = raw[i];
    const empty = !row || row.length === 0;
    if (!empty) continue;

    let fill: (string | { text: string; failed?: boolean })[] | null = null;
    const fromMsg = extractJsonPlanArray(modelContents[i] ?? '');
    if (fromMsg && fromMsg.length > 0) {
      fill = fromMsg.map((s) => s);
    } else if (completedFallback?.length) {
      fill = completedFallback.map((s) =>
        typeof s === 'string'
          ? s
          : {
              text: String((s as { text?: unknown }).text ?? ''),
              failed: Boolean((s as { failed?: boolean }).failed),
            },
      );
    }
    if (!fill?.length) continue;
    while (raw.length <= i) raw.push([]);
    raw[i] = fill;
  }

  const changed = JSON.stringify(proj.planChecklistsByModel ?? []) !== JSON.stringify(raw);
  return { planChecklistsByModel: raw, changed };
}

const VIBE_PROJECTS_STORAGE_KEY = 'vibeProjects_v1';

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function makeProjectId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function deriveProjectTitle(prompt: string) {
  const t = String(prompt ?? '').trim();
  if (!t) return 'Untitled Project';
  const firstLine = t.split('\n')[0]?.trim() ?? t;
  const cleaned = firstLine.replace(/\s+/g, ' ').slice(0, 42);
  return cleaned || 'Untitled Project';
}

export function VibeCoder({
  onBack: _onBack,
  initialPrompt,
  autoSubmitOnMount = false,
}: {
  onBack?: () => void;
  /** Prefill the workspace prompt (e.g. from chat “… /vibe coder”). */
  initialPrompt?: string;
  /** Send that prompt once after mount so generation starts automatically. */
  autoSubmitOnMount?: boolean;
} = {}) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const ideTerminalRef = useRef<IdeTerminalPanelHandle | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<StoredVibeProject[]>([]);
  const [projectsReady, setProjectsReady] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showProjectsMenu, setShowProjectsMenu] = useState(true);
  const needsProjectSaveRef = useRef(false);
  const lastPromptRef = useRef<string>('');
  const [projectSaveTick, setProjectSaveTick] = useState(0);
  const [projectQuery, setProjectQuery] = useState('');
  const [projectNameDialogOpen, setProjectNameDialogOpen] = useState(false);
  const [projectNameDialogDefault, setProjectNameDialogDefault] = useState('');
  const [projectDeleteTargetId, setProjectDeleteTargetId] = useState<string | null>(null);
  const [autoStartDraft, setAutoStartDraft] = useState<{
    prompt: string;
    defaultTitle: string;
  } | null>(null);
  const [dashboardTab, setDashboardTab] = useState<VibeDashboardTab>('All');
  const activeProjectIdRef = useRef<string | null>(null);
  /** True while a generation or preview-fix stream is running for a given project id (supports parallel projects). */
  const loadingByProjectRef = useRef<Record<string, boolean>>({});
  const streamingPidRef = useRef<string | null>(null);
  const backgroundStreamsRef = useRef<
    Record<
      string,
      {
        messages: { role: 'user' | 'model'; content: string }[];
        generationSteps: (string | { text: string; failed?: boolean })[];
        isLoading: boolean;
        files?: Record<string, StoredVibeFile>;
      }
    >
  >({});
  const [agentUiTick, setAgentUiTick] = useState(0);
  const liveAgentRef = useRef<{ task: string; progress: number }>({ task: '', progress: 0 });
  const [autoStartNameDialogOpen, setAutoStartNameDialogOpen] = useState(false);
  const [autoStartNameDialogDefault, setAutoStartNameDialogDefault] = useState('');
  const nextProjectTitleOverrideRef = useRef<string | null>(null);
  const [workspaceView, setWorkspaceView] = useState<'code' | 'preview'>('preview');
  const [deployCommitMessage, setDeployCommitMessage] = useState('chore: update workspace from Vibe Coder');
  const [isGithubDeploying, setIsGithubDeploying] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewFilesSnapshot, setPreviewFilesSnapshot] = useState<Record<string, { code: string }>>({});
  /** True until the preview iframe signals preview_ready (async runtime) or timeout */
  const [previewIframeBusy, setPreviewIframeBusy] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const previewAutoFixAttemptsRef = useRef<Record<string, number>>({});
  const previewAutoFixInFlightRef = useRef(false);
  const runSilentPreviewAutoFixRef = useRef<(rawErr: string, attempt: number) => Promise<void>>(async () => {});
  const [previewIssueUi, setPreviewIssueUi] = useState<{
    title: string;
    message: string;
    active: boolean;
    attempt: number;
  } | null>(null);

  const [generationSteps, setGenerationSteps] = useState<(string | { text: string, failed?: boolean })[]>([]);
  const generationStepsRef = useRef(generationSteps);
  useEffect(() => {
    generationStepsRef.current = generationSteps;
  }, [generationSteps]);
  const [stepHistory, setStepHistory] = useState<(string | { text: string, failed?: boolean })[][]>([]);
  const [previewFixSteps, setPreviewFixSteps] = useState<(string | { text: string, failed?: boolean })[]>([]);
  const [previewFixStreaming, setPreviewFixStreaming] = useState(false);

  const [quickPrompts, setQuickPrompts] = useState<string[]>([...FALLBACK_VIBE_PROMPTS]);
  const [quickPromptsLoading, setQuickPromptsLoading] = useState(true);

  const generationStepsSig = useMemo(
    () =>
      JSON.stringify(
        generationSteps.map((s) =>
          typeof s === 'string' ? s : String((s as { text?: unknown })?.text ?? ''),
        ),
      ),
    [generationSteps],
  );

  /** When a plan exists, false until the checklist UI finishes all steps; then live preview may reveal. */
  const [checklistReadyForPreview, setChecklistReadyForPreview] = useState(true);

  const prevGenerationStepsSigRef = useRef<string>('');
  const forceChecklistReadyRef = useRef(false);
  useEffect(() => {
    if (forceChecklistReadyRef.current) {
      forceChecklistReadyRef.current = false;
      setChecklistReadyForPreview(true);
      prevGenerationStepsSigRef.current = generationStepsSig;
      return;
    }
    if (generationSteps.length === 0) {
      setChecklistReadyForPreview(true);
      prevGenerationStepsSigRef.current = generationStepsSig;
      return;
    }
    // Only flip to “not ready” when a *new* generation plan starts.
    if (prevGenerationStepsSigRef.current !== generationStepsSig) {
      setChecklistReadyForPreview(false);
    }
    prevGenerationStepsSigRef.current = generationStepsSig;
  }, [generationStepsSig, generationSteps.length]);

  const checklistReadyForPreviewRef = useRef<boolean>(checklistReadyForPreview);
  useEffect(() => {
    checklistReadyForPreviewRef.current = checklistReadyForPreview;
  }, [checklistReadyForPreview]);

  const [generationRestoredComplete, setGenerationRestoredComplete] = useState(false);
  /** Chat-only Reading → Thinking priming after send when workspace already has files (not on project open). */
  type ChatPreStreamPhase = null | { phase: 'reading'; path: string };
  const [chatPreStream, setChatPreStream] = useState<ChatPreStreamPhase>(null);
  /** Shown when the model stream is slow to emit the first json:plan chunk. */
  const [streamStallHint, setStreamStallHint] = useState(false);

  useEffect(() => {
    if (!isLoading || generationSteps.length > 0 || chatPreStream) {
      setStreamStallHint(false);
      return;
    }
    const t = window.setTimeout(() => setStreamStallHint(true), 3200);
    return () => {
      window.clearTimeout(t);
      setStreamStallHint(false);
    };
  }, [isLoading, generationSteps.length, chatPreStream]);

  const applyChecklistRestore = useCallback((steps: (string | { text: string; failed?: boolean })[]) => {
    if (!steps.length) return;
    forceChecklistReadyRef.current = true;
    setGenerationRestoredComplete(true);
    setGenerationSteps(steps);
  }, []);

  const handleChecklistComplete = useCallback(() => {
    setChecklistReadyForPreview(true);
    const captureAndApply = () => {
      const src = filesRef.current;
      if (!src || Object.keys(src).length === 0) return false;
      const out: Record<string, { code: string }> = {};
      for (const [k, v] of Object.entries(src)) {
        out[k] = { code: v.code };
      }
      setPreviewFilesSnapshot(out);
      setPreviewKey((k) => k + 1);
      return true;
    };
    if (!captureAndApply()) {
      // filesRef might be stale; retry shortly after React flushes the current batch.
      setTimeout(() => captureAndApply(), 150);
    }
    // Persist project snapshot after the checklist finishes.
    needsProjectSaveRef.current = true;
    setProjectSaveTick((t) => t + 1);
    const pid = activeProjectIdRef.current;
    if (pid) {
      const now = Date.now();
      const snap = generationStepsRef.current.map((s) =>
        typeof s === 'string' ? s : { text: String((s as { text?: unknown }).text ?? ''), failed: Boolean((s as { failed?: boolean }).failed) },
      );
      const modelOrdinal = Math.max(
        0,
        messagesRef.current.filter((m) => m.role === 'model').length - 1,
      );
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== pid) return p;
          const plans = [...(p.planChecklistsByModel ?? [])];
          while (plans.length <= modelOrdinal) plans.push([]);
          plans[modelOrdinal] = snap;
          return {
            ...p,
            completedPlanSteps: snap,
            planChecklistsByModel: plans,
            agentMeta: {
              ...p.agentMeta,
              status: 'completed',
              progress: 100,
              currentTask: 'Plan complete',
              lastUpdated: now,
            },
          };
        })
      );
      setGenerationSteps([]);
      setStepHistory([]);
    }
  }, []);

  const canonicalizePreviewError = useCallback((rawErr: string) => {
    const e = String(rawErr || '').toLowerCase();
    if (e.includes('illegal return statement')) return 'illegal_return_statement';
    if (e.includes('objects are not valid as a react child')) return 'react_invalid_child_object';
    if (e.includes('no usable root')) return 'no_usable_root';
    if (e.includes('failed to execute') && e.includes('appendchild')) return 'dom_appendchild_failed';
    if (e.includes('unhandled') || e.includes('referenceerror') || e.includes('typeerror')) {
      return e.replace(/\s+/g, ' ').trim().slice(0, 120);
    }
    return e.replace(/\s+/g, ' ').trim().slice(0, 160);
  }, []);

  useEffect(() => {
    // Load saved Vibe Coder projects (real persistence via localStorage).
    try {
      const raw = localStorage.getItem(VIBE_PROJECTS_STORAGE_KEY);
      if (!raw) {
        setProjects([]);
        setProjectsReady(true);
        return;
      }
      const parsed = safeJsonParse<StoredVibeProject[]>(raw);
      if (!parsed || !Array.isArray(parsed)) {
        setProjects([]);
      } else {
        // Back-compat: older projects may not have `messages`.
        setProjects(
          parsed.map((p) => {
            const messages = Array.isArray(p.messages)
              ? p.messages.map((m) => ({
                  role: m?.role === 'user' ? 'user' : 'model',
                  content: typeof m?.content === 'string' ? m.content : String(m?.content ?? ''),
                }))
              : [];
            let planChecklistsByModel = Array.isArray(p.planChecklistsByModel) ? p.planChecklistsByModel : [];
            if (
              (!planChecklistsByModel || planChecklistsByModel.length === 0) &&
              p.completedPlanSteps &&
              messages.filter((m) => m.role === 'model').length === 1
            ) {
              const one = normalizeStoredPlanSteps(p.completedPlanSteps);
              if (one?.length) planChecklistsByModel = [one];
            }
            return {
              ...p,
              files: p.files ?? {},
              messages,
              planChecklistsByModel,
            };
          })
        );
      }
    } catch {
      setProjects([]);
    } finally {
      setProjectsReady(true);
    }
  }, []);

  const mergeAgentMetaForProject = useCallback((pid: string, patch: Partial<VibeAgentMeta>) => {
    const now = Date.now();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== pid) return p;
        const next: VibeAgentMeta = {
          status: 'idle',
          ...p.agentMeta,
          ...patch,
          lastUpdated: now,
        };
        const cur = p.agentMeta;
        if (
          cur &&
          next.status === cur.status &&
          next.currentTask === cur.currentTask &&
          next.progress === cur.progress
        ) {
          return p;
        }
        return {
          ...p,
          agentMeta: next,
        };
      })
    );
  }, []);

  const bumpAgentUi = useCallback(() => setAgentUiTick((t) => t + 1), []);

  const setLoadingForProject = useCallback((pid: string, loading: boolean) => {
    if (loading) loadingByProjectRef.current[pid] = true;
    else delete loadingByProjectRef.current[pid];
    if (activeProjectIdRef.current === pid) {
      setIsLoading(loading);
    }
    bumpAgentUi();
  }, [bumpAgentUi]);

  const handleMainChecklistProgress = useCallback(
    (payload: { label: string; progress: number }) => {
      if (previewFixSteps.length > 0 && (previewIssueUi?.active || previewFixStreaming)) return;
      liveAgentRef.current = { task: payload.label, progress: payload.progress };
      const pid = activeProjectIdRef.current;
      if (pid) {
        mergeAgentMetaForProject(pid, {
          status: 'running',
          currentTask: payload.label,
          progress: payload.progress,
        });
      }
      bumpAgentUi();
    },
    [previewFixSteps.length, previewIssueUi?.active, previewFixStreaming, mergeAgentMetaForProject, bumpAgentUi],
  );

  const handleFixChecklistProgress = useCallback(
    (payload: { label: string; progress: number }) => {
      const t = `Repair: ${payload.label}`;
      liveAgentRef.current = { task: t, progress: payload.progress };
      const pid = activeProjectIdRef.current;
      if (pid) {
        mergeAgentMetaForProject(pid, {
          status: 'running',
          currentTask: t,
          progress: payload.progress,
        });
      }
      bumpAgentUi();
    },
    [mergeAgentMetaForProject, bumpAgentUi],
  );

  const dashboardProjects = useMemo((): VibeDashboardProjectVM[] => {
    void agentUiTick;
    return projects.map((p) => {
      const f = p.files ?? {};
      const bytes = computeProjectTotalBytes(f);
      const tech = dominantProgrammingLabel(f);
      const size = formatBytes(bytes);
      const updated = new Date(p.updatedAt);
      const modules = Object.keys(f).length;

      const bg = backgroundStreamsRef.current[p.id];
      const refLoading = Boolean(loadingByProjectRef.current[p.id]);
      const streamRemote = streamingPidRef.current === p.id && activeProjectIdRef.current !== p.id;
      const activeRunning =
        activeProjectId === p.id &&
        (isLoading ||
          previewFixStreaming ||
          (generationSteps.length > 0 && !checklistReadyForPreview) ||
          (previewFixSteps.length > 0 && !checklistReadyForPreview));
      const running = refLoading || Boolean(bg?.isLoading) || streamRemote || activeRunning;

      let task = '';
      let progress = 0;
      if (activeRunning) {
        task = liveAgentRef.current.task || p.agentMeta?.currentTask || 'Working…';
        progress = liveAgentRef.current.progress || p.agentMeta?.progress || 0;
      } else if (refLoading || bg?.isLoading) {
        const gs = bg?.generationSteps ?? [];
        const first = gs[0];
        const raw = first ? (typeof first === 'string' ? first : first.text) : '';
        task = raw ? truncateStepLabel(raw) : 'Generating…';
        progress = Math.min(94, 8 + Math.min(86, (bg?.messages?.length ?? 0) * 4));
      } else {
        task = p.agentMeta?.currentTask ?? '';
        progress = p.agentMeta?.progress ?? 100;
      }

      return {
        id: p.id,
        name: p.title || 'Untitled',
        updatedAt: updated,
        tech,
        status: running ? 'active' : 'completed',
        size,
        modules,
        progress: running ? progress : 100,
        currentTask: running ? task : undefined,
      };
    });
  }, [
    projects,
    agentUiTick,
    activeProjectId,
    isLoading,
    generationSteps,
    checklistReadyForPreview,
    previewFixStreaming,
    previewFixSteps,
  ]);

  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  const projectDeleteLabel = useMemo(() => {
    if (!projectDeleteTargetId) return '';
    return projects.find((p) => p.id === projectDeleteTargetId)?.title ?? 'this project';
  }, [projectDeleteTargetId, projects]);

  useEffect(() => {
    if (!projectsReady) return;
    try {
      localStorage.setItem(VIBE_PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch {
      /* ignore quota errors */
    }
  }, [projectsReady, projects]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type !== 'preview_ready' && d.type !== 'preview_error') return;
      const win = previewIframeRef.current?.contentWindow;
      if (win != null && e.source !== win) return;
      setPreviewIframeBusy(false);
      if (d.type !== 'preview_error') {
        setPreviewIssueUi((prev) => (prev ? { ...prev, active: false } : prev));
        return;
      }
      const rawErr = typeof d.error === 'string' ? d.error.trim() : 'Unknown preview runtime error';
      setPreviewIssueUi({
        title: 'Live preview failed',
        message: rawErr,
        active: true,
        attempt: 0,
      });
      // Only run checklist-based auto-fix while the main checklist is paused.
      if (checklistReadyForPreviewRef.current) return;
      const apid = activeProjectIdRef.current;
      if (!rawErr || previewAutoFixInFlightRef.current) return;
      if (apid && loadingByProjectRef.current[apid]) return;
      // Normalize so repeated variants of the same crash are capped.
      const signature = canonicalizePreviewError(rawErr);
      const attempts = previewAutoFixAttemptsRef.current[signature] ?? 0;
      if (attempts >= 3) return;
      previewAutoFixAttemptsRef.current[signature] = attempts + 1;
      previewAutoFixInFlightRef.current = true;
      void (async () => {
        try {
          await runSilentPreviewAutoFixRef.current(rawErr, attempts + 1);
        } finally {
          previewAutoFixInFlightRef.current = false;
        }
      })();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [canonicalizePreviewError]);

  useEffect(() => {
    if (!previewIframeBusy) return;
    const t = window.setTimeout(() => setPreviewIframeBusy(false), 15000);
    return () => window.clearTimeout(t);
  }, [previewIframeBusy, previewKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setQuickPromptsLoading(true);
      const generated = await generateVibeQuickPrompts();
      if (!cancelled) {
        if (generated.length >= 3) {
          setQuickPrompts(generated.slice(0, 3));
        } else {
          setQuickPrompts([...FALLBACK_VIBE_PROMPTS]);
        }
        setQuickPromptsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [files, setFiles] = useState<Record<string, { code: string, language: string, icon: React.ElementType, color: string }>>({});
  const [fileTreeWidthPx, setFileTreeWidthPx] = useState(280);
  const workspaceFilesPayload = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(files)) {
      out[k] = v.code;
    }
    return out;
  }, [files]);

  const storedFilesForProject = useMemo(() => {
    const out: Record<string, StoredVibeFile> = {};
    for (const [k, v] of Object.entries(files)) {
      out[k] = { code: v.code, language: v.language };
    }
    return out;
  }, [files]);

  const storedMessagesForProject = useMemo(
    () => messages.map((m) => ({ role: m.role, content: m.content })),
    [messages]
  );

  useEffect(() => {
    if (showProjectsMenu) return;
    if (!activeProjectId) return;
    if (!needsProjectSaveRef.current) return;

    const t = window.setTimeout(() => {
      if (!activeProjectId) return;
      if (!needsProjectSaveRef.current) return;
      const now = Date.now();
      const nextPrompt = lastPromptRef.current || '';

      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId
            ? {
                ...p,
                title: p.title || deriveProjectTitle(nextPrompt || ''),
                prompt: nextPrompt || p.prompt,
                updatedAt: now,
                files: storedFilesForProject,
                messages: storedMessagesForProject,
              }
            : p
        )
      );
      needsProjectSaveRef.current = false;
    }, 450);

    return () => window.clearTimeout(t);
  }, [storedFilesForProject, storedMessagesForProject, activeProjectId, showProjectsMenu, projectSaveTick]);

  useEffect(() => {
    if (showProjectsMenu) return;
    if (!activeProjectId) return;
    // Avoid hammering localStorage during streaming; save after the model stops.
    if (isLoading) return;

    needsProjectSaveRef.current = true;
    const t = window.setTimeout(() => setProjectSaveTick((x) => x + 1), 900);
    return () => window.clearTimeout(t);
  }, [files, messages, isLoading, showProjectsMenu, activeProjectId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      fetch('/__vibe_sync_sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: workspaceFilesPayload }),
      }).catch(() => {});
    }, 400);
    return () => window.clearTimeout(id);
  }, [workspaceFilesPayload]);

  const startFileTreeResize = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = fileTreeWidthPx;
      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        setFileTreeWidthPx(Math.min(520, Math.max(180, startW + dx)));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [fileTreeWidthPx],
  );
  const [emptyFolders, setEmptyFolders] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    setEmptyFolders((prev) =>
      prev.filter((ef) => {
        const normalized = ef.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
        if (!normalized) return false;
        const hasRealFile = Object.keys(files).some(
          (k) => k === normalized || k.startsWith(normalized + '/')
        );
        return !hasRealFile;
      })
    );
  }, [files]);

  /** Show iframe loading overlay when switching to preview or after an explicit preview refresh — not on every streamed file edit (avoids flicker). */
  useEffect(() => {
    if (workspaceView !== 'preview') return;
    if (Object.keys(filesRef.current).length === 0) return;
    setPreviewIframeBusy(true);
  }, [workspaceView, previewKey]);

  // Freeze iframe contents until checklist completion. We intentionally do NOT
  // bind the iframe srcDoc to `files` while a checklist is running.
  useEffect(() => {
    if (workspaceView !== 'preview') return;
    if (!checklistReadyForPreview) return;
    if (previewFixSteps.length > 0) return;
    if (previewFixStreaming) return;
    if (previewIssueUi?.active) return;
    if (Object.keys(filesRef.current).length === 0) return;
    setPreviewFilesSnapshot(() => {
      const out: Record<string, { code: string }> = {};
      for (const [k, v] of Object.entries(filesRef.current)) {
        out[k] = { code: v.code };
      }
      return out;
    });
  }, [workspaceView, checklistReadyForPreview, previewFixSteps.length, previewFixStreaming, previewIssueUi?.active]);

  // Failsafe: if checklist is done, files exist, but previewFilesSnapshot is still empty, populate it.
  const fileKeys = useMemo(() => Object.keys(files), [files]);
  const snapshotKeys = useMemo(() => Object.keys(previewFilesSnapshot), [previewFilesSnapshot]);
  useEffect(() => {
    if (fileKeys.length === 0) return;
    if (snapshotKeys.length > 0) return;
    if (!checklistReadyForPreview) return;
    if (isLoading) return;
    setPreviewFilesSnapshot(() => {
      const out: Record<string, { code: string }> = {};
      for (const [k, v] of Object.entries(filesRef.current)) {
        out[k] = { code: v.code };
      }
      return out;
    });
    setPreviewKey((k) => k + 1);
  }, [fileKeys.length, snapshotKeys.length, checklistReadyForPreview, isLoading]);

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>([]);

  const openFileInTab = useCallback((path: string) => {
    setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setSelectedFile(path);
  }, []);

  const closeTab = useCallback((path: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== path);
      if (path === selectedFile) {
        const idx = prev.indexOf(path);
        const newSel = next[Math.min(idx, next.length - 1)] ?? '';
        setSelectedFile(newSel);
      }
      return next;
    });
  }, [selectedFile]);

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ path: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInnerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const projectsRef = useRef(projects);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  /** Per assistant turn; backfill from `completedPlanSteps` when per-turn arrays are missing (legacy projects). */
  const planChecklistsByModel = useMemo(() => {
    const p = projects.find((x) => x.id === activeProjectId);
    const raw = Array.isArray(p?.planChecklistsByModel) ? [...p.planChecklistsByModel] : [];
    const fallback = normalizeStoredPlanSteps(p?.completedPlanSteps);
    const nModel = messages.filter((m) => m.role === 'model').length;
    if (fallback?.length && nModel > 0) {
      for (let i = 0; i < nModel; i++) {
        const row = raw[i];
        if (!row || (Array.isArray(row) && row.length === 0)) {
          while (raw.length <= i) raw.push([]);
          raw[i] = fallback.map((s) =>
            typeof s === 'string'
              ? s
              : {
                  text: String((s as { text?: unknown }).text ?? ''),
                  failed: Boolean((s as { failed?: boolean }).failed),
                },
          );
        }
      }
    }
    return raw;
  }, [projects, activeProjectId, messages]);

  const flushCurrentProjectSnapshot = useCallback(() => {
    if (!activeProjectId) return;
    const now = Date.now();
    const nextPrompt = lastPromptRef.current || '';

    const snapshotFiles: Record<string, StoredVibeFile> = {};
    for (const [k, v] of Object.entries(filesRef.current)) {
      snapshotFiles[k] = { code: v.code, language: v.language };
    }
    const snapshotMessages = messagesRef.current.map((m) => ({ role: m.role, content: m.content }));

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              title: p.title || deriveProjectTitle(nextPrompt || ''),
              prompt: nextPrompt || p.prompt,
              updatedAt: now,
              files: snapshotFiles,
              messages: snapshotMessages,
            }
          : p
      )
    );
    needsProjectSaveRef.current = false;
  }, [activeProjectId, setProjects]);

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      let lang = 'text';
      let icon = FileCode;
      let color = 'text-gray-400';
      
      if (newFileName.endsWith('.html')) { lang = 'html'; icon = HtmlIcon; color = ''; }
      else if (newFileName.endsWith('.css')) { lang = 'css'; icon = CssIcon; color = ''; }
      else if (newFileName.endsWith('.js') || newFileName.endsWith('.jsx')) { lang = 'javascript'; icon = JsIcon; color = ''; }
      else if (newFileName.endsWith('.ts') || newFileName.endsWith('.tsx')) { lang = 'typescript'; icon = TsIcon; color = ''; }
      else if (newFileName.endsWith('.py')) { lang = 'python'; icon = PythonIcon; color = ''; }
      else if (newFileName.endsWith('.json')) { lang = 'json'; icon = FileJson; color = 'text-green-400'; }

      setFiles(prev => ({
        ...prev,
        [newFileName]: {
          code: '',
          language: lang,
          icon,
          color
        }
      }));
      setSelectedFile(newFileName);
    }
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const inferFileLanguage = useCallback((path: string): string => {
    const n = path.toLowerCase();
    if (n.endsWith('.html') || n.endsWith('.htm')) return 'html';
    if (n.endsWith('.css')) return 'css';
    if (n.endsWith('.js') || n.endsWith('.jsx')) return 'javascript';
    if (n.endsWith('.ts') || n.endsWith('.tsx')) return 'typescript';
    if (n.endsWith('.py')) return 'python';
    if (n.endsWith('.json')) return 'json';
    return 'text';
  }, []);

  const fileIconColorForPath = useCallback(
    (path: string): { icon: React.ElementType; color: string; language: string } => {
      const lang = inferFileLanguage(path);
      let icon: React.ElementType = FileCode;
      let color = 'text-gray-400';
      if (lang === 'html') {
        icon = HtmlIcon;
        color = '';
      } else if (lang === 'css') {
        icon = CssIcon;
        color = '';
      } else if (lang === 'javascript') {
        icon = JsIcon;
        color = '';
      } else if (lang === 'typescript') {
        icon = TsIcon;
        color = '';
      } else if (lang === 'python') {
        icon = PythonIcon;
        color = '';
      } else if (lang === 'json') {
        icon = FileJson;
        color = 'text-green-400';
      }
      return { icon, color, language: lang };
    },
    [inferFileLanguage]
  );

  const snapshotFilesToStored = useCallback(
    (src: Record<string, { code: string; language: string }>): Record<string, StoredVibeFile> => {
      const out: Record<string, StoredVibeFile> = {};
      for (const [k, v] of Object.entries(src)) {
        out[k] = { code: v.code, language: v.language };
      }
      return out;
    },
    [],
  );

  const stashOngoingStreamForProject = useCallback(
    (pid: string) => {
      if (!loadingByProjectRef.current[pid]) return;
      backgroundStreamsRef.current[pid] = {
        messages: messagesRef.current.map((m) => ({ ...m })),
        generationSteps: [...generationStepsRef.current],
        isLoading: true,
        files: snapshotFilesToStored(filesRef.current as Record<string, { code: string; language: string }>),
      };
      setAgentUiTick((t) => t + 1);
    },
    [snapshotFilesToStored],
  );

  const hydrateStoredFiles = useCallback(
    (storedFiles: Record<string, StoredVibeFile>): Record<string, { code: string, language: string, icon: React.ElementType, color: string }> => {
      const next: Record<string, { code: string, language: string, icon: React.ElementType, color: string }> = {};
      for (const [path, f] of Object.entries(storedFiles || {})) {
        const { icon, color, language } = fileIconColorForPath(path);
        next[path] = {
          code: f?.code ?? '',
          language: f?.language || language,
          icon,
          color,
        };
      }
      return next;
    },
    [fileIconColorForPath]
  );

  const openProject = useCallback(
    (id: string) => {
      const proj = projects.find((p) => p.id === id);
      if (!proj) return;
      if (activeProjectId === id && !showProjectsMenu) return;

      const mergedPlans = mergePlanChecklistsIntoProject(proj);
      if (mergedPlans.changed) {
        const now = Date.now();
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, planChecklistsByModel: mergedPlans.planChecklistsByModel, updatedAt: now }
              : p,
          ),
        );
      }
      const planRowsForOpen = mergedPlans.planChecklistsByModel;

      setGenerationRestoredComplete(false);
      setChatPreStream(null);

      const cur = activeProjectIdRef.current;
      if (cur && cur !== id) {
        stashOngoingStreamForProject(cur);
        flushCurrentProjectSnapshot();
      } else {
        flushCurrentProjectSnapshot();
      }

      const bg = backgroundStreamsRef.current[id];
      const storedFiles = bg?.files ?? proj.files ?? {};
      const nextFiles = hydrateStoredFiles(storedFiles);
      const first = Object.keys(nextFiles)[0] ?? '';

      const completedFromStored = normalizeStoredPlanSteps(proj.completedPlanSteps);
      const completedFromMessages =
        proj.agentMeta?.status === 'completed' && !completedFromStored?.length
          ? extractPlanFromMessages(proj.messages)
          : null;
      const completedSteps =
        completedFromStored?.length ? completedFromStored : completedFromMessages;

      if (bg) {
        delete backgroundStreamsRef.current[id];
        if (bg.isLoading) loadingByProjectRef.current[id] = true;
        else delete loadingByProjectRef.current[id];
      }

      setActiveProjectId(id);
      activeProjectIdRef.current = id;
      setShowProjectsMenu(false);
      setAutoStartDraft(null);
      lastPromptRef.current = proj.prompt || '';
      setFiles(nextFiles);
      setSelectedFile(first);

      setInput('');
      {
        const rawMsgs = bg ? bg.messages : proj.messages;
        const stripModelBodies =
          !bg && Boolean(completedSteps?.length) && rawMsgs.some((m) => m.role === 'model');
        setMessages(
          stripModelBodies
            ? rawMsgs.map((m) => (m.role === 'model' ? { ...m, content: '' } : m))
            : rawMsgs
        );
      }
      setIsLoading(!!loadingByProjectRef.current[id]);
      if (bg) {
        setGenerationSteps(bg.generationSteps);
      } else {
        setGenerationSteps([]);
        const rawForRestore = proj.messages ?? [];
        const msgCount = rawForRestore.length;
        const hasPerTurnPlans =
          Array.isArray(planRowsForOpen) &&
          planRowsForOpen.some((x) => Array.isArray(x) && x.length > 0);
        if (completedSteps?.length) {
          if (msgCount > 0 && hasPerTurnPlans) {
            forceChecklistReadyRef.current = true;
            setGenerationRestoredComplete(true);
          } else {
            applyChecklistRestore(completedSteps);
          }
        }
      }
      setStepHistory([]);
      setPreviewFixSteps([]);
      setPreviewFixStreaming(false);
      setPreviewIssueUi(null);
      setWorkspaceView('preview');
      setPreviewFilesSnapshot(() => {
        const out: Record<string, { code: string }> = {};
        for (const [k, v] of Object.entries(nextFiles)) {
          out[k] = { code: v.code };
        }
        return out;
      });
      setPreviewKey((k) => k + 1);
    },
    [
      projects,
      hydrateStoredFiles,
      flushCurrentProjectSnapshot,
      stashOngoingStreamForProject,
      activeProjectId,
      showProjectsMenu,
      applyChecklistRestore,
    ]
  );

  const startNewProject = useCallback(
    (opts?: { title?: string; prompt?: string }) => {
    setGenerationRestoredComplete(false);
    setChatPreStream(null);
    const cur = activeProjectIdRef.current;
    if (cur) stashOngoingStreamForProject(cur);
    // Persist any unsaved in-memory chat/code before switching projects.
    flushCurrentProjectSnapshot();
    const id = makeProjectId();
    const now = Date.now();
    const title = (opts?.title ?? 'New Vibe Project').trim();
    const newProject: StoredVibeProject = {
      id,
      title,
      prompt: opts?.prompt ?? '',
      createdAt: now,
      updatedAt: now,
      files: {},
      messages: [],
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(id);
    setShowProjectsMenu(false);
    setAutoStartDraft(null);
    lastPromptRef.current = '';

    setFiles({});
    setSelectedFile('');
    setOpenTabs([]);
    setInput('');
    setMessages([]);
    setIsLoading(false);
    setGenerationSteps([]);
    setStepHistory([]);
    setPreviewFixSteps([]);
    setPreviewFixStreaming(false);
    setPreviewIssueUi(null);
    setWorkspaceView('preview');
    setPreviewFilesSnapshot({});
    setPreviewKey((k) => k + 1);
    },
    [flushCurrentProjectSnapshot, stashOngoingStreamForProject],
  );

  const beginProjectCreateName = useCallback(() => {
    setProjectNameDialogDefault('New Vibe Project');
    setProjectNameDialogOpen(true);
  }, []);

  const applyProjectNameDialogConfirm = useCallback(
    (value: string) => {
      const v = String(value || '').trim();
      if (!v) {
        setProjectNameDialogOpen(false);
        return;
      }

      startNewProject({ title: v, prompt: '' });
      setProjectNameDialogOpen(false);
    },
    [startNewProject]
  );

  const deleteProjectNow = useCallback(
    (id: string) => {
      delete backgroundStreamsRef.current[id];
      delete loadingByProjectRef.current[id];
      if (streamingPidRef.current === id) streamingPidRef.current = null;
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        activeProjectIdRef.current = null;
        setGenerationRestoredComplete(false);
        setChatPreStream(null);
        setActiveProjectId(null);
        setShowProjectsMenu(true);
        setFiles({});
        setSelectedFile('');
        setMessages([]);
        setIsLoading(false);
        setGenerationSteps([]);
        setStepHistory([]);
        setPreviewFixSteps([]);
        setPreviewFixStreaming(false);
        setPreviewIssueUi(null);
        setPreviewFilesSnapshot({});
        setPreviewKey((k) => k + 1);
      }
      setProjectDeleteTargetId(null);
    },
    [
      activeProjectId,
      setProjects,
    ]
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const checklistScrollTimerRef = useRef<number | null>(null);

  const CHAT_NEAR_BOTTOM_PX = 140;
  /** User scrolled up — don’t auto-scroll on stream/checklist until they return near bottom. */
  const userAtBottomRef = useRef(true);

  const onChatScroll = useCallback(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const dist = sc.scrollHeight - sc.scrollTop - sc.clientHeight;
    userAtBottomRef.current = dist < CHAT_NEAR_BOTTOM_PX;
  }, []);

  const scrollChatIfNearBottom = useCallback(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    if (!userAtBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, []);

  /** After send: always follow the new turn. */
  const scrollChatToBottomForced = useCallback(() => {
    userAtBottomRef.current = true;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  /** Debounced — only follow if user is already near bottom (no scroll “fight” when reading up) */
  const scrollChatAfterChecklist = useCallback(() => {
    if (checklistScrollTimerRef.current != null) window.clearTimeout(checklistScrollTimerRef.current);
    checklistScrollTimerRef.current = window.setTimeout(() => {
      checklistScrollTimerRef.current = null;
      scrollChatIfNearBottom();
    }, 72);
  }, [scrollChatIfNearBottom]);

  useEffect(() => {
    scrollChatIfNearBottom();
    const t = window.setTimeout(scrollChatIfNearBottom, 60);
    return () => window.clearTimeout(t);
  }, [messages, generationSteps, stepHistory, isLoading, scrollChatIfNearBottom]);

  const handleSend = async (message: string, attachedFiles?: File[]) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    lastPromptRef.current = trimmed;
    // Default to preview view while coding; keeps the workflow “see changes immediately”.
    setWorkspaceView('preview');
    if (!activeProjectId) {
      const newId = makeProjectId();
      const overrideTitle = nextProjectTitleOverrideRef.current?.trim() || null;
      nextProjectTitleOverrideRef.current = null;
      const placeholderTitle = overrideTitle || deriveProjectTitle(trimmed);
      const newProject: StoredVibeProject = {
        id: newId,
        title: placeholderTitle,
        prompt: trimmed,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files: {},
        messages: [],
      };
      setProjects((prev) => [newProject, ...prev]);
      setActiveProjectId(newId);
      activeProjectIdRef.current = newId;
      setShowProjectsMenu(false);
      setWorkspaceView('preview');
      // AI-generate a better project name in the background
      void (async () => {
        try {
          const aiTitle = await generateTitle(trimmed);
          if (aiTitle && aiTitle !== 'New Chat') {
            setProjects((prev) =>
              prev.map((p) => (p.id === newId ? { ...p, title: aiTitle } : p)),
            );
          }
        } catch { /* keep placeholder title on failure */ }
      })();
    }

    const ownerId = activeProjectIdRef.current;
    if (!ownerId || loadingByProjectRef.current[ownerId]) return;

    setGenerationRestoredComplete(false);

    if (message.startsWith("[Terminal: ")) {
      const actualMessage = message.replace("[Terminal: ", "").slice(0, -1);
      setMessages([...messages, { role: 'user', content: 'Running command: ' + actualMessage }]);
      setLoadingForProject(ownerId, true);
      setGenerationSteps(['Opening terminal', 'Planning command', 'Executing']);

      setIsTerminalOpen(true);
      window.setTimeout(() => {
        // Match Ctrl+K flow: Vibe command planning + execution stream.
        ideTerminalRef.current?.runVibeInstruction(actualMessage);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: 'Terminal task sent (Ctrl+K style execution).',
          },
        ]);
        setLoadingForProject(ownerId, false);
        setGenerationSteps([]);
      }, 450);
      return;
    }

    const newMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(newMessages);
    queueMicrotask(() => scrollChatToBottomForced());
    setInput('');
    setLoadingForProject(ownerId, true);
    setGenerationSteps([]);
    setStepHistory([]);
    {
      const thinkPid = activeProjectIdRef.current;
      if (thinkPid) {
        liveAgentRef.current = { task: 'Thinking', progress: 10 };
        mergeAgentMetaForProject(thinkPid, { status: 'running', currentTask: 'Thinking', progress: 10 });
        bumpAgentUi();
      }
    }

    try {
      const streamOwnerId = ownerId;
      streamingPidRef.current = streamOwnerId;

      let fullResponse = '';
      setMessages((prev) => [...prev, { role: 'model', content: '' }]);
      queueMicrotask(() => scrollChatToBottomForced());

      const workspacePathsForPrime = Object.keys(filesRef.current).sort();
      if (workspacePathsForPrime.length > 0) {
        const delayPer = Math.min(
          280,
          Math.max(90, Math.floor(3200 / Math.max(1, workspacePathsForPrime.length))),
        );
        try {
          for (const path of workspacePathsForPrime) {
            setChatPreStream({ phase: 'reading', path });
            await new Promise<void>((r) => window.setTimeout(r, delayPer));
          }
          setChatPreStream(null);
          try {
            const snippet = buildWorkspaceAuditSnippet(
              Object.fromEntries(
                Object.entries(filesRef.current).map(([k, v]) => [k, { code: v.code }]),
              ),
            );
            if (snippet) {
              for await (const chunk of streamVibeWorkspaceAudit(snippet)) {
                void chunk;
              }
            }
          } catch {
            /* ignore */
          }
        } finally {
          setChatPreStream(null);
        }
      }

      let resolvedSite: Awaited<ReturnType<typeof resolveCompanySite>> = null;
      if (!detectWebsiteThemeKey(message)) {
        const hint = extractCompanyNameFromPrompt(message);
        if (hint) {
          try {
            resolvedSite = await Promise.race([
              resolveCompanySite(hint),
              new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2800)),
            ]);
          } catch {
            resolvedSite = null;
          }
        }
      }

      const themeResearch =
        (await buildWebsiteThemeResearchAddendumAsync(message, resolvedSite)) ?? null;
      const websiteIntent =
        buildWebsiteIntentAddendum(message) ?? null;
      const themeAddendum = [themeResearch, websiteIntent].filter(Boolean).join('\n\n');

      const imageAttachments = await filesToStreamImageAttachments(attachedFiles);
      const imageInstruction =
        imageAttachments.length > 0
          ? '\n\n**User-attached image(s):** Images are included with this user message — analyze them when asked and use what you see (layout, colors, typography, UI) in your plan and code when relevant.'
          : '';

      const stream = streamChat(
        newMessages,
        message,
        VIBE_CODER_SYSTEM_PROMPT +
          imageInstruction +
          (themeAddendum ? `\n\n${themeAddendum}` : '') +
          buildWorkspaceContextForPrompt(files),
        false,
        'high',
        imageAttachments.length > 0 ? imageAttachments : undefined,
      );
      
      let lastPlanSig = '';

      const routeStreamMessages = (content: string) => {
        const sp = streamingPidRef.current;
        const ap = activeProjectIdRef.current;
        if (sp && ap !== sp) {
          const bucket = backgroundStreamsRef.current[sp] ?? {
            messages: messagesRef.current.map((m) => ({ ...m })),
            generationSteps: [...generationStepsRef.current],
            isLoading: true,
            files: snapshotFilesToStored(filesRef.current as Record<string, { code: string; language: string }>),
          };
          const updated = [...bucket.messages];
          if (updated.length > 0) {
            updated[updated.length - 1] = { ...updated[updated.length - 1], content };
          }
          bucket.messages = updated;
          backgroundStreamsRef.current[sp] = bucket;
          setProjects((prev) =>
            prev.map((p) => (p.id === sp ? { ...p, messages: updated.map((m) => ({ ...m })) } : p)),
          );
          setAgentUiTick((t) => t + 1);
          return;
        }
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = content;
          return updated;
        });
      };

      const routeGenerationSteps = (normalized: (string | { text: string; failed?: boolean })[]) => {
        const sp = streamingPidRef.current;
        const ap = activeProjectIdRef.current;
        if (sp && ap !== sp) {
          const bucket = backgroundStreamsRef.current[sp] ?? {
            messages: messagesRef.current.map((m) => ({ ...m })),
            generationSteps: [],
            isLoading: true,
            files: snapshotFilesToStored(filesRef.current as Record<string, { code: string; language: string }>),
          };
          bucket.generationSteps = normalized;
          backgroundStreamsRef.current[sp] = bucket;
          setAgentUiTick((t) => t + 1);
          return;
        }
        setGenerationSteps(normalized);
      };

      for await (const chunk of stream) {
        fullResponse += chunk;
        routeStreamMessages(fullResponse);

        // Re-parse whenever the json:plan block grows so we don't freeze on the first partial array.
        const plan = extractJsonPlanArray(fullResponse);
        if (plan && plan.length > 0) {
          const normalized = planUiPolicy(plan, message, 'normal', Object.keys(files).length);
          const sig = JSON.stringify(normalized);
          if (sig !== lastPlanSig) {
            lastPlanSig = sig;
            routeGenerationSteps(normalized);
          }
        }
      }

      // Apply extracted code only after the full model response is complete.
      // This reduces preview flicker and prevents auto-fix being triggered by partial streams.
      const blocks = extractGeneratedCodeBlocks(fullResponse);
      const extractedFiles: Record<string, { code: string, language: string, icon: React.ElementType, color: string }> = {};
      for (const block of blocks) {
        const lang = block.lang || 'text';
        const specifiedName = block.filename;
        const code = decodeEscapedSourceCode(block.code);

        let baseName = specifiedName || '';
        let icon = FileCode;
        let color = 'text-gray-400';

        if (!baseName) {
          if (lang === 'html') {
            baseName = 'index.html';
            icon = HtmlIcon;
            color = '';
          } else if (lang === 'css') {
            baseName = 'styles.css';
            icon = CssIcon;
            color = '';
          } else if (lang === 'javascript' || lang === 'js') {
            baseName = 'script.js';
            icon = JsIcon;
            color = '';
          } else if (lang === 'typescript' || lang === 'ts') {
            baseName = 'script.ts';
            icon = TsIcon;
            color = '';
          } else if (lang === 'python' || lang === 'py') {
            baseName = 'script.py';
            icon = PythonIcon;
            color = '';
          } else if (lang === 'json') {
            baseName = 'data.json';
            icon = FileJson;
            color = 'text-green-400';
          } else {
            baseName = 'file.' + lang;
          }
        } else {
          if (baseName.endsWith('.html')) { icon = HtmlIcon; color = ''; }
          else if (baseName.endsWith('.css')) { icon = CssIcon; color = ''; }
          else if (baseName.endsWith('.js') || baseName.endsWith('.jsx')) { icon = JsIcon; color = ''; }
          else if (baseName.endsWith('.ts') || baseName.endsWith('.tsx')) { icon = TsIcon; color = ''; }
          else if (baseName.endsWith('.py')) { icon = PythonIcon; color = ''; }
          else if (baseName.endsWith('.json')) { icon = FileJson; color = 'text-green-400'; }
        }

        let fileName = baseName;
        let counter = 1;
        while (extractedFiles[fileName]) {
          const parts = baseName.split('.');
          const ext = parts.pop();
          fileName = parts.join('.') + counter + '.' + ext;
          counter++;
        }

        extractedFiles[fileName] = {
          code,
          language: lang,
          icon,
          color,
        };
      }

      if (Object.keys(extractedFiles).length > 0) {
        const sp = streamingPidRef.current;
        const ap = activeProjectIdRef.current;
        if (sp && ap !== sp) {
          const storedPatch: Record<string, StoredVibeFile> = {};
          for (const [k, v] of Object.entries(extractedFiles)) {
            storedPatch[k] = { code: v.code, language: v.language };
          }
          const bucketMsgs = backgroundStreamsRef.current[sp]?.messages;
          setProjects((prev) =>
            prev.map((p) =>
              p.id === sp
                ? {
                    ...p,
                    files: { ...(p.files ?? {}), ...storedPatch },
                    messages: (bucketMsgs ?? p.messages).map((m) => ({ ...m })),
                    updatedAt: Date.now(),
                    agentMeta: {
                      status: 'completed',
                      progress: 100,
                      currentTask: 'Done',
                      lastUpdated: Date.now(),
                    },
                  }
                : p
            )
          );
          delete backgroundStreamsRef.current[sp];
        } else {
          setFiles((prev) => ({ ...prev, ...extractedFiles }));
          const autoSel = Object.keys(extractedFiles)[0];
          setSelectedFile((prev) => {
            const sel = prev || autoSel;
            if (sel) setOpenTabs((tabs) => tabs.includes(sel) ? tabs : [...tabs, sel]);
            return sel;
          });
        }
      }

      mergeAgentMetaForProject(streamOwnerId, {
        status: 'completed',
        progress: 100,
        currentTask: 'Done',
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoadingForProject(ownerId, false);
      if (streamingPidRef.current === ownerId) streamingPidRef.current = null;
    }
  };

  const sendFollowUpToProjectInBackground = useCallback(
    async (projectId: string, message: string) => {
      if (loadingByProjectRef.current[projectId]) return;
      const proj = projectsRef.current.find((p) => p.id === projectId);
      if (!proj) return;

      const workspaceForPrompt = Object.fromEntries(
        Object.entries(proj.files ?? {}).map(([k, v]) => [k, { code: v?.code ?? '' }]),
      ) as Record<string, { code: string }>;
      const newMessages = [...(proj.messages ?? []), { role: 'user' as const, content: message }];
      const storedFilesSnapshot: Record<string, StoredVibeFile> = { ...(proj.files ?? {}) };

      streamingPidRef.current = projectId;
      setLoadingForProject(projectId, true);
      mergeAgentMetaForProject(projectId, { status: 'running', currentTask: 'Thinking', progress: 10 });

      backgroundStreamsRef.current[projectId] = {
        messages: [...newMessages, { role: 'model' as const, content: '' }],
        generationSteps: [],
        isLoading: true,
        files: storedFilesSnapshot,
      };

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, messages: [...backgroundStreamsRef.current[projectId].messages] }
            : p,
        ),
      );

      const streamOwnerId = projectId;

      try {
        let fullResponse = '';
        const stream = streamChat(
          newMessages,
          message,
          VIBE_CODER_SYSTEM_PROMPT + buildWorkspaceContextForPrompt(workspaceForPrompt),
          false,
          'high',
        );

        let lastPlanSig = '';

        const routeStreamMessages = (content: string) => {
          const sp = streamingPidRef.current;
          const ap = activeProjectIdRef.current;
          if (sp && ap !== sp) {
            const bucket = backgroundStreamsRef.current[sp] ?? {
              messages: [],
              generationSteps: [],
              isLoading: true,
              files: storedFilesSnapshot,
            };
            const updated = [...bucket.messages];
            if (updated.length > 0) {
              updated[updated.length - 1] = { ...updated[updated.length - 1], content };
            }
            bucket.messages = updated;
            backgroundStreamsRef.current[sp] = bucket;
            setProjects((prev) =>
              prev.map((p) => (p.id === sp ? { ...p, messages: updated.map((m) => ({ ...m })) } : p)),
            );
            setAgentUiTick((t) => t + 1);
          }
        };

        const routeGenerationSteps = (normalized: (string | { text: string; failed?: boolean })[]) => {
          const sp = streamingPidRef.current;
          const ap = activeProjectIdRef.current;
          if (sp && ap !== sp) {
            const bucket = backgroundStreamsRef.current[sp] ?? {
              messages: [],
              generationSteps: [],
              isLoading: true,
              files: storedFilesSnapshot,
            };
            bucket.generationSteps = normalized;
            backgroundStreamsRef.current[sp] = bucket;
            setAgentUiTick((t) => t + 1);
          }
        };

        for await (const chunk of stream) {
          fullResponse += chunk;
          routeStreamMessages(fullResponse);
          const plan = extractJsonPlanArray(fullResponse);
          if (plan && plan.length > 0) {
            const normalized = planUiPolicy(plan, message, 'normal', Object.keys(workspaceForPrompt).length);
            const sig = JSON.stringify(normalized);
            if (sig !== lastPlanSig) {
              lastPlanSig = sig;
              routeGenerationSteps(normalized);
            }
          }
        }

        const planSnap = extractJsonPlanArray(fullResponse);
        if (planSnap && planSnap.length > 0) {
          const normalized = planUiPolicy(planSnap, message, 'normal', Object.keys(workspaceForPrompt).length);
          const modelOrdinal = (proj.messages ?? []).filter((m) => m.role === 'model').length;
          setProjects((prev) =>
            prev.map((p) => {
              if (p.id !== projectId) return p;
              const plans = [...(p.planChecklistsByModel ?? [])];
              while (plans.length <= modelOrdinal) plans.push([]);
              plans[modelOrdinal] = normalized;
              return { ...p, planChecklistsByModel: plans, completedPlanSteps: normalized };
            }),
          );
        }

        const blocks = extractGeneratedCodeBlocks(fullResponse);
        const extractedFiles: Record<string, { code: string; language: string; icon: React.ElementType; color: string }> =
          {};
        for (const block of blocks) {
          const lang = block.lang || 'text';
          const specifiedName = block.filename;
          const code = decodeEscapedSourceCode(block.code);

          let baseName = specifiedName || '';
          let icon = FileCode;
          let color = 'text-gray-400';

          if (!baseName) {
            if (lang === 'html') {
              baseName = 'index.html';
              icon = HtmlIcon;
              color = '';
            } else if (lang === 'css') {
              baseName = 'styles.css';
              icon = CssIcon;
              color = '';
            } else if (lang === 'javascript' || lang === 'js') {
              baseName = 'script.js';
              icon = JsIcon;
              color = '';
            } else if (lang === 'typescript' || lang === 'ts') {
              baseName = 'script.ts';
              icon = TsIcon;
              color = '';
            } else if (lang === 'python' || lang === 'py') {
              baseName = 'script.py';
              icon = PythonIcon;
              color = '';
            } else if (lang === 'json') {
              baseName = 'data.json';
              icon = FileJson;
              color = 'text-green-400';
            } else {
              baseName = 'file.' + lang;
            }
          } else {
            if (baseName.endsWith('.html')) {
              icon = HtmlIcon;
              color = '';
            } else if (baseName.endsWith('.css')) {
              icon = CssIcon;
              color = '';
            } else if (baseName.endsWith('.js') || baseName.endsWith('.jsx')) {
              icon = JsIcon;
              color = '';
            } else if (baseName.endsWith('.ts') || baseName.endsWith('.tsx')) {
              icon = TsIcon;
              color = '';
            } else if (baseName.endsWith('.py')) {
              icon = PythonIcon;
              color = '';
            } else if (baseName.endsWith('.json')) {
              icon = FileJson;
              color = 'text-green-400';
            }
          }

          let fileName = baseName;
          let counter = 1;
          while (extractedFiles[fileName]) {
            const parts = baseName.split('.');
            const ext = parts.pop();
            fileName = parts.join('.') + counter + '.' + ext;
            counter++;
          }

          extractedFiles[fileName] = {
            code,
            language: lang,
            icon,
            color,
          };
        }

        if (Object.keys(extractedFiles).length > 0) {
          const sp = streamingPidRef.current;
          const ap = activeProjectIdRef.current;
          if (sp && ap !== sp) {
            const storedPatch: Record<string, StoredVibeFile> = {};
            for (const [k, v] of Object.entries(extractedFiles)) {
              storedPatch[k] = { code: v.code, language: v.language };
            }
            const bucketMsgs = backgroundStreamsRef.current[sp]?.messages;
            setProjects((prev) =>
              prev.map((p) =>
                p.id === sp
                  ? {
                      ...p,
                      files: { ...(p.files ?? {}), ...storedPatch },
                      messages: (bucketMsgs ?? p.messages).map((m) => ({ ...m })),
                      updatedAt: Date.now(),
                      agentMeta: {
                        status: 'completed',
                        progress: 100,
                        currentTask: 'Done',
                        lastUpdated: Date.now(),
                      },
                    }
                  : p,
              ),
            );
            delete backgroundStreamsRef.current[sp];
          }
        }

        mergeAgentMetaForProject(streamOwnerId, {
          status: 'completed',
          progress: 100,
          currentTask: 'Done',
        });
      } catch (error) {
        console.error('Background chat error:', error);
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            const msgs = [...(p.messages ?? [])];
            if (msgs.length > 0 && msgs[msgs.length - 1]?.role === 'model') {
              msgs[msgs.length - 1] = {
                role: 'model',
                content: 'Sorry, I encountered an error. Please try again.',
              };
            }
            return { ...p, messages: msgs };
          }),
        );
      } finally {
        setLoadingForProject(projectId, false);
        if (streamingPidRef.current === projectId) streamingPidRef.current = null;
        if (backgroundStreamsRef.current[projectId]) delete backgroundStreamsRef.current[projectId];
      }
    },
    [mergeAgentMetaForProject, setLoadingForProject],
  );

  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  const getDashboardPreviewSrcDoc = useCallback((projectId: string): string | null => {
    const p = projects.find((x) => x.id === projectId);
    if (!p?.files || Object.keys(p.files).length === 0) return null;
    const raw: Record<string, { code: string }> = {};
    for (const [k, v] of Object.entries(p.files)) {
      raw[k] = { code: (v as StoredVibeFile)?.code ?? '' };
    }
    return buildPreviewSrcDoc(raw);
  }, [projects]);

  const handleDashboardQuickMessage = useCallback(
    (projectId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (activeProjectIdRef.current === projectId) {
        void handleSendRef.current(trimmed);
        return;
      }
      void sendFollowUpToProjectInBackground(projectId, trimmed);
    },
    [sendFollowUpToProjectInBackground],
  );

  const runGithubDeployFromToolbar = useCallback(() => {
    const paths = Object.keys(files).sort();
    const list = paths
      .map((p) => `- ${p} (${utf8ByteLength(files[p]?.code ?? '')} bytes)`)
      .join('\n');
    const cm = deployCommitMessage.trim() || 'chore: update workspace from Vibe Coder';
    const cmJson = JSON.stringify(cm);
    setIsTerminalOpen(true);
    setIsGithubDeploying(true);
    window.setTimeout(() => {
      ideTerminalRef.current?.runVibeInstruction(
        `Deploy / push the current project to GitHub.

Vibe Coder workspace files (for context — the actual git repo may be this app folder or a parent directory):
${list || '(no files in workspace yet)'}

Run these steps in order. Print concise output after each command.
1) Show current directory: on Windows PowerShell use Get-Location; on cmd use cd; on bash use pwd.
2) git status
3) git diff --stat
4) gh auth status
   - If gh is not installed, tell the user to install GitHub CLI from https://cli.github.com/ and reopen the terminal.
   - If not logged in, run: gh auth login
     This starts a browser OAuth flow. Tell the user to complete it, then run Deploy again.
5) git add -A
6) git commit -m ${cmJson}
   If there is nothing to commit, explain that and skip the push.
7) git push -u origin HEAD
   If there is no remote, suggest creating one with: gh repo create --source=. --public --push
   or: git remote add origin <url> then git push -u origin main (use the correct branch name from git status).

Important: Files listed above live in the in-app workspace; ensure the shell cwd is the git repository that should receive the push.`,
      );
      window.setTimeout(() => setIsGithubDeploying(false), 90_000);
    }, 420);
  }, [files, deployCommitMessage]);

  const runSilentPreviewAutoFix = useCallback(
    async (rawErr: string, attempt: number) => {
      const fixPid = activeProjectIdRef.current;
      if (!rawErr.trim() || !fixPid || loadingByProjectRef.current[fixPid]) return;
      const adaptiveSteps = buildAdaptiveFixChecklist(rawErr, Object.keys(files).length);
      const fixPrompt = `Fix the live preview runtime error and update workspace files directly.

Error:
${rawErr}

Requirements:
- Keep behavior and design intent intact.
- Fix only what is required for runtime stability.
- Ensure React components render valid elements (not plain objects).
- Correct entry/mount/import issues that break preview.
- Output format must follow the Vibe Coder system rules exactly:
  1) First line: json:plan then a newline then a single JSON array
  2) After that, only fenced code blocks of the form \`\`\`lang:filename\`\`\`
- Return updated files only.`;

      // During repair, lock preview reloads until the fix checklist finishes.
      setChecklistReadyForPreview(false);

      setPreviewIssueUi({
        title: 'Preview runtime error detected',
        message: rawErr,
        active: true,
        attempt,
      });
      setLoadingForProject(fixPid, true);
      setPreviewFixStreaming(true);
      setPreviewFixSteps(adaptiveSteps);

      try {
        let fullResponse = '';
        const hiddenMessages = [...messagesRef.current, { role: 'user' as const, content: fixPrompt }];
        const stream = streamChat(
          hiddenMessages,
          fixPrompt,
          VIBE_CODER_SYSTEM_PROMPT + buildWorkspaceContextForPrompt(files),
          false,
          'high'
        );
        let lastPreviewFixPlanSig = '';

        for await (const chunk of stream) {
          fullResponse += chunk;

          const plan = extractJsonPlanArray(fullResponse);
          if (plan && plan.length > 0) {
            const normalized = planUiPolicy(plan, rawErr, 'fix', Object.keys(files).length);
            const sig = JSON.stringify(normalized);
            if (sig !== lastPreviewFixPlanSig) {
              lastPreviewFixPlanSig = sig;
              setPreviewFixSteps(normalized);
            }
          }
        }

        // Apply extracted fix only after the stream ends (prevents preview churn).
        const blocks = extractGeneratedCodeBlocks(fullResponse);
        const extractedFiles: Record<string, { code: string, language: string, icon: React.ElementType, color: string }> = {};
        for (const block of blocks) {
          const lang = block.lang || 'text';
          const specifiedName = block.filename;
          const code = decodeEscapedSourceCode(block.code);

          let baseName = specifiedName || '';
          let icon = FileCode;
          let color = 'text-gray-400';
          if (!baseName) {
            if (lang === 'html') { baseName = 'index.html'; icon = HtmlIcon; color = ''; }
            else if (lang === 'css') { baseName = 'styles.css'; icon = CssIcon; color = ''; }
            else if (lang === 'javascript' || lang === 'js') { baseName = 'script.js'; icon = JsIcon; color = ''; }
            else if (lang === 'typescript' || lang === 'ts') { baseName = 'script.ts'; icon = TsIcon; color = ''; }
            else if (lang === 'python' || lang === 'py') { baseName = 'script.py'; icon = PythonIcon; color = ''; }
            else if (lang === 'json') { baseName = 'data.json'; icon = FileJson; color = 'text-green-400'; }
            else { baseName = 'file.' + lang; }
          } else {
            if (baseName.endsWith('.html')) { icon = HtmlIcon; color = ''; }
            else if (baseName.endsWith('.css')) { icon = CssIcon; color = ''; }
            else if (baseName.endsWith('.js') || baseName.endsWith('.jsx')) { icon = JsIcon; color = ''; }
            else if (baseName.endsWith('.ts') || baseName.endsWith('.tsx')) { icon = TsIcon; color = ''; }
            else if (baseName.endsWith('.py')) { icon = PythonIcon; color = ''; }
            else if (baseName.endsWith('.json')) { icon = FileJson; color = 'text-green-400'; }
          }

          let fileName = baseName;
          let counter = 1;
          while (extractedFiles[fileName]) {
            const parts = baseName.split('.');
            const ext = parts.pop();
            fileName = parts.join('.') + counter + '.' + ext;
            counter++;
          }
          extractedFiles[fileName] = { code, language: lang, icon, color };
        }

        if (Object.keys(extractedFiles).length > 0) {
          setFiles((prev) => ({ ...prev, ...extractedFiles }));
          const autoSel = Object.keys(extractedFiles)[0];
          setSelectedFile((prev) => {
            const sel = prev || autoSel;
            if (sel) setOpenTabs((tabs) => tabs.includes(sel) ? tabs : [...tabs, sel]);
            return sel;
          });
        }
      } catch (error) {
        console.error('Silent preview auto-fix error:', error);
        setMessages((prev) => [...prev, { role: 'model', content: 'Automatic preview fix failed. Try once more.' }]);
      } finally {
        setLoadingForProject(fixPid, false);
        setPreviewFixStreaming(false);
        setPreviewIssueUi((prev) => (prev ? { ...prev, active: false } : prev));
      }
    },
    [files, setLoadingForProject],
  );
  useEffect(() => {
    runSilentPreviewAutoFixRef.current = runSilentPreviewAutoFix;
  }, [runSilentPreviewAutoFix]);

  const [agentStatus, setAgentStatus] = useState<'staging' | 'dispatching' | null>(null);

  useEffect(() => {
    if (!initialPrompt?.trim() || !autoSubmitOnMount) return;
    const p = initialPrompt.trim();
    // Show the full Projects page first.
    setAutoStartDraft({
      prompt: p,
      defaultTitle: deriveProjectTitle(p),
    });
    setShowProjectsMenu(true);
    setActiveProjectId(null);
    setFiles({});
    setSelectedFile('');
    setMessages([]);
    setGenerationSteps([]);
    setStepHistory([]);
    setPreviewFixSteps([]);
    setPreviewFixStreaming(false);
    setPreviewIssueUi(null);
    setIsLoading(false);
    setAgentStatus(null);
    setInput('');
  }, [initialPrompt, autoSubmitOnMount]);

  const folderSetForTree = useMemo(
    () => collectAllFolderPaths(Object.keys(files), emptyFolders),
    [files, emptyFolders]
  );

  const showLivePreviewBuilding =
    isLoading ||
    (generationSteps.length > 0 && !checklistReadyForPreview) ||
    previewIframeBusy;

  const livePreviewOverlayPhase: 'stream' | 'checklist' | 'compile' = isLoading
    ? 'stream'
    : generationSteps.length > 0 && !checklistReadyForPreview
      ? 'checklist'
      : 'compile';

  return (
    <div
      className="vibe-surface relative flex h-screen w-full bg-[var(--vibe-bg)] text-[var(--vibe-text)] font-sans overflow-hidden select-none"
      style={{ letterSpacing: '-0.01em' }}
    >
      <div className="vibe-cinematic-frame absolute inset-0 z-0 pointer-events-none rounded-none" aria-hidden />

      {projectsReady && showProjectsMenu && (
        <div className="absolute inset-0 z-[700] min-h-full overflow-auto bg-[var(--vibe-bg)]">
          <VibeProjectsDashboard
            projects={dashboardProjects}
            searchQuery={projectQuery}
            onSearchQueryChange={setProjectQuery}
            activeTab={dashboardTab}
            onActiveTabChange={setDashboardTab}
            onNewProject={beginProjectCreateName}
            onOpenProject={openProject}
            onCreateProjectFromPrompt={(prompt) => {
              // Ensure a true fresh workspace (no restored checklist/chat/files).
              setGenerationRestoredComplete(false);
              setChatPreStream(null);
              const cur = activeProjectIdRef.current;
              if (cur) stashOngoingStreamForProject(cur);
              flushCurrentProjectSnapshot();

              setFiles({});
              setSelectedFile('');
              setOpenTabs([]);
              setMessages([]);
              setGenerationSteps([]);
              setStepHistory([]);
              setPreviewFixSteps([]);
              setPreviewFixStreaming(false);
              setPreviewIssueUi(null);
              setIsLoading(false);
              setInput('');
              setWorkspaceView('preview');
              setPreviewFilesSnapshot({});
              setPreviewKey((k) => k + 1);

              // Force create-a-new-project path inside handleSend.
              setActiveProjectId(null);
              activeProjectIdRef.current = null;
              nextProjectTitleOverrideRef.current = deriveProjectTitle(prompt);
              setShowProjectsMenu(false);

              void handleSend(prompt);
            }}
            onRenameProject={(id, newName) => {
              const v = newName.trim();
              if (!v) return;
              setProjects((prev) =>
                prev.map((p) => (p.id === id ? { ...p, title: v, updatedAt: Date.now() } : p))
              );
            }}
            onDeleteProject={(id) => setProjectDeleteTargetId(id)}
            autoStartDraft={autoStartDraft}
            onAutoStartCreate={() => {
              if (!autoStartDraft) return;
              setAutoStartNameDialogDefault(autoStartDraft.defaultTitle);
              setAutoStartNameDialogOpen(true);
            }}
            getProjectPreviewSrcDoc={getDashboardPreviewSrcDoc}
            onQuickMessageToVibe={handleDashboardQuickMessage}
          />
        </div>
      )}

      <AnimatePresence>
        {agentStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-5 z-[600] -translate-x-1/2 rounded-full border border-sky-500/25 bg-[var(--vibe-bg-deep)]/92 px-4 py-1.5 text-[11px] font-medium tracking-[0.06em] text-sky-100/95 shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_28px_rgba(56,189,248,0.12)] backdrop-blur-md"
          >
            {agentStatus === 'staging'
              ? 'Lyra is composing your workspace prompt…'
              : 'Launching Vibe Coder…'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LEFT SIDEBAR (Chat History) --- */}
      <div className="relative z-[2] w-[380px] flex flex-col border-r border-[var(--vibe-border)] bg-[var(--vibe-bg)] shrink-0">
        <div
          ref={scrollRef}
          onScroll={onChatScroll}
          className="flex-1 overflow-y-auto custom-scrollbar relative"
        >
          <div ref={chatInnerRef} className="space-y-4 px-3 pb-5 pt-4">
            {/* Preview error UI is rendered under the checklist (below). */}
            {messages.length === 0 && !isLoading && generationSteps.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-lg border border-white/[0.06] bg-[var(--vibe-bg)] px-3 py-2.5"
              >
                <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--vibe-text-muted)]">
                  Suggestions
                </p>
                <p className="mt-0.5 text-[10px] text-[var(--vibe-text-muted)]">
                  Click to send
                </p>
                <div className="mt-2.5 flex flex-col gap-0.5">
                  {quickPromptsLoading ? (
                    <>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="rounded-md border border-transparent bg-[var(--vibe-bg-raised)] px-2.5 py-2"
                          aria-hidden
                        >
                          <div className="mb-1 h-1.5 w-[85%] animate-pulse rounded-sm bg-[var(--vibe-bg-elevated)]" />
                          <div className="h-1.5 w-[50%] animate-pulse rounded-sm bg-[var(--vibe-bg-raised)]" />
                        </div>
                      ))}
                    </>
                  ) : (
                    quickPrompts.map((p, i) => (
                      <button
                        key={`${i}-${p.slice(0, 24)}`}
                        type="button"
                        onClick={() => void handleSend(p)}
                        title={p}
                        className="group flex w-full items-start gap-2 rounded-md border border-transparent px-2.5 py-2 text-left transition-colors hover:border-white/[0.06] hover:bg-[var(--vibe-bg-raised)]"
                      >
                        <p className="min-w-0 flex-1 text-[11px] leading-snug text-[var(--vibe-text-secondary)] transition-colors group-hover:text-[var(--vibe-text)]">
                          {p}
                        </p>
                        <ChevronRight
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--vibe-text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
            {messages.map((msg, idx) => {
              const msgText = String(msg.content ?? '');
              return (
              <div key={idx} className={cn('flex flex-col space-y-1.5', msg.role === 'user' ? 'mb-4 items-end' : 'items-start')}>
                {msg.role === 'user' ? (
                  <>
                    <div className="flex max-w-[92%] items-center gap-1.5">
                      <div className="shrink-0 rounded-full bg-[#1e293b] p-1 text-[#60a5fa]">
                        <Globe size={13} />
                      </div>
                      <div className="break-words rounded-2xl rounded-tr-sm border border-[var(--vibe-border)] bg-[var(--vibe-bg-elevated)] px-3 py-2 text-[13px] leading-snug text-[var(--vibe-text)]">
                        {msgText}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full space-y-3">
                    {idx === messages.length - 1 &&
                      isLoading &&
                      !msgText.trim() &&
                      generationSteps.length === 0 &&
                      stepHistory.length === 0 &&
                      previewFixSteps.length === 0 && (
                        <div className="mb-1 flex flex-col gap-1.5" aria-live="polite">
                          {chatPreStream ? (
                            <>
                              <div className="flex items-center gap-2.5">
                                <ShimmerOrb speed="fast" />
                                <TextShimmer
                                  as="span"
                                  duration={2}
                                  className={cn(vibeThinkingShimmerClassName, 'text-[14px] text-[var(--vibe-text-secondary)]')}
                                >
                                  {`Reading ${chatPreStream.path}`}
                                </TextShimmer>
                              </div>
                              <p className="text-[10px] leading-snug text-[var(--vibe-text-muted)] max-w-[300px]">
                                Priming workspace files — then the model stream starts.
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <TextShimmer
                                  as="span"
                                  duration={VIBE_THINKING_SHIMMER_DURATION}
                                  className={cn(vibeThinkingShimmerClassName, 'text-[14px] text-[var(--vibe-text)]')}
                                >
                                  Thinking
                                </TextShimmer>
                              </div>
                              {streamStallHint && (
                                <p className="text-[11px] leading-snug text-[var(--vibe-text-muted)] max-w-[280px]">
                                  Still waiting on the model — large workspaces or theme research can add a few seconds.
                                  The build checklist appears as soon as the plan stream starts.
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    {idx === messages.length - 1 &&
                      !generationRestoredComplete &&
                      (generationSteps.length > 0 || stepHistory.length > 0 || previewFixSteps.length > 0) && (
                      <div className="py-2 space-y-4">
                        <AnimatePresence mode="sync">
                          {stepHistory.map((steps, i) => (
                            <motion.div
                              key={'history-' + i}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.18, ease: [0.25, 0.8, 0.25, 1] }}
                            >
                              <GenerationProgress isStreaming={false} steps={steps} files={files} onLayoutShift={scrollChatAfterChecklist} />
                            </motion.div>
                          ))}
                          {generationSteps.length > 0 && (
                            <motion.div
                              key="current-steps"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {(() => {
                                const mainPaused =
                                  Boolean(previewIssueUi?.active) ||
                                  previewFixSteps.length > 0 ||
                                  previewFixStreaming;
                                return (
                              <GenerationProgress
                                isStreaming={isLoading && previewFixSteps.length === 0 && !mainPaused}
                                paused={mainPaused}
                                steps={generationSteps}
                                files={files}
                                restoredComplete={generationRestoredComplete}
                                onLayoutShift={scrollChatAfterChecklist}
                                onChecklistComplete={handleChecklistComplete}
                                onActiveStepChange={(payload) =>
                                  handleMainChecklistProgress({
                                    label: payload.label,
                                    progress: payload.progress,
                                  })
                                }
                              />
                                );
                              })()}
                            </motion.div>
                          )}
                          {previewIssueUi && previewIssueUi.active && (
                            <motion.div
                              key="preview-issue-ui"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                              className="rounded-xl border border-white/10 bg-[var(--vibe-bg)] px-3.5 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
                              aria-live="polite"
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-1.5">
                                  <XCircle className="h-4 w-4 text-white/70" strokeWidth={2} aria-hidden />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <p className="text-[12px] font-medium text-white/85">
                                      Preview error
                                    </p>
                                    <span className="text-[11px] text-white/45">
                                      attempt {previewIssueUi.attempt}
                                    </span>
                                  </div>

                                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/55 max-h-[72px] overflow-hidden">
                                    {previewIssueUi.message}
                                  </p>

                                  <div className="mt-2.5 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewFilesSnapshot(() => {
                                          const out: Record<string, { code: string }> = {};
                                          for (const [k, v] of Object.entries(filesRef.current)) {
                                            out[k] = { code: v.code };
                                          }
                                          return out;
                                        });
                                        setPreviewKey((k) => k + 1);
                                      }}
                                      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white/85 hover:bg-white/10 transition-colors"
                                    >
                                      Reload preview
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewFixSteps([]);
                                        setPreviewFixStreaming(false);
                                        setPreviewIssueUi(null);
                                      }}
                                      className="rounded-md border border-white/10 bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-white/65 hover:bg-white/5 transition-colors"
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {previewFixSteps.length > 0 && (
                            <motion.div
                              key="preview-fix-steps"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            >
                              <GenerationProgress
                                isStreaming={previewFixStreaming}
                                steps={previewFixSteps}
                                files={files}
                                onLayoutShift={scrollChatAfterChecklist}
                                onActiveStepChange={(payload) =>
                                  handleFixChecklistProgress({
                                    label: payload.label,
                                    progress: payload.progress,
                                  })
                                }
                                onChecklistComplete={() => {
                                  // Fix checklist complete => now it is safe to reload the iframe.
                                  setChecklistReadyForPreview(true);
                                  setPreviewFilesSnapshot(() => {
                                    const out: Record<string, { code: string }> = {};
                                    for (const [k, v] of Object.entries(filesRef.current)) {
                                      out[k] = { code: v.code };
                                    }
                                    return out;
                                  });
                                  setPreviewKey((k) => k + 1);
                                  setPreviewFixSteps([]);
                                  setPreviewIssueUi(null);
                                  needsProjectSaveRef.current = true;
                                  setProjectSaveTick((t) => t + 1);
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {(() => {
                      const ord = modelOrdinalAtMessageIndex(messages, idx);
                      if (ord == null) return null;
                      const hist = planChecklistsByModel[ord];
                      if (!hist?.length) return null;
                      const isLast = idx === messages.length - 1;
                      const liveObscures =
                        isLast &&
                        !generationRestoredComplete &&
                        (isLoading ||
                          generationSteps.length > 0 ||
                          stepHistory.length > 0 ||
                          previewFixSteps.length > 0);
                      if (liveObscures) return null;
                      return (
                        <div className="w-full py-2">
                          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--vibe-text-muted)]">
                            Build checklist
                          </p>
                          <GenerationProgress
                            isStreaming={false}
                            paused={false}
                            steps={hist}
                            files={files}
                            restoredComplete
                            onLayoutShift={scrollChatAfterChecklist}
                          />
                        </div>
                      );
                    })()}

                    {(() => {
                      const ord = modelOrdinalAtMessageIndex(messages, idx);
                      const turnHadChecklist =
                        ord != null && Array.isArray(planChecklistsByModel[ord]) && planChecklistsByModel[ord].length > 0;
                      if (turnHadChecklist) return null;
                      const displayContent = modelMessageVisibleText(msgText);
                      if (!displayContent) return null;
                      return (
                        <div className="text-[14px] leading-[1.6] text-[var(--vibe-text)] prose dark:prose-invert max-w-none prose-pre:bg-[var(--vibe-bg-elevated)] prose-pre:border prose-pre:border-[var(--vibe-border)]">
                          <ChatMessage role="model" content={displayContent} />
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[var(--vibe-bg)] shrink-0">
          <PromptInputBox
            mode="coder"
            value={input}
            onChange={setInput}
            onSend={(msg, files) => void handleSend(msg, files)}
            isLoading={isLoading}
            placeholder="Describe the app or feature to generate in the workspace…"
          />
        </div>
      </div>

      {/* --- FILE EXPLORER: collapses to 0 width in Preview so the workspace toolbar (Preview/Code) stays visually fixed --- */}
      <div
        className={cn(
          'relative z-[2] flex shrink-0 flex-col overflow-hidden bg-[var(--vibe-bg)] transition-[width] duration-200 ease-out',
          workspaceView === 'code' ? 'border-r border-[var(--vibe-border)]' : 'pointer-events-none border-r border-transparent',
        )}
        style={{ width: workspaceView === 'code' ? fileTreeWidthPx : 0 }}
        aria-hidden={workspaceView !== 'code'}
      >
          <div className="p-[14px] flex items-center gap-[22px] text-[var(--vibe-text-dim)]">
            <CustomDoc />
            <Search size={17} className="hover:text-[var(--vibe-text)] cursor-pointer transition-colors" />
            <Layers size={17} className="hover:text-[var(--vibe-text)] cursor-pointer transition-colors" />
          </div>

          <div className="px-4 py-3.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--vibe-text-secondary)] tracking-[0.12em] uppercase">PROJECT</span>
            <div className="flex items-center gap-3 text-[var(--vibe-text-dim)]">
              <button onClick={() => { setIsCreatingFile(true); setTimeout(() => newFileInputRef.current?.focus(), 50); }} className="hover:text-[var(--vibe-text)] transition-colors">
                <Plus size={14} />
              </button>
              <button
                type="button"
                title="New folder"
                className="rounded p-0.5 text-[var(--vibe-text-dim)] transition-colors hover:bg-[var(--vibe-bg-elevated)] hover:text-[var(--vibe-text)]"
                onClick={() => setFolderDialogOpen(true)}
              >
                <FolderPlus size={14} strokeWidth={2} />
              </button>
              <RotateCcw size={14} className="hover:text-[var(--vibe-text)] cursor-pointer transition-colors" />
              <div className="w-[14px] h-[14px] border border-[#525252] rounded-[2px] flex items-center justify-center text-[7px] font-bold hover:border-white cursor-pointer transition-colors">
                □
              </div>
              <MoreHorizontal size={14} className="hover:text-[var(--vibe-text)] cursor-pointer transition-colors" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
            {isCreatingFile && (
              <div className="flex items-center gap-2.5 py-[7px] pl-2 pr-3 bg-[var(--vibe-border)]">
                {(() => {
                  let Icon = CustomDoc;
                  let color = 'text-gray-400';
                  if (newFileName.endsWith('.html')) { Icon = HtmlIcon; color = ''; }
                  else if (newFileName.endsWith('.css')) { Icon = CssIcon; color = ''; }
                  else if (newFileName.endsWith('.js') || newFileName.endsWith('.jsx')) { Icon = JsIcon; color = ''; }
                  else if (newFileName.endsWith('.ts') || newFileName.endsWith('.tsx')) { Icon = TsIcon; color = ''; }
                  else if (newFileName.endsWith('.py')) { Icon = PythonIcon; color = ''; }
                  else if (newFileName.endsWith('.json')) { Icon = FileJson; color = 'text-green-400'; }
                  return <Icon className={cn("w-4 h-4", color)} />;
                })()}
                <input
                  ref={newFileInputRef}
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFile();
                    if (e.key === 'Escape') { setIsCreatingFile(false); setNewFileName(''); }
                  }}
                  onBlur={() => {
                    if (newFileName.trim()) handleCreateFile();
                    else setIsCreatingFile(false);
                  }}
                  className="flex-1 bg-transparent border border-[#404040] outline-none text-white text-[13px] px-1 py-0.5 rounded-sm"
                  placeholder="filename.ext"
                />
              </div>
            )}

            <IdeFileTreeBranch
              parentPath=""
              depth={0}
              filePaths={Object.keys(files)}
              allFolders={folderSetForTree}
              files={files}
              selectedFile={selectedFile}
              expandedFolders={expandedFolders}
              onToggleFolder={(path) => {
                setExpandedFolders((prev) => {
                  const cur = prev[path] !== false;
                  return { ...prev, [path]: !cur };
                });
              }}
              onSelectFile={openFileInTab}
              onMovePath={(from, toFolder) => {
                const base = from.split('/').pop() ?? from;
                const target = toFolder ? `${toFolder}/${base}` : base;
                if (target === from) return;
                setFiles((prev) => {
                  if (!prev[from] || prev[target]) return prev;
                  const next = { ...prev };
                  next[target] = next[from];
                  delete next[from];
                  return next;
                });
                setSelectedFile((sf) => (sf === from ? target : sf));
              }}
              onRename={(path, e) => {
                e.stopPropagation();
                setRenameDialog({ path });
              }}
              onRemove={(path, e) => {
                e.stopPropagation();
                setDeleteTarget(path);
              }}
            />
          </div>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize file tree"
            className={cn(
              'group absolute right-0 top-0 bottom-0 z-10 w-1.5 cursor-ew-resize select-none touch-none border-r border-transparent hover:border-[var(--vibe-border)]',
              workspaceView !== 'code' && 'pointer-events-none opacity-0',
            )}
            onMouseDown={startFileTreeResize}
          >
            <div className="pointer-events-none absolute inset-y-0 right-0 mx-auto w-px bg-[var(--vibe-border)] opacity-60 group-hover:opacity-100" />
          </div>
        </div>

      {/* --- MAIN WORKSPACE --- */}
      <div className="relative z-[2] flex min-w-0 flex-1 flex-col bg-[var(--vibe-bg)]">
        {/* Toolbar: spacer mirrors file tree width so the overlay centers over (tree + editor), not the editor column alone */}
        <div className="relative flex h-[56px] shrink-0 items-stretch border-b border-[var(--vibe-border)]">
          <div
            className="shrink-0 border-r border-transparent"
            style={{ width: workspaceView === 'code' ? fileTreeWidthPx : 0 }}
            aria-hidden
          />
          <div className="relative z-10 flex min-w-0 flex-1 items-center justify-between px-3 sm:px-4">
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                onClick={() => {
                  const cur = activeProjectIdRef.current;
                  if (cur) stashOngoingStreamForProject(cur);
                  flushCurrentProjectSnapshot();
                  setShowProjectsMenu(true);
                }}
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="group relative flex items-center gap-2 overflow-hidden rounded-full border border-white/[0.14] bg-[var(--vibe-bg-deep)] px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-white/[0.32] hover:bg-[var(--vibe-bg)]"
              >
                <span
                  className="pointer-events-none absolute inset-[1px] rounded-full border border-white/[0.08] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <LayoutGrid
                  className="relative size-3.5 text-white/80 transition-transform duration-200 group-hover:-translate-y-[1px]"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="relative">Projects</span>
                <ChevronRight
                  className="relative size-3 text-white/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--vibe-text)]/70"
                  strokeWidth={2}
                  aria-hidden
                />
              </motion.button>
            </div>
            {activeProjectId && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[var(--vibe-bg-surface)] px-3 py-1.5 text-[11px] text-white/70 shadow-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                <span className="max-w-[200px] truncate font-medium">
                  {projects.find((p) => p.id === activeProjectId)?.title ?? 'Active workspace'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-[var(--vibe-text-secondary)] sm:gap-5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-md border border-white/12 bg-[var(--vibe-bg-deep)] px-2.5 py-1.5 text-[11px] font-medium text-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.65)] transition-colors hover:bg-[var(--vibe-bg)] hover:text-[var(--vibe-text)]"
                    aria-label="Deploy to GitHub"
                  >
                    <Rocket className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                    <span className="hidden sm:inline">Deploy</span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[min(100vw-1.5rem,26rem)] max-h-[min(70vh,30rem)] overflow-hidden border border-[var(--vibe-border)] bg-[var(--vibe-bg-deep)] p-0 text-[var(--vibe-text)] shadow-2xl rounded-2xl"
                >
                  <div className="border-b border-white/[0.06] px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vibe-text-secondary)]">Git snapshot</p>
                      <p className="text-[11px] text-white/80">Prepare a commit and push</p>
                    </div>
                    {isGithubDeploying && (
                      <div className="flex items-center gap-1.5 text-[10px] text-white/70">
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
                        <span>Deploying…</span>
                      </div>
                    )}
                  </div>
                  <div className="px-3.5 py-3 space-y-3 text-[11px]">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--vibe-text-secondary)]">
                        Workspace files
                      </p>
                      <div className="max-h-[120px] overflow-y-auto rounded-md border border-white/[0.06] bg-black/40 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-white/80 custom-scrollbar">
                        {Object.keys(files).length === 0 ? (
                          <span className="text-white/45">No files yet — generate in chat first.</span>
                        ) : (
                          Object.keys(files)
                            .sort()
                            .map((p) => (
                              <div key={p} className="flex items-center gap-1.5 truncate break-all">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" aria-hidden />
                                <span className="flex-1 truncate">{p}</span>
                                <span className="text-white/40">
                                  ({utf8ByteLength(files[p]?.code ?? '')} B)
                                </span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-[var(--vibe-text-secondary)]" htmlFor="vibe-deploy-commit">
                        Commit message
                      </label>
                      <textarea
                        id="vibe-deploy-commit"
                        value={deployCommitMessage}
                        onChange={(e) => setDeployCommitMessage(e.target.value)}
                        rows={3}
                        className="mt-1 w-full resize-none rounded-md border border-white/[0.08] bg-[var(--vibe-bg-elevated)] px-2.5 py-2 text-[12px] text-white/90 placeholder:text-white/35 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/25"
                        placeholder="chore: describe your changes"
                      />
                    </div>

                    <div className="rounded-md border border-white/[0.08] bg-black/40 px-2.5 py-2 text-[10px] text-white/55">
                      <p className="font-semibold uppercase tracking-[0.16em] text-white/60 mb-1">What happens</p>
                      <ol className="space-y-0.5 list-decimal list-inside">
                        <li>Show repo status and diff summary</li>
                        <li>Add all workspace changes</li>
                        <li>Commit with the message above</li>
                        <li>Push to the current GitHub remote</li>
                      </ol>
                    </div>

                    <button
                      type="button"
                      onClick={runGithubDeployFromToolbar}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-[12px] font-medium text-black transition-colors hover:bg-white/90"
                    >
                      {isGithubDeploying ? (
                        <>
                          <span className="relative inline-flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40 opacity-60" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-black" />
                          </span>
                          <span>Running deploy in terminal…</span>
                        </>
                      ) : (
                        <>
                          <Rocket className="size-3.5" aria-hidden />
                          <span>Run deploy in terminal</span>
                        </>
                      )}
                    </button>

                    <p className="text-[10px] leading-snug text-white/45">
                      Uses your local git + GitHub CLI in the integrated terminal. If{' '}
                      <code className="text-white/60">gh auth status</code> fails, run{' '}
                      <code className="text-white/60">gh auth login</code> in the terminal, complete the browser flow,
                      then run Deploy again.
                    </p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                type="button"
                onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                className="transition-colors hover:text-[var(--vibe-text)]"
                aria-label="Toggle terminal"
              >
                <TerminalIcon />
              </button>
              <MoreHorizontal size={18} className="cursor-pointer transition-colors hover:text-[var(--vibe-text)]" aria-hidden />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-full items-center justify-center">
            <div
              className="pointer-events-auto relative grid h-9 w-[min(100%,13.5rem)] max-w-[min(13.5rem,calc(100vw-2rem))] shrink-0 grid-cols-2 grid-rows-1 rounded-lg border border-[var(--vibe-border)] bg-[var(--vibe-bg-raised)] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              role="tablist"
              aria-label="Preview or code"
            >
              <motion.div
                className="pointer-events-none absolute top-0.5 bottom-0.5 z-0 rounded-[6px] bg-[var(--vibe-border)]"
                style={{ width: 'calc(50% - 2px)' }}
                initial={false}
                animate={{
                  left: workspaceView === 'preview' ? 2 : 'calc(50% + 0px)',
                }}
                transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.45 }}
              />
              <button
                type="button"
                role="tab"
                aria-selected={workspaceView === 'preview'}
                onClick={() => {
                  setWorkspaceView('preview');
                  setPreviewKey((k) => k + 1);
                }}
                className={cn(
                  'relative z-10 flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium leading-none transition-all duration-200',
                  workspaceView === 'preview' ? 'text-[#fafafa]' : 'text-[var(--vibe-text-secondary)] hover:text-[var(--vibe-text)]',
                )}
              >
                <Eye className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                <span className="whitespace-nowrap">Preview</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={workspaceView === 'code'}
                onClick={() => setWorkspaceView('code')}
                className={cn(
                  'relative z-10 flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium leading-none transition-all duration-200',
                  workspaceView === 'code' ? 'text-[#fafafa]' : 'text-[var(--vibe-text-secondary)] hover:text-[var(--vibe-text)]',
                )}
              >
                <Code2 className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                <span className="whitespace-nowrap">Code</span>
              </button>
            </div>
          </div>
        </div>

        {openTabs.length > 0 && (
            <div
              className={cn(
                'flex min-h-[36px] shrink-0 items-end bg-[var(--vibe-bg-raised)] px-0 transition-all duration-200 overflow-x-auto',
                workspaceView === 'code' ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 min-h-0',
              )}
              aria-hidden={workspaceView !== 'code'}
            >
              {openTabs.map((tabPath) => {
                const fileEntry = files[tabPath];
                if (!fileEntry) return null;
                const isActive = tabPath === selectedFile;
                const shortName = tabPath.includes('/') ? tabPath.split('/').pop() ?? tabPath : tabPath;
                const FIcon = fileEntry.icon;
                return (
                  <div
                    key={tabPath}
                    onClick={() => setSelectedFile(tabPath)}
                    className={cn(
                      'group flex max-w-[180px] min-w-0 cursor-pointer items-center gap-1.5 border-r border-[var(--vibe-border)] px-3 py-2 text-[12px] transition-colors',
                      isActive
                        ? 'bg-[var(--vibe-bg)] text-[var(--vibe-text-bright)] shadow-[inset_0_1px_0_#3b82f6]'
                        : 'bg-[var(--vibe-bg-elevated)] text-[var(--vibe-text-secondary)] hover:bg-[var(--vibe-bg-elevated)] hover:text-[var(--vibe-text)]',
                    )}
                  >
                    <FIcon className={cn('h-3.5 w-3.5 shrink-0', fileEntry.color)} />
                    <span className="truncate">{shortName}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); closeTab(tabPath); }}
                      className={cn(
                        'ml-auto shrink-0 rounded p-0.5 transition-colors',
                        isActive
                          ? 'text-[var(--vibe-text-secondary)] hover:bg-white/10 hover:text-[var(--vibe-text)]'
                          : 'text-transparent group-hover:text-[var(--vibe-text-muted)] hover:!bg-white/10 hover:!text-white',
                      )}
                      aria-label={`Close ${shortName}`}
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        {/* Workspace Content */}
        <div className="flex-1 flex flex-col relative min-h-0">
           {Object.keys(files).length === 0 ? (
             workspaceView === 'code' ? (
               <div className="flex flex-1 flex-col items-center justify-center px-12">
                 <div className="flex w-full max-w-[480px] flex-col items-center text-center">
                    <div className="mb-10 opacity-[0.05] grayscale">
                       <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 19h20L12 2zm0 3.8L18.4 17H5.6L12 5.8z" />
                       </svg>
                    </div>
                    <p className="mb-12 text-[14px] font-medium text-[var(--vibe-text-dim)]">Ask the agent to fix errors or add new features</p>
                    <div className="w-full space-y-[18px]">
                       <ShortcutRow label="Go to File" keys={['Ctrl', 'P']} />
                       <ShortcutRow label="Find in Files" keys={['Ctrl', 'Shift', 'F']} />
                       <ShortcutRow label="Command Palette" keys={['Ctrl', 'Shift', 'P']} />
                       <ShortcutRow label="Terminal" keys={['Ctrl', '\u0060']} />
                    </div>
                 </div>
               </div>
             ) : (
               <div className="relative flex min-h-0 flex-1 flex-col bg-[var(--vibe-bg)]">
                 {showLivePreviewBuilding && <LivePreviewBuildingOverlay phase={livePreviewOverlayPhase} />}
                 {!showLivePreviewBuilding && (
                   <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
                     <Eye className="mb-4 size-10 text-[var(--vibe-text-muted)]" strokeWidth={1.25} />
                     <p className="max-w-[360px] text-[13px] leading-relaxed text-[var(--vibe-text-dim)]">
                       Preview will appear here once the workspace has files. Use the chat to generate an app, or switch to Code.
                     </p>
                   </div>
                 )}
               </div>
             )
             ) : (
               <div className="relative flex min-h-0 flex-1 flex-col">
                 {workspaceView === 'code' ? (
                 <div className="min-h-0 flex-1">
                 <Editor
                    height="100%"
                    path={selectedFile || Object.keys(files)[0]}
                    language={getMonacoLanguageId(selectedFile || Object.keys(files)[0] || '')}
                    theme="vibe-dark"
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    beforeMount={(monaco) => {
                      // Add Python basic completions
                      monaco.languages.registerCompletionItemProvider('python', {
                        provideCompletionItems: (model, position) => {
                          const word = model.getWordUntilPosition(position);
                          const range = {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn: word.startColumn,
                            endColumn: word.endColumn,
                          };
                          const suggestions = [
                            {
                              label: 'print',
                              kind: monaco.languages.CompletionItemKind.Function,
                              insertText: "print(${1:value})",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Prints the values to a stream, or to sys.stdout by default.',
                              range: range
                            },
                            {
                              label: 'def',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: "def ${1:name}(${2:args}):\n\t${3:pass}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Define a function',
                              range: range
                            },
                            {
                              label: 'class',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: "class ${1:Name}:\n\tdef __init__(self):\n\t\t${2:pass}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Define a class',
                              range: range
                            },
                            {
                              label: 'import',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: "import ${1:module}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Import a module',
                              range: range
                            },
                            {
                              label: 'from',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: "from ${1:module} import ${2:name}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Import a specific name from a module',
                              range: range
                            },
                            {
                              label: 'if',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: "if ${1:condition}:\n\t${2:pass}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'If statement',
                              range: range
                            },
                            {
                              label: 'for',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: "for ${1:item} in ${2:iterable}:\n\t${3:pass}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'For loop',
                              range: range
                            },
                            {
                              label: 'while',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: "while ${1:condition}:\n\t${2:pass}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'While loop',
                              range: range
                            },
                            {
                              label: 'try',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: "try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Try-except block',
                              range: range
                            },
                            {
                              label: 'with',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: "with ${1:expression} as ${2:name}:\n\t${3:pass}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'With statement',
                              range: range
                            },
                            {
                              label: 'return',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: "return ${1:value}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Return statement',
                              range: range
                            },
                            {
                              label: '__init__',
                              kind: monaco.languages.CompletionItemKind.Method,
                              insertText: "def __init__(self${1:, args}):\n\t${2:pass}",
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Initialize a class instance',
                              range: range
                            },
                            {
                              label: 'self',
                              kind: monaco.languages.CompletionItemKind.Variable,
                              insertText: 'self',
                              documentation: 'Reference to the current instance of the class',
                              range: range
                            }
                          ];
                          return { suggestions: suggestions };
                        }
                      });

                      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                        target: monaco.languages.typescript.ScriptTarget.Latest,
                        allowNonTsExtensions: true,
                        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                        module: monaco.languages.typescript.ModuleKind.CommonJS,
                        noEmit: true,
                        esModuleInterop: true,
                        jsx: monaco.languages.typescript.JsxEmit.React,
                        reactNamespace: "React",
                        allowJs: true,
                        typeRoots: ["node_modules/@types"]
                      });
                      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                        target: monaco.languages.typescript.ScriptTarget.Latest,
                        allowNonTsExtensions: true,
                        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                        module: monaco.languages.typescript.ModuleKind.CommonJS,
                        noEmit: true,
                        esModuleInterop: true,
                        jsx: monaco.languages.typescript.JsxEmit.React,
                        reactNamespace: "React",
                        allowJs: true,
                        typeRoots: ["node_modules/@types"]
                      });
                      monaco.editor.defineTheme('vibe-dark', {
                        base: 'vs-dark',
                        inherit: true,
                        rules: [],
                        colors: {
                          'editor.background': '#0a0a0a',
                          'editor.lineHighlightBackground': '#141414',
                          'editorLineNumber.foreground': '#404040',
                          'editorIndentGuide.background': '#1f1f1f',
                          'editorIndentGuide.activeBackground': '#404040',
                          'editorSuggestWidget.background': '#1e1e1e',
                          'editorSuggestWidget.border': '#454545',
                          'editorSuggestWidget.foreground': '#d4d4d4',
                          'editorSuggestWidget.highlightForeground': '#18a3ff',
                          'editorSuggestWidget.selectedBackground': '#04395e',
                          'editorHoverWidget.background': '#1e1e1e',
                          'editorHoverWidget.border': '#454545',
                          'editorWidget.background': '#1e1e1e',
                          'editorWidget.border': '#454545',
                          'editorCursor.foreground': '#ffffff',
                        }
                      });
                    }}
                    value={(files[selectedFile] || Object.values(files)[0])?.code}
                    onChange={(value) => {
                      if (value !== undefined && selectedFile) {
                        setFiles(prev => {
                          const currentFile = prev[selectedFile];
                          return {
                            ...prev,
                            [selectedFile]: {
                              ...currentFile,
                              code: value
                            }
                          };
                        });
                      }
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                      wordWrap: 'off',
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: 'smooth',
                      cursorSmoothCaretAnimation: 'on',
                      formatOnPaste: true,
                      bracketPairColorization: { enabled: true },
                      guides: { bracketPairs: true, indentation: true },
                      renderLineHighlight: 'all',
                      renderWhitespace: 'selection',
                      quickSuggestions: { other: true, comments: true, strings: true },
                      quickSuggestionsDelay: 10,
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnEnter: "on",
                      tabCompletion: "on",
                      wordBasedSuggestions: "allDocuments",
                      suggestSelection: "first",
                      snippetSuggestions: "inline",
                      suggest: {
                        showIcons: true,
                        showStatusBar: true,
                        preview: true,
                        previewMode: 'subwordSmart',
                        filterGraceful: true,
                        snippetsPreventQuickSuggestions: false,
                        localityBonus: true,
                        shareSuggestSelections: true,
                        showInlineDetails: true,
                        showMethods: true,
                        showFunctions: true,
                        showConstructors: true,
                        showDeprecated: true,
                        showFields: true,
                        showVariables: true,
                        showClasses: true,
                        showStructs: true,
                        showInterfaces: true,
                        showModules: true,
                        showProperties: true,
                        showEvents: true,
                        showOperators: true,
                        showUnits: true,
                        showValues: true,
                        showConstants: true,
                        showEnums: true,
                        showEnumMembers: true,
                        showKeywords: true,
                        showWords: true,
                        showColors: true,
                        showFiles: true,
                        showReferences: true,
                        showFolders: true,
                        showTypeParameters: true,
                        showSnippets: true,
                      },
                      inlineSuggest: { enabled: true },
                      hover: { enabled: true, delay: 300 },
                      parameterHints: { enabled: true },
                      fixedOverflowWidgets: true,
                      padding: { top: 16 }
                    }}
                  />
                 </div>
                 ) : (
                   <div className="relative min-h-0 flex-1 bg-[var(--vibe-bg)]">
                     {showLivePreviewBuilding && <LivePreviewBuildingOverlay phase={livePreviewOverlayPhase} />}
                     {previewIssueUi?.active && !showLivePreviewBuilding && (
                       <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--vibe-bg)] px-8 text-center">
                         <XCircle className="mb-3 h-8 w-8 text-red-400/70" strokeWidth={1.5} />
                         <p className="mb-2 text-[13px] font-medium text-white/85">Preview failed to render</p>
                         <p className="mb-4 max-w-[420px] text-[11px] leading-relaxed text-white/50">{previewIssueUi.message}</p>
                         <button
                           type="button"
                           onClick={() => {
                             setPreviewFilesSnapshot(() => {
                               const out: Record<string, { code: string }> = {};
                               for (const [k, v] of Object.entries(filesRef.current)) {
                                 out[k] = { code: v.code };
                               }
                               return out;
                             });
                             setPreviewKey((k) => k + 1);
                             setPreviewIssueUi(null);
                           }}
                           className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/85 hover:bg-white/10 transition-colors"
                         >
                           Retry preview
                         </button>
                       </div>
                     )}
                     <iframe
                       ref={previewIframeRef}
                       key={previewKey}
                       title="Preview"
                      srcDoc={buildPreviewSrcDoc(previewFilesSnapshot)}
                       className={cn(
                         'h-full min-h-0 w-full flex-1 border-none bg-white',
                         (showLivePreviewBuilding || previewIssueUi?.active) && 'pointer-events-none opacity-0',
                       )}
                       sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                     />
                   </div>
                 )}
               </div>
             )}
           
           <IdeTerminalPanel
             ref={ideTerminalRef}
             isOpen={isTerminalOpen}
             onClose={() => setIsTerminalOpen(false)}
             workspaceFiles={workspaceFilesPayload}
           />
        </div>
      </div>

      <PromptDialog
        open={folderDialogOpen}
        title="New folder"
        description="Use a path like src/components (no leading slash)."
        defaultValue=""
        placeholder="src/components"
        confirmLabel="Create"
        onCancel={() => setFolderDialogOpen(false)}
        onConfirm={(name) => {
          setFolderDialogOpen(false);
          if (!name?.trim()) return;
          const normalized = name.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
          if (!normalized) return;
          setEmptyFolders((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
          setExpandedFolders((prev) => {
            const next = { ...prev };
            let acc = '';
            for (const p of normalized.split('/')) {
              acc = acc ? acc + '/' + p : p;
              next[acc] = true;
            }
            return next;
          });
        }}
      />
      <PromptDialog
        open={!!renameDialog}
        title="Rename file"
        description="Enter the new path relative to the project root."
        defaultValue={renameDialog?.path ?? ''}
        placeholder="src/App.tsx"
        confirmLabel="Rename"
        onCancel={() => setRenameDialog(null)}
        onConfirm={(newName) => {
          const path = renameDialog?.path;
          setRenameDialog(null);
          if (!path || !newName?.trim() || newName === path || files[newName]) return;
          setFiles((prev) => {
            const newFiles = { ...prev };
            newFiles[newName] = newFiles[path];
            delete newFiles[path];
            return newFiles;
          });
          if (selectedFile === path) setSelectedFile(newName);
        }}
      />
      <PromptDialog
        open={projectNameDialogOpen}
        title="Name your project"
        description="This name is used in the Projects menu."
        defaultValue={projectNameDialogDefault}
        placeholder="e.g. Landing page — Stripe style"
        confirmLabel="Create"
        onCancel={() => setProjectNameDialogOpen(false)}
        onConfirm={(value) => applyProjectNameDialogConfirm(value)}
      />
      <PromptDialog
        open={autoStartNameDialogOpen}
        title="Name this project"
        description="You can rename it later from the Projects page."
        defaultValue={autoStartNameDialogDefault}
        placeholder="e.g. Google — modern marketing site"
        confirmLabel="Create & Start"
        onCancel={() => setAutoStartNameDialogOpen(false)}
        onConfirm={(value) => {
          const name = String(value || '').trim();
          nextProjectTitleOverrideRef.current = name || null;
          setAutoStartNameDialogOpen(false);
          const p = autoStartDraft?.prompt;
          setAutoStartDraft(null);
          if (!p) return;
          void handleSendRef.current(p);
        }}
      />
      <ConfirmDialog
        open={!!projectDeleteTargetId}
        title="Delete project"
        message={
          projectDeleteTargetId
            ? `Delete "${projectDeleteLabel}"? This removes saved code + chat from local storage.`
            : ''
        }
        danger
        confirmLabel="Delete"
        onCancel={() => setProjectDeleteTargetId(null)}
        onConfirm={() => {
          if (!projectDeleteTargetId) return;
          deleteProjectNow(projectDeleteTargetId);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete file"
        message={deleteTarget ? `Remove "${deleteTarget}" from the project? This cannot be undone.` : ''}
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const path = deleteTarget;
          setDeleteTarget(null);
          if (!path) return;
          setFiles((prev) => {
            const newFiles = { ...prev };
            delete newFiles[path];
            const remaining = Object.keys(newFiles);
            if (selectedFile === path) {
              setSelectedFile(remaining[0] ?? '');
            }
            return newFiles;
          });
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: 
        '.custom-scrollbar::-webkit-scrollbar {\n' +
        '  width: 5px;\n' +
        '  height: 5px;\n' +
        '}\n' +
        '.custom-scrollbar::-webkit-scrollbar-track {\n' +
        '  background: transparent;\n' +
        '}\n' +
        '.custom-scrollbar::-webkit-scrollbar-thumb {\n' +
        '  background: #1f1f1f;\n' +
        '  border-radius: 10px;\n' +
        '}\n' +
        '.custom-scrollbar::-webkit-scrollbar-thumb:hover {\n' +
        '  background: #262626;\n' +
        '}\n'
      }} />
    </div>
  );
}

const CustomDoc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const TerminalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const FileRow = ({
  icon,
  label,
  inset = false,
  hasDot = false,
  treeIndentPx,
  onClick,
  active = false,
  onRename,
  onRemove,
}: {
  icon: React.ReactNode;
  label: string;
  inset?: boolean;
  hasDot?: boolean;
  /** Left padding for tree depth — applied on the same node as the row background so the highlight reaches the sidebar edge */
  treeIndentPx?: number;
  onClick?: () => void;
  active?: boolean;
  onRename?: (e: React.MouseEvent) => void;
  onRemove?: (e: React.MouseEvent) => void;
}) => (
  <div
    onClick={onClick}
    title={label}
    style={treeIndentPx != null ? { paddingLeft: treeIndentPx } : undefined}
    className={cn(
      'group relative flex cursor-pointer items-center gap-2.5 py-[7px] pr-3 transition-colors',
      treeIndentPx == null && !inset && 'pl-2',
      inset && 'pl-[38px]',
      active ? 'bg-[var(--vibe-border)] text-white' : 'text-[var(--vibe-text-secondary)] hover:bg-[var(--vibe-bg-elevated)]'
    )}
  >
    <span className={cn("flex-shrink-0 flex items-center justify-center w-3.5", active ? 'text-white' : 'text-[var(--vibe-text-dim)]')}>
      {icon}
    </span>
    <span className="flex-1 truncate text-[13px] font-medium group-hover:text-[#f5f5f5] tracking-tight">{label}</span>
    {hasDot && <div className="w-[3px] h-[3px] bg-red-500 rounded-full mr-1"></div>}
    <div className="hidden group-hover:flex items-center gap-1 absolute right-2 bg-[var(--vibe-bg-elevated)] pl-2">
      {onRename && (
        <button onClick={onRename} className="p-1 hover:bg-[var(--vibe-border)] rounded text-[var(--vibe-text-secondary)] hover:text-[var(--vibe-text)] transition-colors" title="Rename">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </button>
      )}
      {onRemove && (
        <button onClick={onRemove} className="p-1 hover:bg-[#e81123] rounded text-[var(--vibe-text-secondary)] hover:text-[var(--vibe-text)] transition-colors" title="Remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
      )}
    </div>
  </div>
);

const ShortcutRow = ({ label, keys }: { label: string, keys: string[] }) => (
  <div className="flex justify-between items-center text-[13px] text-[var(--vibe-text-dim)] group px-1">
    <span className="group-hover:text-[#9e9e9e] transition-colors">{label}</span>
    <div className="flex items-center gap-1.5">
      {keys.map((key: string, i: number) => (
        <React.Fragment key={key}>
          <span className="bg-[var(--vibe-bg-elevated)] border border-[var(--vibe-border)] px-[6px] py-[3px] rounded-[5px] text-[10.5px] font-mono min-w-[30px] text-center text-[var(--vibe-text-secondary)] shadow-sm">
            {key}
          </span>
          {i < keys.length - 1 && <span className="text-[var(--vibe-text-muted)] text-[9px]">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);
