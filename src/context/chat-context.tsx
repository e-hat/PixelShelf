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
import { Chat } from '@/types';
import { useNotificationStore } from '@/store';
import { 
  useChatsQuery, 
  useChatQuery, 
  useSendMessageMutation, 
  useCreateChatMutation, 
  useMarkChatAsReadMutation 
} from '@/hooks/use-chats-query';

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
  const setHasNewMessages = useNotificationStore(state => state.setHasNewMessages);
  
  // State for selected chat ID
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // Use React Query hooks
  const { 
    data: chatsData,
    isLoading: isLoadingChats,
    error: chatsError,
    refetch: refetchChats
  } = useChatsQuery({
    enabled: !!session?.user?.id
  });
  
  const {
    data: chatData,
    isLoading: isLoadingMessages,
    error: chatError
  } = useChatQuery(selectedChatId || '', {
    enabled: !!session?.user?.id && !!selectedChatId
  });
  
  const sendMessageMutation = useSendMessageMutation();
  const createChatMutation = useCreateChatMutation();
  const markAsReadMutation = useMarkChatAsReadMutation();
  
  // Derived state
  const chats = chatsData?.chats || [];
  const selectedChat = chatData || null;
  const chatErrorMessage = chatsError instanceof Error ? chatsError.message : 'Failed to load chats';
  const messageErrorMessage = chatError instanceof Error ? chatError.message : 'Failed to load messages';
  
  // Check for unread messages
  useEffect(() => {
    if (chats && chats.length > 0) {
      const hasUnread = chats.some((chat: { unreadCount: number; }) => chat.unreadCount && chat.unreadCount > 0);
      setHasNewMessages(hasUnread);
    }
  }, [chats, setHasNewMessages]);
  
  // Select a chat and load its messages
  const selectChat = useCallback((chatId: string) => {
    // Find the chat in the list
    const chat = chats.find((chat: { id: string; }) => chat.id === chatId);
    
    if (!chat) {
      toast.error('Chat not found');
      return;
    }
    
    // Update selected chat ID
    setSelectedChatId(chatId);
    
    // Mark chat as read when selected
    if (chat.unreadCount && chat.unreadCount > 0) {
      markAsReadMutation.mutate(chatId);
    }
  }, [chats, markAsReadMutation]);
  
  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!session?.user?.id || !selectedChatId) {
      toast.error('You must be signed in and have a chat selected to send messages');
      return;
    }
    
    if (!content.trim()) {
      return;
    }
    
    try {
      await sendMessageMutation.mutateAsync({ 
        chatId: selectedChatId, 
        content 
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Error is handled in the mutation
    }
  }, [selectedChatId, session?.user?.id, sendMessageMutation]);
  
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
    const existingChat = chats.find((chat: { participants: any[]; }) => 
      chat.participants.some(p => p.id === userId)
    );
    
    if (existingChat) {
      // If chat exists, select it
      selectChat(existingChat.id);
      return;
    }
    
    try {
      const newChat = await createChatMutation.mutateAsync(userId);
      
      // Select the new chat
      setSelectedChatId(newChat.id);
    } catch (error) {
      console.error('Error creating chat:', error);
      // Error is handled in the mutation
    }
  }, [chats, createChatMutation, selectChat, session?.user?.id]);
  
  // Mark a chat as read
  const markChatAsRead = useCallback(async (chatId: string) => {
    if (!session?.user?.id) return;
    
    try {
      await markAsReadMutation.mutateAsync(chatId);
    } catch (error) {
      console.error('Error marking chat as read:', error);
      // Error is handled in the mutation
    }
  }, [markAsReadMutation, session?.user?.id]);
  
  // Refresh chats
  const refreshChats = useCallback(async () => {
    await refetchChats();
  }, [refetchChats]);
  
  // Provide the context value
  const contextValue: ChatContextType = {
    chats,
    selectedChat,
    isLoadingChats,
    isLoadingMessages,
    isSendingMessage: sendMessageMutation.isPending,
    chatError: chatsError ? chatErrorMessage : null,
    messageError: chatError ? messageErrorMessage : null,
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