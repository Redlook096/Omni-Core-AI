import { GoogleGenAI, Type, createPartFromBase64, createPartFromText } from "@google/genai";
import { DEFAULT_SYSTEM_INSTRUCTION } from "./constants";

export async function generateTitle(message: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a very short title (1 to 4 words maximum) summarizing this message: "${message}". Do not use quotes or punctuation. Just the words.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text?.trim() || "New Chat";
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Chat";
  }
}

export async function generateSuggestions(history: { id: string, title: string, messages: { role: string, content: string }[] }[]): Promise<{ iconName: string, text: string, subtext: string, prompt: string, autoSend: boolean }[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let context = "";
    if (history && history.length > 0) {
      // Get the most recent session's messages for deeper context
      const mostRecentSession = history[0];
      const recentMessages = mostRecentSession.messages?.slice(-4) || [];
      
      const recentSessions = history.slice(0, 3);
      context = "Recent chat topics:\n" + recentSessions.map(s => `- ${s.title}`).join("\n");
      
      if (recentMessages.length > 0) {
        context += "\n\nMost recent conversation context:\n";
        context += recentMessages.map((m: { role: string, content: string }) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 100)}...`).join("\n");
      }
    }

    const prompt = `
Generate 3 advanced, highly useful AI tools/functions based on the user's recent activity.
${context ? `Context:\n${context}\n\nCreate 3 advanced analytical or generative functions tailored to this context.` : 'Create 3 generally useful advanced functions (e.g., Code Refactoring Engine, Data Anomaly Detector, Semantic Translator).'}

IMPORTANT: These are NOT just conversation starters or simple prompt templates. They must represent powerful, advanced capabilities. The 'prompt' should be a highly structured system command that instructs the AI to adopt a specialized persona and perform a complex, multi-step task or deep analysis.

Each function should have:
- iconName: A valid Lucide React icon name (MUST be one of: 'Code', 'Zap', 'BarChart', 'FileText', 'Bug', 'Languages', 'Lightbulb', 'MessageSquare')
- text: A tool/function name (e.g., "Deep Code Analyzer", "Strategic Planner")
- subtext: A brief description of the function's capability (3-5 words)
- prompt: A highly detailed, structured prompt that acts as the "function body". It should instruct the AI to perform a complex task, use specific formatting, or apply advanced reasoning. It should feel like executing a program.
- autoSend: boolean (true if it's a zero-shot analysis, false if it requires the user to provide input data first)

Return ONLY a valid JSON object with a "suggestions" array containing 3 objects with these exact keys. No markdown formatting, no explanation.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  iconName: { type: Type.STRING },
                  text: { type: Type.STRING },
                  subtext: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  autoSend: { type: Type.BOOLEAN }
                },
                required: ["iconName", "text", "subtext", "prompt", "autoSend"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    });
    
    const text = response.text?.trim() || '{"suggestions": []}';
    const parsed = JSON.parse(text);
    if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length === 3) {
      return parsed.suggestions;
    }
  } catch (error) {
    console.error("Error generating suggestions:", error);
  }
  return [];
}

/** Three starter prompts for Vibe Coder empty state (AI-generated; fallback handled by caller). */
export async function generateVibeQuickPrompts(): Promise<string[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate exactly 3 starter prompts for a React + TypeScript + Tailwind app (framer-motion, lucide, recharts).

Rules:
- ONE short sentence each, max 120 characters (hard limit).
- Format: "<Product or screen>: feature, feature, feature." — concrete UI only, no fluff, no quotes.
- Vary themes (dashboard, landing, admin tool, onboarding, marketing).
- No words like "Build" or "Create" at the start; jump straight to the product.

Return ONLY valid JSON: {"prompts":["...","...","..."]}`,
      config: {
        temperature: 0.88,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['prompts'],
        },
      },
    });
    const text = response.text?.trim();
    if (!text) return [];
    const parsed = JSON.parse(text) as { prompts?: string[] };
    if (Array.isArray(parsed.prompts) && parsed.prompts.length >= 3) {
      return parsed.prompts
        .slice(0, 3)
        .map((p) => {
          const s = String(p).trim();
          if (!s) return '';
          return s.length > 125 ? `${s.slice(0, 122)}…` : s;
        })
        .filter(Boolean);
    }
  } catch (error) {
    console.error('Error generating Vibe quick prompts:', error);
  }
  return [];
}

export async function detectCodeIntent(message: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Does the following user message explicitly ask to generate, write, or create computer code, a script, a web component, or a software application? Answer ONLY "true" or "false".\n\nMessage: "${message}"`,
      config: {
        temperature: 0.1,
      }
    });
    const text = response.text?.trim().toLowerCase();
    return text === 'true';
  } catch (error) {
    console.error("Error detecting code intent:", error);
    return false;
  }
}

/** Inline images for the current user turn only (history stays text). */
export type StreamChatImageAttachment = { mimeType: string; dataBase64: string };

