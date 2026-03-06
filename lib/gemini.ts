import { GoogleGenAI, Type } from "@google/genai";
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

export async function* streamChat(
  history: { role: 'user' | 'model'; content: string }[],
  newMessage: string,
  customPersona?: string,
  isRegeneration: boolean = false,
  creativityLevel: 'low' | 'medium' | 'high' = 'medium'
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let finalSystemInstruction = customPersona 
    ? `${DEFAULT_SYSTEM_INSTRUCTION}\n\nCURRENT PERSONA/SYSTEM OVERRIDE: ${customPersona}`
    : DEFAULT_SYSTEM_INSTRUCTION;

  if (isRegeneration) {
    finalSystemInstruction += `\n\n[INSTRUCTION]: Regenerate this response. Change the structure or angle. If the previous answer was too long, make this one concise. If it was too short, expand.`;
  }

  finalSystemInstruction += `\n\n**CRITICAL:** If the user's message starts with \`[Canvas: \`, you MUST ONLY output the code block. Do NOT output any conversational text, explanations, or markdown outside of the code block. Just the \`\`\`language ... \`\`\` block.`;

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

  const result = await chat.sendMessageStream({ message: newMessage });

  for await (const chunk of result) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}