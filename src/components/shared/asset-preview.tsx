// src/components/shared/asset-preview.tsx
import Image from 'next/image';
import { Box, FileAudio, FileText, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ASSET_TYPES } from '@/constants';
import { cn } from '@/lib/utils';

interface AssetPreviewProps {
  fileUrl: string;
  fileType: keyof typeof ASSET_TYPES;
  title: string;
  aspectRatio?: 'square' | 'video' | 'game-card';
  className?: string;
  onClick?: () => void;
}

export function AssetPreview({
  fileUrl,
  fileType,
  title,
  aspectRatio = 'game-card',
  className,
  onClick,
}: AssetPreviewProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    'game-card': 'aspect-game-card',
  };
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };
  
  switch (fileType) {
    case 'IMAGE':
      return (
        <div 
          className={cn(
            `relative ${aspectClasses[aspectRatio]} w-full overflow-hidden rounded-t-md`,
            className
          )}
          onClick={handleClick}
        >
          <Image
            src={fileUrl}
            alt={title}
            fill
            className="object-cover transition-transform hover:scale-105"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      );
      
    case 'AUDIO':
      return (
        <div 
          className={cn(
            `relative ${aspectClasses[aspectRatio]} w-full overflow-hidden rounded-t-md bg-gradient-to-br from-pixelshelf-light to-pixelshelf-primary flex items-center justify-center`,
            className
          )}
          onClick={handleClick}
        >
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
      
    case 'MODEL_3D':
      return (
        <div 
          className={cn(
            `relative ${aspectClasses[aspectRatio]} w-full overflow-hidden rounded-t-md bg-gray-100 flex items-center justify-center`,
            className
          )}
          onClick={handleClick}
        >
          <Image
            src={fileUrl}
            alt={title}
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
      
    case 'DOCUMENT':
      return (
        <div 
          className={cn(
            `relative ${aspectClasses[aspectRatio]} w-full overflow-hidden rounded-t-md bg-gray-100 flex items-center justify-center`,
            className
          )}
          onClick={handleClick}
        >
          <FileText className="h-16 w-16 text-gray-400" />
        </div>
      );
      
    default:
      return (
        <div 
          className={cn(
            `relative ${aspectClasses[aspectRatio]} w-full overflow-hidden rounded-t-md bg-gray-100 flex items-center justify-center`,
            className
          )}
          onClick={handleClick}
        >
          <Image
            src={fileUrl}
            alt={title}
            fill
            className="object-cover transition-transform hover:scale-105"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      );
  }
}