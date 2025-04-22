'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode 
} from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Chat, Message } from '@/types';
import { useNotificationStore } from '@/store';

// Define the Chat context interface
interface ChatContextType {
  chats: Chat[];
  selectedChat: Chat | null;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  chatError: string | null;
  messageError: string | null;
  selectChat: (chatId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  createChat: (userId: string) => Promise<void>;
  markChatAsRead: (chatId: string) => Promise<void>;
  refreshChats: () => Promise<void>;
}

// Create the context with a default value
const ChatContext = createContext<ChatContextType>({
  chats: [],
  selectedChat: null,
  isLoadingChats: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  chatError: null,
  messageError: null,
  selectChat: () => {},
  sendMessage: async () => {},
  createChat: async () => {},
  markChatAsRead: async () => {},
  refreshChats: async () => {},
});

// Provider component
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const setHasNewMessages = useNotificationStore(state => state.setHasNewMessages);
  
  // Fetch chats
  const fetchChats = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setIsLoadingChats(true);
    setChatError(null);
    
    try {
      // In a real app, this would be an API call to fetch chats
      // For MVP, we're using mocked data
      const response = await fetch('/api/chats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      
      const data = await response.json();
      setChats(data.chats);
      
      // Check if there are any unread chats
      const hasUnread = data.chats.some((chat: Chat) => chat.unreadCount && chat.unreadCount > 0);
      setHasNewMessages(hasUnread);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChatError('Failed to load chats');
      toast.error('Failed to load chat conversations');
    } finally {
      setIsLoadingChats(false);
    }
  }, [session?.user?.id, setHasNewMessages]);
  
  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (chatId: string) => {
    if (!session?.user?.id) return;
    
    setIsLoadingMessages(true);
    setMessageError(null);
    
    try {
      // In a real app, this would be an API call to fetch messages
      // For MVP, we're using mock data from the selected chat
      const chat = chats.find(chat => chat.id === chatId);
      
      if (!chat) {
        throw new Error('Chat not found');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the selected chat with messages
      // In a real implementation, this would fetch messages from the API
      setSelectedChat(chat);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessageError('Failed to load messages');
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [chats, session?.user?.id]);
  
  // Select a chat and load its messages
  const selectChat = useCallback((chatId: string) => {
    // Find the chat in the list
    const chat = chats.find(chat => chat.id === chatId);
    
    if (!chat) {
      toast.error('Chat not found');
      return;
    }
    
    // Load messages for this chat
    fetchMessages(chatId);
    
    // Mark chat as read when selected
    if (chat.unreadCount && chat.unreadCount > 0) {
      markChatAsRead(chatId);
    }
  }, [chats, fetchMessages]);
  
  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!session?.user?.id || !selectedChat) {
      toast.error('You must be signed in and have a chat selected to send messages');
      return;
    }
    
    if (!content.trim()) {
      return;
    }
    
    setIsSendingMessage(true);
    setMessageError(null);
    
    try {
      // In a real app, this would send the message to the API
      // For MVP, we'll simulate this
      const newMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        chatId: selectedChat.id,
        senderId: session.user.id,
        receiverId: selectedChat.participants[0].id,
        read: false,
        createdAt: new Date().toISOString(),
      };
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update the chat with the new message
      const updatedChat = {
        ...selectedChat,
        lastMessage: {
          content,
          senderId: session.user.id,
          createdAt: new Date(),
        },
        messages: [...(selectedChat.messages || []), newMessage],
      };
      
      // Update the selected chat
      setSelectedChat(updatedChat);
      
      // Update the chat in the list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id ? updatedChat : chat
        )
      );
      
      // In a real app, we'd also handle real-time updates here
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageError('Failed to send message');
      toast.error('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedChat, session?.user?.id]);
  
  // Create a new chat with a user
  const createChat = useCallback(async (userId: string) => {
    if (!session?.user?.id) {
      toast.error('You must be signed in to start a chat');
      return;
    }
    
    if (userId === session.user.id) {
      toast.error('You cannot chat with yourself');
      return;
    }
    
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.participants.some(p => p.id === userId)
    );
    
    if (existingChat) {
      // If chat exists, select it
      selectChat(existingChat.id);
      return;
    }
    
    setIsLoadingChats(true);
    setChatError(null);
    
    try {
      // In a real app, this would create a new chat via API
      // For MVP, we'll simulate this
      
      // Fetch user info (mock for MVP)
      const userResponse = await fetch(`/api/users/${userId}`);
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user information');
      }
      
      const userData = await userResponse.json();
      
      // Create new chat
      const newChat: Chat = {
        id: `new-${Date.now()}`,
        participants: [
          {
            id: userData.id,
            name: userData.name,
            username: userData.username,
            image: userData.image,
          },
        ],
        lastMessage: undefined,
        unreadCount: 0,
        messages: [],
      };
      
      // Add to chat list
      setChats(prevChats => [newChat, ...prevChats]);
      
      // Select the new chat
      setSelectedChat(newChat);
      
      toast.success(`Started a conversation with ${userData.name}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      setChatError('Failed to create chat');
      toast.error('Failed to start conversation');
    } finally {
      setIsLoadingChats(false);
    }
  }, [chats, selectChat, session?.user?.id]);
  
  // Mark a chat as read
  const markChatAsRead = useCallback(async (chatId: string) => {
    if (!session?.user?.id) return;
    
    try {
      // In a real app, this would call the API to mark chat as read
      // For MVP, we'll update the state directly
      
      // Update the chat in the list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId 
            ? { ...chat, unreadCount: 0 } 
            : chat
        )
      );
      
      // Check if there are any unread chats left
      const hasUnread = chats.some(chat => 
        chat.id !== chatId && chat.unreadCount && chat.unreadCount > 0
      );
      
      setHasNewMessages(hasUnread);
    } catch (error) {
      console.error('Error marking chat as read:', error);
      // No need to show toast for this error
    }
  }, [chats, session?.user?.id, setHasNewMessages]);
  
  // Refresh chats
  const refreshChats = useCallback(async () => {
    await fetchChats();
  }, [fetchChats]);
  
  // Load chats when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchChats();
    }
  }, [session?.user?.id, fetchChats]);
  
  // Provide the context value
  const contextValue: ChatContextType = {
    chats,
    selectedChat,
    isLoadingChats,
    isLoadingMessages,
    isSendingMessage,
    chatError,
    messageError,
    selectChat,
    sendMessage,
    createChat,
    markChatAsRead,
    refreshChats,
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => useContext(ChatContext);