import { GoogleGenAI } from "@google/genai";

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

export async function* streamChat(
  history: { role: 'user' | 'model'; content: string }[],
  newMessage: string,
  customPersona?: string,
  isRegeneration: boolean = false
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Adaptive System Instruction: Minimalist Conversation + Structured Research
  const baseInstruction = `
    You are an advanced AI with an adaptive response style.

    **CORE BEHAVIOR:**
    1. **For Casual/Short Inputs (e.g., "hi", "thanks", "cool"):**
       - Be extremely minimalist. 
       - Response example: "Hello. How can I assist?" or "You're welcome."
       - Do NOT offer long introductions or asking vague open-ended questions unless necessary.

    2. **For Questions/Research/Tasks:**
       - Immediately provide the answer. No filler like "Here is the information you requested."
       - **Structure is King:** Use ***Headers*** for sections. Use **Bold** for key concepts. Use • Bullet points for data.
       - **Tone:** Professional, objective, and dense with information.
    
    **FORMATTING RULES:**
    - Use ***Header Text*** (triple asterisks) for main sections.
    - Use **bold** for entities, dates, or key terms.
    - Use > Blockquotes for summaries or important takeaways.
    - Never apologize excessively.

    **GOAL:**
    Be the most efficient interface for information. Zero friction.
  `;

  let finalSystemInstruction = customPersona 
    ? `${baseInstruction}\n\nCURRENT PERSONA/SYSTEM OVERRIDE: ${customPersona}`
    : baseInstruction;

  if (isRegeneration) {
    finalSystemInstruction += `\n\n[INSTRUCTION]: Regenerate this response. Change the structure or angle. If the previous answer was too long, make this one concise. If it was too short, expand.`;
  }

  // Filter out the last message if it matches newMessage to avoid duplication in history
  const historyForModel = history.filter((msg, index) => {
    if (index === history.length - 1 && msg.role === 'user' && msg.content === newMessage) {
      return false;
    }
    return true;
  });

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: finalSystemInstruction,
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