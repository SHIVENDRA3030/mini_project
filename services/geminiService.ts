import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message, User } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

export const getAiResponse = async (history: Message[], newMessage: string, currentUserId: string): Promise<string> => {
  try {
    const chat: Chat = ai.chats.create({
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
  try {
    const userMap = new Map(participants.map(p => [p.id, p.name]));
    
    const formattedHistory = messages
      .map(msg => `${userMap.get(msg.senderId) || 'Unknown User'}: ${msg.text}`)
      .join('\n');

    const prompt = `Please provide a concise summary of the following chat conversation:\n\n---\n${formattedHistory}\n---`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error summarizing chat:", error);
    return "Sorry, I was unable to summarize the chat. Please try again later.";
  }
};