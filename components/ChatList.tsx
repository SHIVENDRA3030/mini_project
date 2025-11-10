import React, { useState } from 'react';
import { Chat, User } from '../types';
import { ChatListItem } from './ChatListItem';
import { SearchIcon, PlusIcon, LogoutIcon } from './icons';

interface ChatListProps {
  chats: Chat[];
  currentUser: User;
  onSelectChat: (chatId: string) => void;
  activeChatId?: string | null;
  onLogout: () => void;
  onNewChat: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, currentUser, onSelectChat, activeChatId, onLogout, onNewChat }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat => {
    const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 text-gray-800">
      <header className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-100">
        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-full" />
        <h2 className="text-xl font-semibold flex-1 ml-4 text-gray-900">Chats</h2>
        <div className="flex items-center space-x-1">
           <button onClick={onNewChat} className="p-2 rounded-full hover:bg-gray-200" aria-label="New chat">
             <PlusIcon className="w-6 h-6" />
           </button>
           <button onClick={onLogout} className="p-2 rounded-full hover:bg-gray-200" aria-label="Log out">
             <LogoutIcon className="w-6 h-6" />
           </button>
        </div>
      </header>

      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="w-5 h-5 text-gray-500" />
          </span>
          <input
            type="text"
            placeholder="Search chats"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white text-sm text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border-b border-gray-200">
        {filteredChats
          .sort((a, b) => {
            const lastMsgA = a.messages[a.messages.length - 1];
            const lastMsgB = b.messages[b.messages.length - 1];
            return (lastMsgB?.timestamp || 0) - (lastMsgA?.timestamp || 0);
          })
          .map(chat => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            currentUser={currentUser}
            onClick={() => onSelectChat(chat.id)}
            isActive={activeChatId === chat.id}
          />
        ))}
      </div>
    </div>
  );
};