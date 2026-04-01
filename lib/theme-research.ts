export type WebsiteThemeKey =
  | 'google'
  | 'microsoft'
  | 'apple'
  | 'stripe'
  | 'notion'
  | 'spotify';

type ThemePreset = {
  key: WebsiteThemeKey;
  label: string;
  fontStack: string;
  palette: Record<string, string>;
  uiRules: string[];
  /** Fixed Unsplash CDN URLs (known photo IDs — never random `source.unsplash.com`). */
  curatedImages: readonly string[];
};

const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'google',
    label: 'Google (Material-ish)',
    fontStack: 'Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
    palette: {
      bg: '#F8F9FA',
      surface: '#FFFFFF',
      text: '#202124',
      muted: '#5F6368',
      primary: '#1A73E8',
      primaryHover: '#1669c7',
      border: '#E0E0E0',
      accent1: '#34A853',
      accent2: '#FBBC05',
      accent3: '#EA4335',
    },
    uiRules: [
      'Use Material-like surfaces: white cards with subtle shadows and rounded corners (10–14px).',
      'Primary actions use the blue primary; hover slightly darkens.',
      'Keep typography clean and readable; strong hierarchy (H1 28–38px, body ~14–16px).',
      'Add micro-interactions: hover elevation, focus rings, and smooth staggered entrance (framer-motion).',
      'Prefer grids and spacious layouts; avoid heavy gradients unless the user requested them.',
    ],
    curatedImages: [
      'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1600&q=82',
    ],
  },
  {
    key: 'microsoft',
    label: 'Microsoft (Fluent-ish)',
    fontStack: 'Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif',
    palette: {
      bg: '#0B0F19',
      surface: '#121826',
      text: '#E6EDF6',
      muted: '#9AA6B2',
      primary: '#00A4EF',
      primaryHover: '#008CCB',
      border: '#223049',
      accent1: '#7C3AED',
      accent2: '#22C55E',
      accent3: '#F59E0B',
    },
    uiRules: [
      'Use fluent-like dark surfaces with crisp borders and subtle blur (very light).',
      'Primary accent uses the bright cyan; keep saturation controlled.',
      'Use friendly spacing and consistent radii (12–16px).',
      'Add motion: short scale/opacity transitions with springy easing.',
    ],
    curatedImages: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1517694712206-8dd04948f827?auto=format&fit=crop&w=1600&q=82',
    ],
  },
  {
    key: 'apple',
    label: 'Apple (Clean-ish)',
    fontStack: 'SF Pro Display, SF Pro Text, -apple-system, system-ui, Segoe UI, Roboto, Arial, sans-serif',
    palette: {
      bg: '#FFFFFF',
      surface: '#F5F5F7',
      text: '#0B0B0D',
      muted: '#6E6E73',
      primary: '#0071E3',
      primaryHover: '#0063C2',
      border: '#E5E5EA',
      accent1: '#FF3B30',
      accent2: '#34C759',
      accent3: '#0A84FF',
    },
    uiRules: [
      'Use minimal layout, lots of whitespace, and refined typography.',
      'Prefer subtle gradients or noise only if needed; avoid “AI” looking visual spam.',
      'Use clean pill buttons, soft shadows, and high-contrast text.',
      'Motion should feel premium: gentle fade/slide with short duration.',
    ],
    curatedImages: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1600&q=82',
    ],
  },
  {
    key: 'stripe',
    label: 'Stripe (Bold-ish)',
    fontStack: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    palette: {
      bg: '#070707',
      surface: '#0D0D0D',
      text: '#F2F2F2',
      muted: '#A3A3A3',
      primary: '#635BFF',
      primaryHover: '#564DFF',
      border: '#1F1F1F',
      accent1: '#22C55E',
      accent2: '#F59E0B',
      accent3: '#60A5FA',
    },
    uiRules: [
      'Use strong hierarchy and a confident dark theme with one dominant accent.',
      'Avoid multiple accent colors; keep to primary plus 1–2 small accents.',
      'Use crisp borders and minimal decorative elements.',
      'Motion: short, subtle underline/underline slide and hover transforms.',
    ],
    curatedImages: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=82',
    ],
  },
  {
    key: 'notion',
    label: 'Notion (Friendly cards)',
    fontStack: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    palette: {
      bg: '#0A0A0A',
      surface: '#121212',
      text: '#EAEAEA',
      muted: '#9A9A9A',
      primary: '#FFFFFF',
      primaryHover: '#EDEDED',
      border: '#242424',
      accent1: '#7CFF6B',
      accent2: '#60A5FA',
      accent3: '#F472B6',
    },
    uiRules: [
      'Use card-based layout with gentle radii (12–14px) and quiet borders.',
      'Avoid aggressive neon; keep it tasteful and editorial.',
      'Use clear typographic scale and consistent spacing.',
    ],
    curatedImages: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=82',
    ],
  },
  {
    key: 'spotify',
    label: 'Spotify (Vibrant but controlled)',
    fontStack: 'Circular, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    palette: {
      bg: '#0B0B0B',
      surface: '#121212',
      text: '#F6F6F6',
      muted: '#B3B3B3',
      primary: '#1DB954',
      primaryHover: '#16A345',
      border: '#262626',
      accent1: '#60A5FA',
      accent2: '#A78BFA',
      accent3: '#F59E0B',
    },
    uiRules: [
      'Use dark surfaces and a single green primary with occasional small accents.',
      'Use “player” style components: progress bars, controls, and clean spacing.',
      'Motion: lightweight parallax/hover and gentle fades.',
    ],
    curatedImages: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=82',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=82',
    ],
  },
];

