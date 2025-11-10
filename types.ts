
export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  isAi: boolean;
}

export interface Message {
  id:string;
  text: string;
  timestamp: number;
  senderId: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  participants: User[];
  messages: Message[];
  typing?: string[];
}
