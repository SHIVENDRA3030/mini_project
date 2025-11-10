import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Chat as ChatType, User, Message } from './types';
import { ChatList } from './components/ChatList';
import { ChatScreen } from './components/ChatScreen';
import { CloseIcon, SearchIcon } from './components/icons';
import { 
    seedDatabase, 
    getUsers, 
    subscribeToUserChats, 
    sendMessage,
    markMessagesAsRead,
    findOrCreateChat,
} from './services/firebaseService';

// --- LocalStorage Keys ---
const CURRENT_USER_STORAGE_KEY = 'gemini-messenger-currentUser';

// Helper function to get initial state from localStorage
const getInitialUser = (): User | null => {
    try {
        const item = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error reading from localStorage key “${CURRENT_USER_STORAGE_KEY}”:`, error);
        return null;
    }
};

const LoginPage: React.FC<{ users: User[], onLogin: (user: User) => void }> = ({ users, onLogin }) => {
    return (
        <div className="flex flex-col items-center h-screen bg-gray-100 text-gray-800 p-4">
            <h1 className="text-3xl font-bold my-6 flex-shrink-0">Who are you?</h1>
            <div className="w-full max-w-xs overflow-y-auto">
                <div className="flex flex-col items-center gap-4 p-2">
                    {users.map(user => (
                        <div
                            key={user.id}
                            onClick={() => onLogin(user)}
                            className="w-full flex flex-col items-center p-4 bg-white rounded-lg shadow-md cursor-pointer transition-transform duration-200 hover:scale-105 hover:bg-gray-50"
                        >
                            <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full mb-3 border-2 border-gray-300" />
                            <h2 className="text-lg font-medium">{user.name}</h2>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const NewChatModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSelectUser: (userId: string) => void;
}> = ({ isOpen, onClose, users, currentUser, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredUsers = users.filter(user => 
    user.id !== currentUser.id && 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-scale-in text-gray-800"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Select a contact</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-2 border-b border-gray-200">
           <div className="relative">
             <span className="absolute inset-y-0 left-0 flex items-center pl-3">
               <SearchIcon className="w-5 h-5 text-gray-400" />
             </span>
             <input
               type="text"
               placeholder="Search contacts"
               className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               autoFocus
             />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? filteredUsers.map(user => (
            <div 
              key={user.id} 
              onClick={() => onSelectUser(user.id)} 
              className="flex items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
            >
              <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full mr-3" />
              <span className="font-medium">{user.name}</span>
            </div>
          )) : (
            <p className="text-center text-gray-500 p-4">No contacts found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const WelcomeScreen: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gray-100 border-l border-gray-200">
             <div className="w-24 h-24 mb-6">
                <svg viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome to Gemini Messenger</h1>
            <p className="mt-2 text-lg text-gray-500">Select a chat to start messaging.</p>
        </div>
    );
}

const MainLayout: React.FC<{ currentUser: User, onLogout: () => void, allUsers: User[] }> = ({ currentUser, onLogout, allUsers }) => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const activeChatId = location.pathname.startsWith('/chat/') ? location.pathname.split('/')[2] : null;

  useEffect(() => {
    const unsubscribe = subscribeToUserChats(currentUser.id, (userChats) => {
      setChats(userChats);
    });
    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [currentUser.id]);
  
  const handleSelectChat = (chatId: string) => {
    navigate(`/chat/${chatId}`);
    markMessagesAsRead(chatId, currentUser.id);
  };

  const handleSendMessage = async (chatId: string, message: Omit<Message, 'id'>) => {
    await sendMessage(chatId, message);
  };

  const handleStartNewChat = async (otherUserId: string) => {
    const chatId = await findOrCreateChat(currentUser.id, otherUserId);
    setIsNewChatModalOpen(false);
    navigate(`/chat/${chatId}`);
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <>
    <div className="h-full w-full font-sans flex text-gray-800 bg-white">
      {/* ChatList Pane: Hidden on mobile when a chat is active */}
      <div className={`h-full w-full md:w-1/3 lg:w-1/4 flex-shrink-0 ${activeChatId ? 'hidden' : 'flex'} md:flex`}>
          <ChatList
            chats={chats}
            currentUser={currentUser}
            onSelectChat={handleSelectChat}
            activeChatId={activeChatId}
            onLogout={onLogout}
            onNewChat={() => setIsNewChatModalOpen(true)}
          />
        </div>

      {/* ChatScreen Pane: Hidden on mobile when no chat is active */}
      <div className={`h-full flex-1 ${activeChatId ? 'flex' : 'hidden'} md:flex`}>
            <Routes>
                <Route path="/chat/:chatId" element={
                    activeChat ? (
                        <ChatScreen
                            key={activeChat.id}
                            chat={activeChat}
                            currentUser={currentUser}
                            onSendMessage={handleSendMessage}
                            onBack={() => navigate('/')}
                        />
                    ) : <WelcomeScreen />
                } />
                <Route path="/" element={<WelcomeScreen />} />
            </Routes>
        </div>
    </div>
    <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        users={allUsers}
        currentUser={currentUser}
        onSelectUser={handleStartNewChat}
    />
    </>
  );
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(getInitialUser);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Seed database and fetch users on initial load
    useEffect(() => {
        const initializeApp = async () => {
            await seedDatabase();
            const usersFromDb = await getUsers();
            setAllUsers(usersFromDb);
            setIsLoading(false);
        };
        initializeApp();
    }, []);

    // Persist current user in localStorage for session management
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
        } else {
            localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        }
    }, [currentUser]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    if (isLoading) {
      return <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-800">Loading...</div>;
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} users={allUsers.filter(u => !u.isAi)} />;
    }

    return (
        <HashRouter>
            <MainLayout currentUser={currentUser} onLogout={handleLogout} allUsers={allUsers} />
        </HashRouter>
    );
};

export default App;