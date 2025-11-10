import React from 'react';
import { Message } from '../types';
import { CheckIcon, DoubleCheckIcon } from './icons';

interface ChatMessageProps {
  message: Message;
  isSender: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isSender }) => {
  const wrapperClass = isSender ? 'justify-end' : 'justify-start';
  const bubbleClass = isSender
    ? 'bg-indigo-500 text-white rounded-br-none'
    : 'bg-white text-gray-800 rounded-bl-none border border-gray-200';

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const ReadReceipt = () => {
    if (!isSender) return null;
    return message.isRead ? 
      <DoubleCheckIcon className="w-4 h-4 text-white opacity-80" /> : 
      <CheckIcon className="w-4 h-4 text-white opacity-80" />;
  };

  return (
    <div className={`flex w-full my-1 ${wrapperClass}`}>
      <div className={`px-3 py-2 rounded-lg max-w-sm md:max-w-md lg:max-w-lg shadow ${bubbleClass}`}>
        <p className="text-base break-words">{message.text}</p>
        <div className="flex items-center justify-end mt-1 ml-4 space-x-1">
          <span className={`text-xs ${isSender ? 'text-indigo-100' : 'text-gray-500'} opacity-75`}>{formatDate(message.timestamp)}</span>
          <ReadReceipt />
        </div>
      </div>
    </div>
  );
};