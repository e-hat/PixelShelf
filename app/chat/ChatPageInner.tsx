'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  User as UserIcon, 
  MessageSquare, 
  Send, 
  MoreVertical, 
  Search,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getRelativeTime } from '@/lib/utils';
import { useChat } from '@/context/chat-context';
import { Chat, Message } from '@/types';

export default function ChatPageInner() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUserId = searchParams?.get('with');
  
  // Use the chat context
  const { 
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
    refreshChats 
  } = useChat();
  
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  // If a userId is provided in the URL, create or select a chat with that user
  useEffect(() => {
    if (withUserId && session?.user?.id) {
      // Check if a chat with this user already exists
      const existingChat = chats.find(chat => 
        chat.participants.some(p => p.id === withUserId)
      );
      
      if (existingChat) {
        selectChat(existingChat.id);
      } else {
        // Create a new chat with this user
        createChat(withUserId);
      }
    }
  }, [withUserId, session?.user?.id, chats, selectChat, createChat]);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat]);

  // Filter chats based on search query
  const filteredChats = searchQuery 
    ? chats.filter(chat => 
        chat.participants[0].name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.participants[0].username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedChat) return;
    
    sendMessage(message);
    setMessage('');
  };

  if (!session) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="bg-muted p-6 rounded-full">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Sign in to access chat</h1>
          <p className="text-muted-foreground">
            You need to sign in to send and receive messages.
          </p>
          <Button variant="pixel" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="bg-background border rounded-lg shadow-sm overflow-hidden">
        <div className="flex h-[calc(85vh-100px)]">
          {/* Chat list */}
          <div className="w-full md:w-1/3 border-r">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search conversations" 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-y-auto h-[calc(85vh-162px)]">
              {isLoadingChats ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chatError ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-muted-foreground mb-4">{chatError}</p>
                  <Button onClick={refreshChats} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              ) : filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <div 
                    key={chat.id}
                    className={`p-3 border-b cursor-pointer hover:bg-muted ${selectedChat?.id === chat.id ? 'bg-muted' : ''}`}
                    onClick={() => selectChat(chat.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                          {chat.participants[0].image ? (
                            <Image 
                              src={chat.participants[0].image} 
                              alt={chat.participants[0].name || ''} 
                              fill 
                              className="object-cover"
                              placeholder="blur"
                              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <UserIcon className="h-full w-full p-2 text-muted-foreground" />
                          )}
                        </div>
                        {chat.participants[0].isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="text-sm font-medium truncate">
                            {chat.participants[0].name || chat.participants[0].username}
                          </h3>
                          {chat.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {getRelativeTime(chat.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          {chat.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {chat.lastMessage.senderId === session.user.id && 'You: '}
                              {chat.lastMessage.content}
                            </p>
                          )}
                          {chat.unreadCount && (chat.unreadCount > 0) && (
                            <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-medium bg-pixelshelf-primary text-white rounded-full">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Visit other profiles and click "Message" to start chatting
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="hidden md:flex md:flex-col md:w-2/3">
            {selectedChat ? (
              <>
                {/* Chat header */}
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                      {selectedChat.participants[0].image ? (
                        <Image 
                          src={selectedChat.participants[0].image} 
                          alt={selectedChat.participants[0].name || ''} 
                          width={40}
                          height={40}
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <UserIcon className="h-full w-full p-2 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {selectedChat.participants[0].name || selectedChat.participants[0].username}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        @{selectedChat.participants[0].username}
                      </p>
                    </div>
                  </div>
                  <Link href={`/u/${selectedChat.participants[0].username}`}>
                    <Button variant="ghost" size="icon" title="View Profile">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </Link>
                </div>
                
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : messageError ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                      <p className="text-muted-foreground mb-4">{messageError}</p>
                      <Button onClick={() => selectChat(selectedChat.id)} variant="outline" size="sm">
                        Try Again
                      </Button>
                    </div>
                  ) : selectedChat.messages && selectedChat.messages.length > 0 ? (
                    <div className="space-y-4">
                      {selectedChat.messages.map((msg: Message) => (
                        <div 
                          key={msg.id}
                          className={`flex ${msg.senderId === session.user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${msg.senderId === session.user.id ? 'bg-pixelshelf-primary text-white' : 'bg-muted'} rounded-lg p-3`}>
                            <p>{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1 text-right">
                              {getRelativeTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messageEndRef} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-muted-foreground mb-2">No messages yet</p>
                      <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
                    </div>
                  )}
                </div>
                
                {/* Message input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t flex items-center space-x-2">
                  <Input 
                    placeholder="Type a message..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    variant="pixel"
                    disabled={!message.trim() || isSendingMessage}
                  >
                    {isSendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="bg-muted p-6 rounded-full mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Your Messages</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  Select a conversation from the sidebar to start chatting with fellow game developers.
                </p>
              </div>
            )}
          </div>
          
          {/* Mobile: Show a message when no chat is selected */}
          {!selectedChat && (
            <div className="md:hidden flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="bg-muted p-6 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Your Messages</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Select a conversation to start chatting with fellow game developers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}