export async function* streamChat(
  history: { role: 'user' | 'model'; content: string }[],
  newMessage: string,
  customPersona?: string,
  isRegeneration: boolean = false,
  creativityLevel: 'low' | 'medium' | 'high' = 'medium',
  imageAttachments?: StreamChatImageAttachment[],
): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let finalSystemInstruction = customPersona 
    ? `${DEFAULT_SYSTEM_INSTRUCTION}\n\nCURRENT PERSONA/SYSTEM OVERRIDE: ${customPersona}`
    : DEFAULT_SYSTEM_INSTRUCTION;

  if (isRegeneration) {
    finalSystemInstruction += `\n\n[INSTRUCTION]: Regenerate this response. Change the structure or angle. If the previous answer was too long, make this one concise. If it was too short, expand.`;
  }

  finalSystemInstruction += `\n\n**CRITICAL — Canvas mode (\`[Canvas: ...\`):**
- Output **one** fenced code block first (then optional one-line summary). No filler before the fence.
- **Websites & apps** (HTML, CSS, JavaScript, TypeScript, JSX, TSX): use the matching fence language. The app shows a **live browser preview** for these.
- **Python** and other non-web languages: use a \`\`\`python\`\`\` fenced block (or the correct language tag). Execution runs in the **terminal** (remote runner), **not** in a browser preview.
- Make the snippet **complete and runnable**; fix imports and syntax so it executes without errors.
- IMPORTANT (game UI): Do **not** include a mission checklist / completed-task list UI (checkboxes with step text) and do **not** include an "Instruction:" footer block. Keep the canvas UI minimal (controls only).`;

  finalSystemInstruction += `\n\nCRITICAL DESIGN RULES TO AVOID AI TROPES:
1. Color palette: Pick 1 dominant color, 1 accent, 1 neutral. Use that combo everywhere. Avoid high-saturation pink + purple unless specifically requested. Use muted earth tones for cozy/vintage, black + electric cyan/magenta for cyber/tech.
2. Gradients & glow: Avoid smooth pink->purple gradients or radial glows unless dreamy/vaporwave is requested.
3. Typography: Pair a characterful heading font with a neutral readable body font. Use rounded/bubbly for cute, condensed/mono for futuristic, elegant serif for luxury.
4. Imagery & photo treatment: Use color tints, duotone, or heavy color overlays to make photos match the palette.
5. Shapes & geometry: Soft rounded corners/blobs for friendly, sharp edges/grids for technical, circular avatars/pill buttons for approachable.
6. Shadows, depth & glass: Soft colorful shadows + frosted glass for modern. Heavy flat shadows or none for minimalist/brutalist.
7. Microcopy & voice: Use consistent phrasing across buttons, errors, and tooltips. Avoid generic "Let's go!" unless casual/young.
8. UI components & affordances: Floating action buttons/big rounded CTAs for app-like. Tiny text links/thin borders for sophisticated/luxury.
9. Motion & interaction: Smooth hover glows, subtle parallax for polished. Fast snappy transitions for utilitarian.
10. Textures & filters: Grain/VHS scanlines for nostalgic/retro. Clean gradients for modern minimal.
11. Consistency & repetition: Reuse the same color tint, corner radius, and icon style. Consistency makes a vibe read as intentional.`;

  // Filter out the last message if it matches newMessage to avoid duplication in history
  const historyForModel = history.filter((msg, index) => {
    if (index === history.length - 1 && msg.role === 'user' && msg.content === newMessage) {
      return false;
    }
    return true;
  });

  const temperatureMap = {
    low: 0.2,
    medium: 0.7,
    high: 1.2
  };

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: finalSystemInstruction,
      temperature: temperatureMap[creativityLevel],
    },
    history: historyForModel.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
  });

  const message =
    imageAttachments && imageAttachments.length > 0
      ? [
          createPartFromText(newMessage),
          ...imageAttachments.map((img) => createPartFromBase64(img.dataBase64, img.mimeType)),
        ]
      : newMessage;

  const result = await chat.sendMessageStream({ message });

  for await (const chunk of result) {
    const t = chunk?.text;
    if (t != null && t !== '') {
      yield typeof t === 'string' ? t : String(t);
    }
  }
}

