'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, PaperclipIcon, Smile, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void> | void;
  isDisabled?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function MessageInput({
  onSendMessage,
  isDisabled = false,
  placeholder = 'Type a message...',
  className,
  autoFocus = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize the textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to correctly calculate the new height
    textarea.style.height = 'auto';
    
    // Calculate the new height (with a max height of 150px)
    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = `${newHeight}px`;
  }, [message]);
  
  // Auto-focus the textarea if specified
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isDisabled || isSending) return;
    
    try {
      setIsSending(true);
      await onSendMessage(trimmedMessage);
      setMessage('');
    } finally {
      setIsSending(false);
      
      // Focus the textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <form 
      onSubmit={handleSendMessage}
      className={cn('flex items-end gap-2', className)}
    >
      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled || isSending}
          className="min-h-[40px] max-h-[150px] py-3 pr-12 resize-none"
          rows={1}
        />
        <div className="absolute right-1 bottom-1.5 flex space-x-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            disabled={isDisabled || isSending}
          >
            <Smile className="h-4 w-4" />
            <span className="sr-only">Add emoji</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            disabled={isDisabled || isSending}
          >
            <PaperclipIcon className="h-4 w-4" />
            <span className="sr-only">Attach file</span>
          </Button>
        </div>
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || isDisabled || isSending}
        className="h-10 w-10 rounded-full"
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}