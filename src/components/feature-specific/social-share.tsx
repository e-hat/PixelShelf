'use client';

import { useState } from 'react';
import {
  Twitter,
  Facebook,
  Link as LinkIcon,
  Copy,
  Share2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SocialShareProps {
  title: string;
  description?: string;
  url: string;
  image?: string;
  variant?: 'button' | 'icon';
  className?: string;
}

export function SocialShare({
  title,
  description,
  url,
  image,
  variant = 'button',
  className,
}: SocialShareProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Ensure we have a valid URL with the correct origin
  const getShareUrl = () => {
    try {
      // If URL is already absolute, return it
      if (url.startsWith('http')) {
        return url;
      }
      
      // Otherwise, prepend the current site's origin
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
    } catch (error) {
      console.error('Error formatting share URL:', error);
      return url;
    }
  };
  
  const shareUrl = getShareUrl();
  
  // Share via Web Share API if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Show the dropdown menu if the user cancelled the share
        if (error instanceof Error && error.name !== 'AbortError') {
          setShareDialogOpen(true);
        }
      }
    } else {
      setShareDialogOpen(true);
    }
  };
  
  // Share to different platforms
  const shareToTwitter = () => {
    const text = `${title}${description ? ` - ${description}` : ''}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
    setShareDialogOpen(false);
  };
  
  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank');
    setShareDialogOpen(false);
  };
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link to clipboard');
    }
  };
  
  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className={className}>
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={shareToTwitter}>
            <Twitter className="h-4 w-4 mr-2" />
            Share on Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToFacebook}>
            <Facebook className="h-4 w-4 mr-2" />
            Share on Facebook
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={handleNativeShare}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
      
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this {title}</DialogTitle>
            <DialogDescription>
              Share this {description ? description : 'content'} with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input
                  id="share-link"
                  value={shareUrl}
                  readOnly
                  className="h-9"
                />
              </div>
              <Button
                size="sm"
                className="px-3"
                onClick={copyToClipboard}
                variant="outline"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy</span>
              </Button>
            </div>
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={shareToTwitter}
              >
                <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                <span className="sr-only">Share on Twitter</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={shareToFacebook}
              >
                <Facebook className="h-5 w-5 text-[#1877F2]" />
                <span className="sr-only">Share on Facebook</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}