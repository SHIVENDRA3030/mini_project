import React from 'react';
import { Chat, User } from '../types';

interface ChatListItemProps {
  chat: Chat;
  currentUser: User;
  onClick: () => void;
  isActive: boolean;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ chat, currentUser, onClick, isActive }) => {
  const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
  const lastMessage = chat.messages[chat.messages.length - 1];
  const unreadCount = chat.messages.filter(m => !m.isRead && m.senderId !== currentUser.id).length;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-colors duration-200 border-b border-gray-200 ${
        isActive ? 'bg-gray-200' : 'hover:bg-gray-100'
      }`}
    >
      <img src={otherParticipant?.avatarUrl} alt={otherParticipant?.name} className="w-12 h-12 rounded-full mr-4" />
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900 truncate">{otherParticipant?.name}</h3>
          {lastMessage && (
            <span className={`text-xs ${unreadCount > 0 ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}>
              {formatDate(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-start mt-1">
          <p className="text-sm text-gray-500 truncate pr-2">
            {lastMessage?.text || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="bg-indigo-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};