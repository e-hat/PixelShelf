'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Heart, MessageSquare, Share, Play, FileAudio, File, Box, FileText } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { getRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Asset } from '@/types';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useAssetLikeToggle } from '@/hooks/use-likes-query';

interface AssetCardProps {
  asset: Asset;
  variant?: 'horizontal' | 'vertical';
}

export default function AssetCard({ asset }: AssetCardProps) {
  const { data: session } = useSession();
  
  // Use the optimistic UI approach for likes - start with the initial state from the asset
  const [isLiked, setIsLiked] = useState(asset.likedByUser || false);
  const [likeCount, setLikeCount] = useState(asset.likes || 0);
  
  // Use the asset like toggle hook
  const { toggleLike, isLoading: isLikeLoading } = useAssetLikeToggle();

  const handleLike = async () => {
    if (!session) {
      toast.error('Please sign in to like this asset');
      return;
    }
    
    if (isLikeLoading) return;
    
    // Optimistically update UI
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    // Call the mutation
    toggleLike(asset.id, isLiked);
  };

  // Determine what to render based on the asset type
  const renderAssetPreview = () => {
    switch (asset.fileType) {
      case 'IMAGE':
        return (
          <div className="relative aspect-game-card w-full overflow-hidden rounded-t-md">
            <Image
              src={asset.fileUrl}
              alt={asset.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        );
      case 'MODEL_3D':
        return (
          <div className="relative aspect-game-card w-full overflow-hidden rounded-t-md bg-gray-100 flex items-center justify-center">
            <Image
              src={asset.fileUrl}
              alt={asset.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <Box className="h-12 w-12 text-white" />
            </div>
          </div>
        );
      case 'AUDIO':
        return (
          <div className="relative aspect-game-card w-full overflow-hidden rounded-t-md bg-gradient-to-br from-pixelshelf-light to-pixelshelf-primary flex items-center justify-center">
            <FileAudio className="h-16 w-16 text-white" />
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute bottom-4 right-4 bg-white hover:bg-white"
            >
              <Play className="h-4 w-4 text-pixelshelf-primary" />
            </Button>
          </div>
        );
      case 'DOCUMENT':
        return (
          <div className="relative aspect-game-card w-full overflow-hidden rounded-t-md bg-gray-100 flex items-center justify-center">
            <FileText className="h-16 w-16 text-gray-400" />
          </div>
        );
      default:
        return (
          <div className="relative aspect-game-card w-full overflow-hidden rounded-t-md bg-gray-100 flex items-center justify-center">
            <Image
              src={asset.fileUrl}
              alt={asset.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        );
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/assets/${asset.id}`}>
        {renderAssetPreview()}
      </Link>
      <CardContent className="p-4">
        <div className="mb-2">
          <Link href={`/assets/${asset.id}`} className="font-medium hover:text-pixelshelf-primary text-lg">
            {asset.title}
          </Link>
          {asset.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {asset.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/u/${asset.user.username}`} className="flex items-center">
            <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2">
            {asset.user.image ? (
              <Image
                src={asset.user.image}
                alt={asset.user.name ?? "User"}
                fill
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="bg-gray-300 w-full h-full" />
            )}
            </div>
            <span className="text-sm font-medium hover:text-pixelshelf-primary">
              {asset.user.name || asset.user.username}
            </span>
          </Link>
          <span className="text-xs text-muted-foreground">
            • {getRelativeTime(asset.createdAt)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleLike}
            className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-pixelshelf-primary"
            disabled={isLikeLoading}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-pixelshelf-primary text-pixelshelf-primary' : ''}`} />
            <span>{likeCount}</span>
          </button>
          <Link 
            href={`/assets/${asset.id}#comments`}
            className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-pixelshelf-primary"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{asset.comments}</span>
          </Link>
        </div>
        <button className="text-muted-foreground hover:text-pixelshelf-primary">
          <Share className="h-4 w-4" />
        </button>
      </CardFooter>
    </Card>
  );
}