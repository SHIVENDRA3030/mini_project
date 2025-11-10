import { GoogleGenAI, Chat as GenAiChat, GenerateContentResponse } from "@google/genai";
import { Message, User } from '../types';

// Lazily initialize the AI instance to avoid crashing the app on load if API_KEY is not set.
let ai: GoogleGenAI | null = null;

function getAi() {
  if (!ai) {
    // Safely access process.env to prevent ReferenceError in browser environments like Vercel.
    const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
    if (API_KEY) {
      ai = new GoogleGenAI({ apiKey: API_KEY });
    } else {
      console.error("API_KEY environment variable not set. AI features will be disabled.");
    }
  }
  return ai;
}


const model = 'gemini-2.5-flash';

export const getAiResponse = async (history: Message[], newMessage: string, currentUserId: string): Promise<string> => {
  const aiInstance = getAi();
  if (!aiInstance) {
    return "AI service is not available. Please configure the API key.";
  }

  try {
    const chat: GenAiChat = aiInstance.chats.create({
      model: model,
      history: history.map(msg => ({
        role: msg.senderId === currentUserId ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      config: {
        systemInstruction: 'You are a friendly and helpful messaging assistant. Keep your responses concise and conversational.',
      },
    });

    const response: GenerateContentResponse = await chat.sendMessage({ message: newMessage });
    return response.text;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "Sorry, I'm having trouble connecting right now. Please try again later.";
  }
};

export const summarizeChat = async (messages: Message[], participants: User[]): Promise<string> => {
  const aiInstance = getAi();
  if (!aiInstance) {
    return "AI service is not available. Please configure the API key.";
  }

  try {
    const userMap = new Map(participants.map(p => [p.id, p.name]));
    
    const formattedHistory = messages
      .map(msg => `${userMap.get(msg.senderId) || 'Unknown User'}: ${msg.text}`)
      .join('\n');

    const prompt = `Please provide a concise summary of the following chat conversation:\n\n---\n${formattedHistory}\n---`;

    const response = await aiInstance.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error summarizing chat:", error);
    return "Sorry, I was unable to summarize the chat. Please try again later.";
  }
};