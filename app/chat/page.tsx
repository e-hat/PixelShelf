'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  User, 
  MessageSquare, 
  Send, 
  MoreVertical, 
  Search,
  Loader2
} from 'lucide-react';
import { getRelativeTime } from '@/lib/utils';

// Mock data for the MVP
const MOCK_CHATS = [
  {
    id: '1',
    participants: [
      {
        id: '2',
        name: 'Jane Smith',
        username: 'janesmith',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        isOnline: true,
      }
    ],
    lastMessage: {
      content: 'Hey, I loved your forest tileset! Would you be interested in collaborating on a small game project?',
      senderId: '2',
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    },
    unreadCount: 1,
  },
  {
    id: '2',
    participants: [
      {
        id: '3',
        name: 'Alex Wong',
        username: 'alexwong',
        image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        isOnline: false,
      }
    ],
    lastMessage: {
      content: 'Thanks for the feedback on my character animations!',
      senderId: 'current-user', // This means the current user sent this message
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    unreadCount: 0,
  },
  {
    id: '3',
    participants: [
      {
        id: '4',
        name: 'Sam Taylor',
        username: 'samtaylor',
        image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
        isOnline: true,
      }
    ],
    lastMessage: {
      content: 'I just uploaded some new sound effects you might be interested in',
      senderId: '4',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    unreadCount: 0,
  },
];

const MOCK_MESSAGES = {
  '1': [
    {
      id: '1-1',
      content: 'Hey there! I saw your forest tileset and it looks amazing.',
      senderId: '2',
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    {
      id: '1-2',
      content: 'The lighting and details are just perfect for the game I\'m working on.',
      senderId: '2',
      createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    },
    {
      id: '1-3',
      content: 'Thanks! I spent a lot of time getting the shadows just right.',
      senderId: 'current-user',
      createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
    },
    {
      id: '1-4',
      content: 'It definitely shows! Would you be interested in collaborating on a small game project?',
      senderId: '2',
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    },
  ],
  '2': [
    {
      id: '2-1',
      content: 'Hi, I\'m working on a game with a similar art style to yours. Would you mind if I asked you some questions about your workflow?',
      senderId: '3',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      id: '2-2',
      content: 'Sure, happy to help! What do you want to know?',
      senderId: 'current-user',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: '2-3',
      content: 'Thanks! I was wondering what software you use for your character animations? They look so smooth.',
      senderId: '3',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
    {
      id: '2-4',
      content: 'I use Aseprite for most of my pixel art and animations. For more complex stuff, I sometimes use Spine.',
      senderId: 'current-user',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: '2-5',
      content: 'Thanks for the feedback on my character animations!',
      senderId: 'current-user',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  ],
  '3': [
    {
      id: '3-1',
      content: 'Hey, just wanted to let you know I\'m a big fan of your work!',
      senderId: '4',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      id: '3-2',
      content: 'Thank you! That means a lot. Are you working on any game projects yourself?',
      senderId: 'current-user',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: '3-3',
      content: 'Yes! I\'m a sound designer, actually. Currently working on a collection of 8-bit style sound effects.',
      senderId: '4',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: '3-4',
      content: 'That\'s awesome! I\'m always looking for good sound effects for my projects.',
      senderId: 'current-user',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000), // 1 day and 30 minutes ago
    },
    {
      id: '3-5',
      content: 'I just uploaded some new sound effects you might be interested in',
      senderId: '4',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  ],
};

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chats, setChats] = useState(MOCK_CHATS);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update messages when selected chat changes
    if (selectedChat) {
      setMessages(MOCK_MESSAGES[selectedChat as keyof typeof MOCK_MESSAGES] || []);
      
      // Mark chat as read
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat ? { ...chat, unreadCount: 0 } : chat
        )
      );
    }
  }, [selectedChat]);

  useEffect(() => {
    // Scroll to bottom of messages
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedChat) return;
    
    setIsSending(true);
    
    // In a real app, this would send the message to the API
    // For the MVP, we'll simulate sending and receiving a message
    setTimeout(() => {
      const newMessage = {
        id: `${selectedChat}-${Math.random().toString(36).substring(2, 9)}`,
        content: message,
        senderId: 'current-user',
        createdAt: new Date(),
      };
      
      // Add message to chat
      setMessages(prev => [...prev, newMessage]);
      
      // Update lastMessage in chat list
      setChats(prev => 
        prev.map(chat => 
          chat.id === selectedChat 
            ? { 
                ...chat, 
                lastMessage: {
                  content: message,
                  senderId: 'current-user',
                  createdAt: new Date(),
                }
              } 
            : chat
        )
      );
      
      setMessage('');
      setIsSending(false);
    }, 500);
  };

  const filteredChats = searchQuery 
    ? chats.filter(chat => 
        chat.participants[0].name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.participants[0].username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

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
              {filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <div 
                    key={chat.id}
                    className={`p-3 border-b cursor-pointer hover:bg-muted ${selectedChat === chat.id ? 'bg-muted' : ''}`}
                    onClick={() => setSelectedChat(chat.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                          {chat.participants[0].image ? (
                            <Image 
                              src={chat.participants[0].image} 
                              alt={chat.participants[0].name} 
                              fill 
                              className="object-cover" 
                            />
                          ) : (
                            <User className="h-full w-full p-2 text-muted-foreground" />
                          )}
                        </div>
                        {chat.participants[0].isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="text-sm font-medium truncate">
                            {chat.participants[0].name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {getRelativeTime(chat.lastMessage.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {chat.lastMessage.senderId === 'current-user' && 'You: '}
                            {chat.lastMessage.content}
                          </p>
                          {chat.unreadCount > 0 && (
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
                <div className="p-6 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations found</p>
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
                      {chats.find(c => c.id === selectedChat)?.participants[0].image ? (
                        <Image 
                          src={chats.find(c => c.id === selectedChat)?.participants[0].image || ''} 
                          alt={chats.find(c => c.id === selectedChat)?.participants[0].name || ''} 
                          width={40}
                          height={40}
                          className="object-cover" 
                        />
                      ) : (
                        <User className="h-full w-full p-2 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {chats.find(c => c.id === selectedChat)?.participants[0].name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        @{chats.find(c => c.id === selectedChat)?.participants[0].username}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 rounded-full hover:bg-muted">
                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex ${msg.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${msg.senderId === 'current-user' ? 'bg-pixelshelf-primary text-white' : 'bg-muted'} rounded-lg p-3`}>
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1 text-right">
                            {getRelativeTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messageEndRef} />
                  </div>
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
                    disabled={!message.trim() || isSending}
                  >
                    {isSending ? (
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