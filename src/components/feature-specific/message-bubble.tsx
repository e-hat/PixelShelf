'use client';

import Image from 'next/image';
import { Check, CheckCheck } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { UserAvatar } from '@/components/feature-specific/user-avatar';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    createdAt: Date | string;
    isRead?: boolean;
    isSending?: boolean;
  };
  sender: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
  isCurrentUser: boolean;
  showAvatar?: boolean;
  withTail?: boolean;
  className?: string;
}

export function MessageBubble({
  message,
  sender,
  isCurrentUser,
  showAvatar = true,
  withTail = false,
  className,
}: MessageBubbleProps) {
  const formattedTime = typeof message.createdAt === 'string'
    ? formatTime(new Date(message.createdAt))
    : formatTime(message.createdAt);
  
  const baseStyles = cn(
    'max-w-[75%] relative flex flex-col group',
    isCurrentUser ? 'ml-auto' : 'mr-auto',
    className
  );
  
  const bubbleStyles = cn(
    'px-4 py-2 rounded-lg text-sm leading-relaxed relative break-words',
    isCurrentUser 
      ? 'bg-pixelshelf-primary text-white rounded-br-none' 
      : 'bg-muted rounded-bl-none'
  );
  
  // Function to render message content
  const renderContent = () => {
    // Check if content contains URLs and make them clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.content.split(urlRegex);
    
    if (parts.length > 1) {
      return parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a 
              key={index} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline text-blue-400 hover:text-blue-300"
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      });
    }
    
    return message.content;
  };
  
  return (
    <div className={baseStyles}>
      <div className="flex items-end gap-2">
        {!isCurrentUser && showAvatar && (
          <UserAvatar 
            user={sender} 
            size="sm"
            className={cn(withTail ? 'mb-5' : 'mb-0')}
          />
        )}
        
        <div className={bubbleStyles}>
          {renderContent()}
          
          {/* Message tail - the little triangle at the bottom corner */}
          {withTail && (
            <div 
              className={cn(
                "absolute bottom-0 w-3 h-3 overflow-hidden",
                isCurrentUser 
                  ? "right-0 translate-x-2" 
                  : "left-0 -translate-x-2"
              )}
            >
              <div 
                className={cn(
                  "absolute transform rotate-45 w-2 h-2",
                  isCurrentUser 
                    ? "bg-pixelshelf-primary -translate-y-1 -translate-x-1" 
                    : "bg-muted -translate-y-1 translate-x-1"
                )}
              />
            </div>
          )}
        </div>
        
        {isCurrentUser && showAvatar && (
          <UserAvatar 
            user={sender} 
            size="sm"
            className={cn(withTail ? 'mb-5' : 'mb-0')}
          />
        )}
      </div>
      
      {/* Message timestamp and read indicators */}
      <div 
        className={cn(
          "flex items-center text-xs text-muted-foreground mt-1",
          isCurrentUser ? "justify-end mr-10" : "justify-start ml-10"
        )}
      >
        <span>{formattedTime}</span>
        
        {isCurrentUser && (
          <span className="ml-1">
            {message.isRead ? (
              <CheckCheck className="h-3 w-3 text-blue-500" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </span>
        )}
        
        {message.isSending && (
          <span className="ml-1 text-xs italic">Sending...</span>
        )}
      </div>
    </div>
  );
}