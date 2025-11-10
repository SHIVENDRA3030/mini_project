import { users as mockUsers, chats as mockChats } from '../data/mockData';
import { User, Chat, Message } from '../types';

// In-memory database
let users: User[] = [];
let chats: Chat[] = [];

// Callbacks for real-time updates simulation
let chatUpdateCallbacks: { [userId: string]: (chats: Chat[]) => void } = {};

const notifySubscribers = (userId: string) => {
  if (chatUpdateCallbacks[userId]) {
    const userChats = chats.filter(chat => chat.participants.some(p => p.id === userId));
    // Deep copy to prevent mutation issues in components
    const chatsCopy = JSON.parse(JSON.stringify(userChats));
    chatUpdateCallbacks[userId](chatsCopy);
  }
};

const notifyAllParticipants = (chatId: string) => {
  const chat = chats.find(c => c.id === chatId);
  if (chat) {
    chat.participants.forEach(p => notifySubscribers(p.id));
  }
};

export const seedDatabase = async () => {
  // Kept async to match original signature and avoid changes in App.tsx
  if (users.length === 0) {
    console.log('Seeding in-memory database with initial data...');
    // Deep copy mock data to our in-memory store
    users = JSON.parse(JSON.stringify(mockUsers));
    chats = JSON.parse(JSON.stringify(mockChats));
    // Ensure chats have a typing array
    chats.forEach(chat => {
        if (!chat.typing) {
            chat.typing = [];
        }
    });
    console.log('In-memory database seeded successfully.');
  } else {
    console.log('In-memory database already contains data, skipping seed.');
  }
};

export const getUsers = async (): Promise<User[]> => {
  // Deep copy to prevent mutation
  return JSON.parse(JSON.stringify(users));
};

export const subscribeToUserChats = (
  userId: string, 
  callback: (chats: Chat[]) => void
): (() => void) => {
  chatUpdateCallbacks[userId] = callback;
  // Immediately send the current chats to the new subscriber
  notifySubscribers(userId);

  // Return an "unsubscribe" function
  return () => {
    delete chatUpdateCallbacks[userId];
  };
};

export const sendMessage = async (chatId: string, message: Omit<Message, 'id'>) => {
  const chat = chats.find(c => c.id === chatId);
  if (chat) {
    const newMessage: Message = {
      ...message,
      id: `msg-${chatId}-${Date.now()}` // Generate a unique-ish ID
    };
    chat.messages.push(newMessage);
    notifyAllParticipants(chatId);
  } else {
    console.error(`Error sending message: Chat with id ${chatId} not found.`);
  }
};

export const markMessagesAsRead = async (chatId: string, currentUserId: string) => {
  const chat = chats.find(c => c.id === chatId);
  if (chat) {
    let wasChanged = false;
    chat.messages.forEach(message => {
      if (!message.isRead && message.senderId !== currentUserId) {
        message.isRead = true;
        wasChanged = true;
      }
    });
    
    if (wasChanged) {
      notifyAllParticipants(chatId);
    }
  }
};

export const updateTypingStatus = async (chatId: string, userId: string, isTyping: boolean) => {
  const chat = chats.find(c => c.id === chatId);
  if (chat) {
    if (!chat.typing) {
        chat.typing = [];
    }
    const isCurrentlyTyping = chat.typing.includes(userId);
    let changed = false;

    if (isTyping && !isCurrentlyTyping) {
      chat.typing.push(userId);
      changed = true;
    } else if (!isTyping && isCurrentlyTyping) {
      chat.typing = chat.typing.filter(id => id !== userId);
      changed = true;
    }

    if (changed) {
      notifyAllParticipants(chatId);
    }
  }
};

export const findOrCreateChat = async (currentUserId: string, otherUserId: string): Promise<string> => {
  const currentUser = users.find(u => u.id === currentUserId);
  const otherUser = users.find(u => u.id === otherUserId);

  if (!currentUser || !otherUser) {
    throw new Error('Could not find one or both users.');
  }

  // Look for an existing chat between the two users
  const existingChat = chats.find(chat => {
    const participantIds = chat.participants.map(p => p.id).sort();
    const userIdsToFind = [currentUserId, otherUserId].sort();
    return participantIds.length === 2 && participantIds[0] === userIdsToFind[0] && participantIds[1] === userIdsToFind[1];
  });

  if (existingChat) {
    return existingChat.id;
  }

  // If no chat exists, create a new one
  const newChat: Chat = {
    id: `chat-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    participants: [currentUser, otherUser],
    messages: [],
    typing: [],
  };
  
  chats.push(newChat);
  
  // Notify both participants that a new chat is available
  notifySubscribers(currentUserId);
  notifySubscribers(otherUserId);

  return newChat.id;
};
