'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Share,
  Copy,
  Flag,
  Download,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api/api-client';

interface AssetActionsProps {
  asset: {
    id: string;
    title: string;
    isPublic: boolean;
    userId: string;
  };
  currentUserId?: string;
  className?: string;
}

export function AssetActions({ asset, currentUserId, className }: AssetActionsProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  
  const isOwner = currentUserId === asset.userId;
  
  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/assets/${asset.id}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link to clipboard');
    }
  };
  
  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/assets/${asset.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: asset.title,
          text: `Check out this asset on PixelShelf: ${asset.title}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      console.error('Share failed:', err);
      // User probably cancelled the share
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      await api.assets.delete(asset.id);
      
      toast.success('Asset deleted successfully');
      router.push('/'); // Redirect to home
      router.refresh();
    } catch (err) {
      console.error('Error deleting asset:', err);
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete asset');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleToggleVisibility = async () => {
    setIsUpdatingVisibility(true);
    
    try {
      await api.assets.update(asset.id, {
        isPublic: !asset.isPublic,
      });
      
      toast.success(
        asset.isPublic
          ? 'Asset is now private'
          : 'Asset is now public'
      );
      
      router.refresh();
    } catch (err) {
      console.error('Error updating asset visibility:', err);
      toast.error(err instanceof ApiError ? err.message : 'Failed to update asset visibility');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };
  
  const handleReport = () => {
    toast.info(
      'Thank you for your report. We will review this content shortly.',
      {
        duration: 5000,
      }
    );
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className={className}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.info('Download starting...', { id: 'download' })}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </DropdownMenuItem>
          
          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/assets/${asset.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleToggleVisibility}
                disabled={isUpdatingVisibility}
              >
                {asset.isPublic ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Make private
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Make public
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
          
          {!isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{asset.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}