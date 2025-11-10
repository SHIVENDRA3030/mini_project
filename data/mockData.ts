import { User, Chat } from '../types';

export const users: User[] = [
  { id: 'user-1', name: 'You', avatarUrl: 'https://picsum.photos/seed/you/200', isAi: false },
  { id: 'user-2', name: 'Jivanshu', avatarUrl: 'https://picsum.photos/seed/jivanshu/200', isAi: false },
  { id: 'user-3', name: 'Palak', avatarUrl: 'https://picsum.photos/seed/palak/200', isAi: false },
  { id: 'user-4', name: 'Hardik', avatarUrl: 'https://picsum.photos/seed/hardik/200', isAi: false },
  { id: 'user-5', name: 'Kritika', avatarUrl: 'https://picsum.photos/seed/kritika/200', isAi: false },
];

export const chats: Chat[] = [
  {
    id: 'chat-1',
    participants: [users[0], users[1]], // You & Jivanshu
    messages: [
      { id: 'msg-1-1', text: 'Hey Jivanshu, how’s it going?', timestamp: Date.now() - 100000, senderId: 'user-1', isRead: true },
      { id: 'msg-1-2', text: 'All good! Just working on the project. You?', timestamp: Date.now() - 90000, senderId: 'user-2', isRead: true },
    ],
  },
  {
    id: 'chat-2',
    participants: [users[0], users[2]], // You & Palak
    messages: [
      { id: 'msg-2-1', text: 'Hi Palak, are you free this weekend?', timestamp: Date.now() - 200000, senderId: 'user-1', isRead: true },
      { id: 'msg-2-2', text: 'Hey! Yes, I am. Any plans?', timestamp: Date.now() - 180000, senderId: 'user-3', isRead: false },
    ],
  },
  {
    id: 'chat-3',
    participants: [users[0], users[3]], // You & Hardik
    messages: [
      { id: 'msg-3-1', text: 'Did you see the game last night?', timestamp: Date.now() - 500000, senderId: 'user-4', isRead: true },
    ],
  },
  {
    id: 'chat-4',
    participants: [users[0], users[4]], // You & Kritika
    messages: [],
  },
];