/** Professional SaaS / product imagery (stable IDs). */
const COMPANY_IMAGE_POOL_SAAS: readonly string[] = [
  'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=82',
];

const COMPANY_IMAGE_POOL_GAMING: readonly string[] = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1511882153878-6e1c32dfb38f?auto=format&fit=crop&w=1600&q=82',
];

function hashString32(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickCuratedCompanyImages(company: string, gaming: boolean): string[] {
  const pool = gaming ? COMPANY_IMAGE_POOL_GAMING : COMPANY_IMAGE_POOL_SAAS;
  const h = hashString32(company.toLowerCase());
  const n = pool.length;
  const i0 = h % n;
  const i1 = (h + 1) % n;
  const i2 = (h + 2) % n;
  const i3 = (h + 3) % n;
  return [pool[i0]!, pool[i1]!, pool[i2]!, pool[i3]!];
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeCompanyName(input: string) {
  return String(input)
    .replace(/['"]/g, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const KNOWN_COMPANY_LABELS: Record<WebsiteThemeKey, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  apple: 'Apple',
  stripe: 'Stripe',
  notion: 'Notion',
  spotify: 'Spotify',
};

const KNOWN_COMPANY_DOMAINS: Partial<Record<WebsiteThemeKey, string>> = {
  google: 'google.com',
  microsoft: 'microsoft.com',
  apple: 'apple.com',
  stripe: 'stripe.com',
  notion: 'notion.so',
  spotify: 'spotify.com',
};

export type ResolvedCompanySite = {
  domain: string;
  officialUrl: string;
  name?: string;
  source: 'clearbit' | 'heuristic' | 'prompt-domain';
};

/**
 * Resolve a real company domain for research (Clearbit suggest in dev via Vite proxy; heuristic fallback).
 */
export async function resolveCompanySite(companyName: string): Promise<ResolvedCompanySite | null> {
  const cleaned = normalizeCompanyName(companyName);
  if (!cleaned) return null;

  if (/\.[a-z]{2,}$/i.test(cleaned)) {
    const d = cleaned.replace(/^https?:\/\//i, '').split('/')[0]?.toLowerCase() ?? '';
    if (d) {
      return {
        domain: d.replace(/^www\./, ''),
        officialUrl: `https://${d.replace(/^www\./, '')}`,
        source: 'prompt-domain',
      };
    }
  }

  const suggestUrl =
    typeof import.meta !== 'undefined' && import.meta.env?.DEV
      ? `/api/clearbit-suggest?query=${encodeURIComponent(cleaned)}`
      : `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(cleaned)}`;

  try {
    const ctrl = new AbortController();
    const to = window.setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(suggestUrl, { signal: ctrl.signal });
    window.clearTimeout(to);
    if (res.ok) {
      const data = (await res.json()) as Array<{ domain?: string; name?: string }>;
      const row = data?.[0];
      if (row?.domain) {
        const domain = String(row.domain).replace(/^www\./, '').toLowerCase();
        return {
          domain,
          name: row.name,
          officialUrl: `https://${domain}`,
          source: 'clearbit',
        };
      }
    }
  } catch {
    /* use heuristic */
  }

  const h = domainFromCompanyName(cleaned);
  const domain = h.replace(/^www\./, '').toLowerCase();
  return {
    domain,
    officialUrl: `https://${domain}`,
    source: 'heuristic',
  };
}

function domainFromCompanyName(company: string): string {
  const cleaned = normalizeCompanyName(company).toLowerCase();
  const knownKey = detectWebsiteThemeKey(cleaned);
  if (knownKey) return KNOWN_COMPANY_DOMAINS[knownKey] ?? `${knownKey}.com`;

  // If user included a domain already, keep it.
  if (/\.[a-z]{2,}$/i.test(cleaned)) return cleaned;

  // Best-effort for “clone Amazon” => “amazon.com”
  const slug = cleaned.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug ? `${slug}.com` : 'example.com';
}

export function buildCompanyLogoUrl(company: string): string | null {
  const domain = domainFromCompanyName(company);
  if (!domain) return null;
  // Clearbit logos (best-effort). UI can handle failures via onError.
  return `https://logo.clearbit.com/${encodeURIComponent(domain)}`;
}

export function extractCompanyNameFromPrompt(text: string): string | null {
  const t = String(text ?? '');

  const knownKey = detectWebsiteThemeKey(t);
  if (knownKey) return KNOWN_COMPANY_LABELS[knownKey];

  // Domain in the prompt: "clone example.com"
  const domainMatch = t.match(/\b([a-z0-9-]+)\.([a-z]{2,})\b/i);
  if (domainMatch) {
    const label = domainMatch[1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return normalizeCompanyName(label || domainMatch[0]);
  }

  // "clone X", "like X", "make a website for X", "theme of X"
  const patterns: RegExp[] = [
    /\b(?:clone|copy|recreate|like|make)\s+(?:the\s+)?(?:website\s+)?(?:of\s+)?([A-Za-z0-9&.\- ]{2,40})/i,
    /\btheme\s+of\s+([A-Za-z0-9&.\- ]{2,40})/i,
    /\bwebsite\s+(?:for|like)\s+([A-Za-z0-9&.\- ]{2,40})/i,
  ];

  for (const re of patterns) {
    const m = t.match(re);
    if (!m) continue;
    const candidate = normalizeCompanyName(m[1] ?? '');
    if (!candidate) continue;
    // Avoid capturing generic words.
    if (/\b(website|landing|app|ui|theme|design|product|company)\b/i.test(candidate)) continue;
    return candidate;
  }

  return null;
}

function extractCompanyCandidatesFromPrompt(inputText: string): string[] {
  const t = String(inputText ?? '');
  const out = new Set<string>();

  const first = extractCompanyNameFromPrompt(t);
  if (first) out.add(first);

  // Multi-extraction: capture several "for X" / "clone X" style mentions.
  const multiPatterns: RegExp[] = [
    /\b(?:clone|copy|recreate|like|make|build|design)\s+(?:the\s+)?(?:website\s+)?(?:for\s+)?([A-Za-z0-9&.\- ]{2,40})/gi,
    /\b(?:theme\s+of|website\s+for|landing\s+for|app\s+for)\s+([A-Za-z0-9&.\- ]{2,40})/gi,
  ];

  for (const re of multiPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      const candidate = normalizeCompanyName(m[1] ?? '');
      if (!candidate) continue;
      // Avoid capturing meta words.
      if (/\b(multiple|games?|companies?|company|website|landing|app|ui|theme|design|product|portfolio)\b/i.test(candidate)) {
        continue;
      }
      out.add(candidate);
    }
  }

  return Array.from(out).slice(0, 5);
}

export function detectWebsiteThemeKey(text: string): WebsiteThemeKey | null {
  const t = normalize(text);

  const checks: Array<[WebsiteThemeKey, RegExp]> = [
    ['google', /\bgoogle\b/],
    ['microsoft', /\b(microsoft|fluent|windows)\b/],
    ['apple', /\bapple\b/],
    ['stripe', /\bstripe\b/],
    ['notion', /\bnotion\b/],
    ['spotify', /\bspotify\b/],
  ];

  for (const [key, re] of checks) {
    if (re.test(t)) return key;
  }
  return null;
}

function presetForKey(key: WebsiteThemeKey): ThemePreset {
  return THEME_PRESETS.find((p) => p.key === key) ?? THEME_PRESETS[0];
}

const IMAGE_POLICY_LINES = [
  'IMAGE POLICY (CRITICAL):',
  '- Use ONLY the `images.unsplash.com` URLs listed in this addendum for <img src>. Do **not** use source.unsplash.com, random Unsplash search URLs, picsum, or placeholder kittens.',
  '- Pick 2–3 images that **match the section purpose** (hero / team / product / analytics) and write accurate `alt` text describing what is shown — not the company name as a vague keyword.',
  '- If no listed image fits a section, use a **CSS-only** hero (gradient mesh, noise, geometric SVG) instead of inventing new stock URLs.',
  '- Every <img> must include `loading="lazy"`, `decoding="async"`, meaningful `alt`, and `onError` that swaps to a neutral gradient or hides the frame.',
] as const;

/** Extract http(s) URLs from user text (for reference-page analysis). */
export function extractHttpUrlsFromPrompt(text: string): string[] {
  const t = String(text ?? '');
  const re = /https?:\/\/[^\s<>"')\]]+/gi;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of t.matchAll(re)) {
    const u = m[0].replace(/[.,;:!?)]+$/g, '');
    try {
      const url = new URL(u);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
      const key = `${url.origin}${url.pathname}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(url.toString());
    } catch {
      /* ignore */
    }
  }
  return out.slice(0, 3);
}

export type PageThemeSignals = {
  url: string;
  title?: string;
  description?: string;
  themeColor?: string;
  ogImage?: string;
  headingHints: string[];
  sampleText: string;
};

function formatPageSignalsForPrompt(sig: PageThemeSignals): string {
  return [
    'REFERENCE URL (user-provided) — replicate layout, hierarchy, spacing rhythm, nav/footer patterns, and UI “feel”, not only colors:',
    `URL: ${sig.url}`,
    sig.title ? `Page title: ${sig.title}` : '',
    sig.description ? `Meta description: ${sig.description}` : '',
    sig.themeColor ? `theme-color / brand hint: ${sig.themeColor}` : '',
    sig.ogImage ? `og:image present: yes` : '',
    sig.headingHints?.length ? `Heading structure (order matters): ${sig.headingHints.join(' → ')}` : '',
    `Visible text sample (structure / density): ${sig.sampleText.slice(0, 2800)}`,
    'CRITICAL LAYOUT CLONE:',
    '- Match section order, column widths, card density, hero proportions, and CTA placement implied above.',
    '- Mirror typography scale (display vs body), border radii, shadow depth, and button/input shapes.',
    '- Do not invent a different information architecture; align with the reference hierarchy.',
    '- Infer palette from the reference + theme-color; keep tokens consistent across all components.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Dev server only: fetches analyzed HTML via `/api/page-theme`. Production build: returns null (no server). */
export async function fetchPageThemeSignals(url: string): Promise<PageThemeSignals | null> {
  if (typeof window === 'undefined') return null;
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
  if (!isDev) return null;
  try {
    const api = `/api/page-theme?url=${encodeURIComponent(url)}`;
    const ctrl = new AbortController();
    const to = window.setTimeout(() => ctrl.abort(), 9500);
    const res = await fetch(api, { signal: ctrl.signal });
    window.clearTimeout(to);
    if (!res.ok) return null;
    return (await res.json()) as PageThemeSignals;
  } catch {
    return null;
  }
}

/**
 * Async theme addendum: sync research + optional **live URL fetch** (dev) for layout signals.
 */
export async function buildWebsiteThemeResearchAddendumAsync(
  inputText: string,
  resolvedSite?: ResolvedCompanySite | null,
): Promise<string | null> {
  const base = buildWebsiteThemeResearchAddendum(inputText, resolvedSite);
  const urls = extractHttpUrlsFromPrompt(inputText);
  let extra = '';
  for (const u of urls.slice(0, 1)) {
    const sig = await fetchPageThemeSignals(u);
    if (!sig) continue;
    extra = formatPageSignalsForPrompt(sig);
    break;
  }
  if (!base && !extra) return null;
  if (base && extra) return `${base}\n\n${extra}`;
  return base || extra;
}

export function buildWebsiteThemeResearchAddendum(
  inputText: string,
  resolvedSite?: ResolvedCompanySite | null,
): string | null {
  const key = detectWebsiteThemeKey(inputText);
  if (key) {
    const preset = presetForKey(key);
    const imgs = preset.curatedImages;

    return [
      `THEME RESEARCH (apply this exactly): ${preset.label}`,
      `Clone the **layout language** of this brand family: navigation pattern, hero composition, section rhythm, card style — not only the palette.`,
      `Font stack: ${preset.fontStack}`,
      `Palette (use these tokens): bg=${preset.palette.bg}, surface=${preset.palette.surface}, text=${preset.palette.text}, muted=${preset.palette.muted}, primary=${preset.palette.primary}, border=${preset.palette.border}`,
      `Token usage (CRITICAL): define CSS variables and use them consistently.`,
      `- In :root (or a global wrapper), set: --bg, --surface, --text, --muted, --primary, --border using the token values above.`,
      `- Use --bg for page background, --surface for cards/panels, --text for primary text, --muted for secondary text, --border for outlines/dividers, --primary for main CTA buttons/links.`,
      `- Do NOT hardcode random colors for those UI surfaces; reuse the tokens.`,
      `- Set the font stack by applying: font-family: ${preset.fontStack} to body (or your root container).`,
      `UI rules:`,
      ...preset.uiRules.map((r) => `- ${r}`),
      ...IMAGE_POLICY_LINES,
      `Curated image URLs (choose by section fit; use at least 2 as real <img src="...">):`,
      ...imgs.map((u) => `- ${u}`),
      `Theme-specific relevance: match imagery to the brand mood above (e.g. Apple → clean hardware/product shots from the list; Stripe → dark UI / analytics feel).`,
      `Animation/positioning:`,
      `- Use framer-motion for subtle entrance (opacity/translate) and hover transforms (small scale/elevation).`,
      `- Position imagery as a hero/side panel with clear z-index layering; keep it minimal and intentional.`,
    ].join('\n');
  }

  const candidates = extractCompanyCandidatesFromPrompt(inputText);
  const company = candidates[0];
  if (!company) return null;

  const official =
    resolvedSite?.officialUrl ??
    `https://${domainFromCompanyName(company).replace(/^www\./, '')}`;
  const logoDomain = resolvedSite?.domain ?? domainFromCompanyName(company).replace(/^www\./, '');
  const logoUrl = `https://logo.clearbit.com/${encodeURIComponent(logoDomain)}`;

  const gameSignals = /\b(game|games|gaming|studio|publisher|esports)\b/i.test(inputText);
  const [img1, img2, img3, img4] = pickCuratedCompanyImages(company, gameSignals);

  const sourceLine = resolvedSite
    ? `Domain resolution: ${resolvedSite.source === 'clearbit' ? 'Clearbit company suggest API' : resolvedSite.source === 'heuristic' ? 'heuristic domain from company name' : 'domain from user prompt'}.`
    : 'Domain resolution: heuristic fallback.';

  return [
    `THEME RESEARCH (apply this exactly for company cloning): ${company}`,
    `Official website (verify layout, typography, and brand cues — do not invent a different company): ${official}`,
    sourceLine,
    `Company logo (use onError fallback): <img src="${logoUrl}" alt="${company} logo" />`,
    `Font stack: Infer from the reference: sans vs serif, geometric vs humanist — apply a close match via CSS (see Token usage).`,
    `Palette: Sample hero, nav, buttons, and backgrounds from the reference; choose cohesive HEX for --bg, --surface, --text, --muted, --primary, --border.`,
    `Token usage (CRITICAL): define CSS variables and use them consistently (same token names as presets).`,
    `- Pick HEX values for: --bg, --surface, --text, --muted, --primary, --border (from your inferred palette).`,
    `- Use the tokens everywhere for backgrounds/cards/text/borders/primary CTA styles; do not hardcode unrelated colors.`,
    `- Apply the chosen font stack by setting font-family on body/root.`,
    `LAYOUT & UI CLONE (as important as color):`,
    `- Mirror the reference **information hierarchy**: nav placement, hero structure, section order, grid vs single-column, card density.`,
    `- Match **spacing rhythm** (padding scale, section gaps, max-width containers) and **corner radii** on cards/buttons.`,
    `- Match **UI chrome**: header height behavior, sticky nav if present, footer columns, CTA placement (hero vs sticky bar).`,
    `- Match **component shapes**: pill vs square buttons, input underline vs bordered, image aspect ratios in grids.`,
    `- Use framer-motion in a way that fits the brand (subtle vs playful), not generic bouncy AI motion.`,
    `UI rules:`,
    `- Professional hero + feature grids + social proof + final CTA — section order should feel like the reference category (SaaS, retail, etc.).`,
    `- Card radii and shadows consistent with the reference; avoid unrelated “template” layouts.`,
    `- Micro-interactions: hover elevation, focus rings, and short framer-motion entrance/hover transforms.`,
    `- Keep it minimal and “product-grade” (avoid “AI-generated” visual noise).`,
    `- Use input/button/checkbox styles that all reference the same tokens above.`,
    `- If the prompt mentions multiple games/companies, reuse the SAME palette + font tokens across all sections; vary only imagery, labels, and content.`,
    ...IMAGE_POLICY_LINES,
    `Curated image URLs for this project (stable, non-random — assign by **section fit**, not by repeating the company name in alt text):`,
    `- ${img1}`,
    `- ${img2}`,
    `- ${img3}`,
    `- ${img4}`,
    `Relevance: ${gameSignals ? 'Prefer gaming/esports energy from the pool for hero and feature rows.' : 'Prefer collaboration / product / analytics shots from the pool for a B2B or consumer site.'}`,
    `- Do not pass company name into Unsplash search URLs; only use the four URLs above or CSS/SVG backgrounds.`,
    `Animation/positioning:`,
    `- Keep imagery as a hero/side visual with consistent z-index layering and spacing.`,
  ].join('\n');
}

export function buildWebsiteIntentAddendum(inputText: string): string | null {
  const t = normalize(inputText);
  const looksLikeWebsite = /\b(website|landing page|landing|marketing page|portfolio|product page|saas|dashboard|homepage|web page|site)\b/.test(t);
  const looksLikeBrandOrGameRequest = /\b(clone|like|for|company|brand|studio|publisher|game|games|gaming|esports)\b/.test(t);
  const looksLikeDesignIntent = /\b(app|ui|theme|design|style|look|aesthetic)\b/.test(t);

  if (!(looksLikeWebsite || (looksLikeBrandOrGameRequest && looksLikeDesignIntent))) return null;
  return [
    'WEBSITE GENERATION DEFAULTS:',
    '- Include at least 2 images when THEME RESEARCH provides curated URLs; otherwise use CSS gradients/SVG — do not invent random stock URLs.',
    '- Every image must include loading strategy and fallback: use alt + loading + decoding + onError handling.',
    '- Use a cohesive layout: hero header, 1–2 feature grids, and a final CTA.',
    '- Add subtle motion (framer-motion) and clear focus rings on all interactive controls.',
    '- Keep typography professional: consistent type scale, readable line-height, and strong text contrast.',
  ].join('\n');
}

