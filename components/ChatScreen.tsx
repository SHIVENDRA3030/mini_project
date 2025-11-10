import React, { useState, useEffect, useRef } from 'react';
import { Chat, User, Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { ArrowLeftIcon, SendIcon, MoreVertIcon, CloseIcon, VideoCallIcon, VoiceCallIcon } from './icons';
import { getAiResponse, summarizeChat } from '../services/geminiService';
import { updateTypingStatus } from '../services/firebaseService';

interface ChatScreenProps {
  chat: Chat;
  currentUser: User;
  onSendMessage: (chatId: string, message: Omit<Message, 'id'>) => Promise<void>;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ chat, currentUser, onSendMessage, onBack }) => {
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
  
  const isOtherUserTyping = chat.typing?.includes(otherParticipant?.id || '') || false;

  // State for summarization modal
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, isAiTyping, isOtherUserTyping]);
  
  // Effect for closing menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Cleanup typing status on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      updateTypingStatus(chat.id, currentUser.id, false);
    };
  }, [chat.id, currentUser.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (e.target.value.trim() !== '') {
      updateTypingStatus(chat.id, currentUser.id, true);
      typingTimeoutRef.current = window.setTimeout(() => {
        updateTypingStatus(chat.id, currentUser.id, false);
        typingTimeoutRef.current = null;
      }, 1500); // 1.5 seconds timeout
    } else {
      updateTypingStatus(chat.id, currentUser.id, false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    updateTypingStatus(chat.id, currentUser.id, false);

    const userMessage: Omit<Message, 'id'> = {
      text: inputText,
      timestamp: Date.now(),
      senderId: currentUser.id,
      isRead: false,
    };
    
    const currentInput = inputText;
    setInputText('');

    await onSendMessage(chat.id, userMessage);

    if (otherParticipant?.isAi) {
      setIsAiTyping(true);
      const aiResponseText = await getAiResponse(chat.messages, currentInput, currentUser.id);
      const aiMessage: Omit<Message, 'id'> = {
        text: aiResponseText,
        timestamp: Date.now(),
        senderId: otherParticipant.id,
        isRead: false,
      };
      await onSendMessage(chat.id, aiMessage);
      setIsAiTyping(false);
    }
  };

  const handleSummarize = async () => {
    setIsMenuOpen(false);
    setIsSummaryModalOpen(true);
    setIsSummarizing(true);
    setSummary('');

    const summaryText = await summarizeChat(chat.messages, chat.participants);
    
    setSummary(summaryText);
    setIsSummarizing(false);
  };

  const handleVoiceCall = () => {
    alert(`Starting voice call with ${otherParticipant?.name}... (This is a demo feature)`);
  };

  const handleVideoCall = () => {
    alert(`Starting video call with ${otherParticipant?.name}... (This is a demo feature)`);
  };

  if (!otherParticipant) {
    return <div className="flex items-center justify-center h-full text-gray-500">Select a chat to start messaging</div>;
  }

  const TypingIndicator = () => (
    <div className="flex w-full my-1 justify-start">
      <div className="px-4 py-2 rounded-lg max-w-sm shadow bg-gray-200 rounded-bl-none">
          <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800">
      {/* Header */}
      <header className="flex items-center p-3 border-b border-gray-300 bg-gray-200 shadow-sm">
        <button onClick={onBack} className="md:hidden mr-3 p-2 rounded-full hover:bg-gray-300">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <img src={otherParticipant.avatarUrl} alt={otherParticipant.name} className="w-10 h-10 rounded-full mr-3" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{otherParticipant.name}</h2>
          {isOtherUserTyping && <p className="text-sm text-indigo-600 animate-pulse">typing...</p>}
        </div>
        <div className="flex items-center space-x-1">
            <button onClick={handleVideoCall} className="p-2 rounded-full hover:bg-gray-300" aria-label="Video call">
                <VideoCallIcon className="w-6 h-6 text-gray-600" />
            </button>
            <button onClick={handleVoiceCall} className="p-2 rounded-full hover:bg-gray-300" aria-label="Voice call">
                <VoiceCallIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-300" aria-label="Chat options">
                    <MoreVertIcon className="w-6 h-6 text-gray-600" />
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                        <button
                            onClick={handleSummarize}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Summarize Chat
                        </button>
                    </div>
                )}
            </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        {chat.messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} isSender={msg.senderId === currentUser.id} />
        ))}
        {(isAiTyping || isOtherUserTyping) && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="p-3 border-t border-gray-300 bg-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 p-3 rounded-full bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="ml-2 sm:ml-3 bg-indigo-500 text-white p-2 sm:p-3 rounded-full hover:bg-indigo-600 transition-colors duration-200 disabled:bg-indigo-300 flex-shrink-0"
            disabled={!inputText.trim()}
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </footer>
      
      {/* Summary Modal */}
      {isSummaryModalOpen && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 transition-opacity duration-300"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white text-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-scale-in">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold">Chat Summary</h3>
                    <button onClick={() => setIsSummaryModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {isSummarizing ? (
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse"></div>
                            <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            <span className="ml-2">Summarizing...</span>
                        </div>
                    ) : (
                        <p className="text-base text-gray-700 whitespace-pre-wrap">{summary}</p>
                    )}
                </div>
                <div className="flex justify-end p-4 border-t border-gray-200">
                    <button 
                        onClick={() => setIsSummaryModalOpen(false)}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                    >
                        Close
                    </button>
                </div>
            </div>
            {/* The animation style is now in index.html */}
        </div>
      )}
    </div>
  );
};