/** Natural-language → faux “execution trace” for the integrated terminal (Ctrl+K). */
function decodeTerminalOutputEscapes(text: string): string {
  let out = text;

  // If the model prints escape codes as literal strings (e.g. "\x1b[90m"), convert
  // them to real ANSI ESC sequences so xterm can render them.
  out = out.replace(/\\r\\n/g, '\r\n');
  out = out.replace(/\\r/g, '\r');
  out = out.replace(/\\n/g, '\n');

  out = out.replace(/\\x1b\[/gi, '\x1b[');
  out = out.replace(/\\u001b\[/gi, '\x1b[');
  out = out.replace(/\\e\[/gi, '\x1b[');

  // Normalize newlines to CRLF so line wrapping/alignment matches real shell output.
  out = out.replace(/\r?\n/g, '\r\n');

  return out;
}

/** One-line shell command for the active Vibe terminal (real PTY execution). */
export async function generateVibeShellCommand(
  instruction: string,
  shell: 'powershell' | 'cmd' | 'git-bash',
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const shellGuide =
    shell === 'powershell'
      ? 'Shell: Windows PowerShell. Working directory: C:\\Users\\Luke\\Downloads\\Lyra AI\\.vibe-sandbox. Prefer Get-ChildItem, Get-Content, etc.'
      : shell === 'cmd'
        ? 'Shell: cmd.exe. Working directory: C:\\Users\\Luke\\Downloads\\Lyra AI\\.vibe-sandbox. Prefer dir, type, cd.'
        : 'Shell: Git Bash (MINGW64). Working directory is the .vibe-sandbox under the Lyra AI project. Prefer ls, ls -la, pwd, find. IMPORTANT: The command MUST be a normal prompt command; do NOT invoke `bash`, do NOT use standalone `--` tokens, and do NOT start the command with `-` or `--`. Start with a command like `ls`, `find`, `cat`, or `pwd`.';

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `User intent (natural language):\n${instruction}\n\n${shellGuide}\n\nReply with EXACTLY ONE LINE: the shell command to run. No explanation, no markdown, no backticks, no comments.`,
    config: { temperature: 0.12 },
  });

  let text = response.text?.trim() ?? '';
  text = text.replace(/^[`'"]+|[`'"]+$/g, '');
  text = text.split(/\r?\n/)[0]?.trim() ?? '';
  // Strip any accidental prompt fragments the model might include.
  text = text.replace(/^(PS|C:\\\\).*?>\s*/i, '');
  text = text.replace(/^(>|\$)\s*/i, '');

  if (shell === 'powershell') {
    // Keep directory listings compact in the integrated terminal.
    if (/^Get-ChildItem\b/i.test(text) && !/\|/.test(text)) {
      text = `${text} | Select-Object Mode,LastWriteTime,Length,Name`;
    }
  }

  // Git Bash safety: avoid standalone `--` or leading dash-only tokens that cause bash parse errors.
  if (shell === 'git-bash') {
    text = text.replace(/\s+/g, ' ').trim();

    // If it starts with prompt fragments or dash-only junk, pick a safe fallback.
    if (text === '--' || text.startsWith('--') || text.startsWith('-')) {
      const tokens = text.split(' ').filter(Boolean);
      const firstGood = tokens.find((t) => t && !t.startsWith('-'));
      if (firstGood) {
        const idx = tokens.indexOf(firstGood);
        text = tokens.slice(idx).join(' ');
      } else {
        return 'ls -la';
      }
    }

    // If the final thing still begins with '-' after cleanup, fallback.
    if (text.startsWith('-')) return 'ls -la';

    // Ensure we don't return the literal '--' token or it-only strings.
    if (text === '--' || /^-+$/.test(text) || /^--$/.test(text)) return 'ls -la';
  }

  return text || (shell === 'powershell' ? 'Get-ChildItem -Force' : shell === 'cmd' ? 'dir /a' : 'ls -la');
}

export async function* streamTerminalAiCommand(
  instruction: string,
): AsyncGenerator<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are Vibe Terminal Core — an advanced orchestration layer whose output is rendered inside a real xterm.js terminal.

The user submits a natural-language INTENT (not a shell command). You must respond with ONLY raw terminal text — NO markdown, NO \`\`\` fences.

Style requirements:
- Use Windows-style line breaks: each line ends with \\r\\n (carriage return + newline).
- Use ANSI SGR color codes so the output looks premium: cyan \\x1b[96m for headers, green \\x1b[38;5;46m for success, yellow \\x1b[33m for highlights, dim \\x1b[90m for metadata, magenta \\x1b[35m for subsystem tags. Reset with \\x1b[0m often.
- Start with one or two banner lines using box drawing (─ ═ │ ┌ ┐) spelling something like VIBE CORE or VIBE-CORE.
- Show 3–6 lines of fictional but plausible “init” (policy gate, sandbox handle, entropy seed, vector map — short tokens).
- Then show staged execution: lines prefixed with something like [exec] or ▸ with invented concise commands; use \\x1b[32m$\\x1b[0m before fake command text on some lines.
- Feel fast, confident, and powerful. Occasional unicode (✓ ✦ ▸) is OK.
- End with a green check line and a one-line summary of what was “done” for the user’s intent.
- Maximum about 26 lines total.`,
      temperature: 0.82,
    },
    history: [],
  });
  const result = await chat.sendMessageStream({ message: instruction });
  for await (const chunk of result) {
    if (chunk.text) yield decodeTerminalOutputEscapes(chunk.text);
  }
}

/** Internal read pass when reopening a Vibe workspace — streams a short architecture summary; UI discards output. */
export async function* streamVibeWorkspaceAudit(workspaceFileSections: string): AsyncGenerator<string> {
  const persona = `You are an internal code-reading pass for Vibe Coder. Read every file section below carefully. Reply with 3–6 sentences of plain prose only: how the app is structured, entry + routing/pages, shared components or state, and anything risky to preserve. No markdown, no code fences, no bullet symbols.`;
  const userMsg = `Workspace:\n${workspaceFileSections}`;
  yield* streamChat([], userMsg, persona, false, 'low');
}