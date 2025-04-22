'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  MessageSquare, 
  Share, 
  Download, 
  MoreHorizontal, 
  FileAudio, 
  Box, 
  FileText,
  Play,
  Pause,
  User,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, getRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

// Mock data for MVP
const MOCK_ASSET = {
  id: '1',
  title: 'Forest Tileset',
  description: 'A complete tileset for forest environments with 64x64 pixel art tiles. Includes ground, water, trees, rocks, and decorative elements. Perfect for 2D platformers or RPGs with a natural setting.',
  fileUrl: 'https://images.unsplash.com/photo-1561735746-003319594ef0',
  fileType: 'IMAGE',
  projectId: '1',
  project: {
    id: '1',
    title: 'Woodland Warriors',
  },
  user: {
    id: '1',
    name: 'PixelQueen',
    username: 'pixelqueen',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  },
  likes: 156,
  tags: ['forest', 'tileset', 'pixel-art', '2d', 'environment'],
  createdAt: new Date('2023-10-15'),
  comments: [
    {
      id: '1',
      content: 'Love the lighting on these tiles! The shadows give it such depth.',
      user: {
        id: '2',
        name: 'GameArtPro',
        username: 'gameartpro',
        image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
      },
      createdAt: new Date('2023-10-16'),
    },
    {
      id: '2',
      content: 'This is exactly what I needed for my game project. The water animation is especially well done.',
      user: {
        id: '3',
        name: 'IndieDevMaster',
        username: 'indiedevmaster',
        image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
      },
      createdAt: new Date('2023-10-17'),
    },
  ],
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function AssetDetailPage({ params }: PageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [asset, setAsset] = useState(MOCK_ASSET);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(asset.likes);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState(asset.comments);

  const handleLike = () => {
    if (!session) {
      toast.error('Please sign in to like this asset');
      return;
    }

    if (liked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
  };

  const handleShare = () => {
    // In a real app, this would copy the URL to clipboard or open a share dialog
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleDownload = () => {
    // In a real app, this would trigger the download of the asset file
    toast.success('Download started');
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      toast.error('Please sign in to comment');
      return;
    }
    
    if (!comment.trim()) return;
    
    setIsSubmittingComment(true);
    
    // In a real app, this would submit the comment to the API
    // For the MVP, we'll simulate a successful submission after a short delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const newComment = {
        id: Date.now().toString(),
        content: comment,
        user: {
          id: session.user.id,
          name: session.user.name || 'Anonymous',
          username: session.user.username || 'user',
          image: session.user.image || '',
        },
        createdAt: new Date(),
      };
      
      setComments([newComment, ...comments]);
      setComment('');
      
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Determine what to render based on the asset type
  const renderAssetPreview = () => {
    switch (asset.fileType) {
      case 'IMAGE':
        return (
          <div className="relative w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={asset.fileUrl}
              alt={asset.title}
              width={1200}
              height={800}
              className="object-contain w-full"
            />
          </div>
        );
      case 'MODEL_3D':
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
            <Image
              src={asset.fileUrl}
              alt={asset.title}
              width={1200}
              height={800}
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <Box className="h-24 w-24 text-white" />
            </div>
          </div>
        );
      case 'AUDIO':
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gradient-to-br from-pixelshelf-light to-pixelshelf-primary flex items-center justify-center">
            <FileAudio className="h-24 w-24 text-white" />
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white hover:bg-white h-16 w-16 rounded-full"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 text-pixelshelf-primary" />
              ) : (
                <Play className="h-8 w-8 text-pixelshelf-primary ml-1" />
              )}
            </Button>
          </div>
        );
      case 'DOCUMENT':
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
            <FileText className="h-24 w-24 text-gray-400" />
          </div>
        );
      default:
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
            <Image
              src={asset.fileUrl}
              alt={asset.title}
              width={1200}
              height={800}
              className="object-contain"
            />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - asset preview and details */}
        <div className="lg:col-span-2 space-y-6">
          {renderAssetPreview()}
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button 
                onClick={handleLike}
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-pixelshelf-primary"
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-pixelshelf-primary text-pixelshelf-primary' : ''}`} />
                <span>{likeCount}</span>
              </button>
              <button 
                onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-pixelshelf-primary"
              >
                <MessageSquare className="h-5 w-5" />
                <span>{comments.length}</span>
              </button>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShare}
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold mb-2">{asset.title}</h1>
            <p className="text-muted-foreground whitespace-pre-line">{asset.description}</p>
          </div>
          
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {asset.tags.map((tag) => (
                <Link 
                  key={tag} 
                  href={`/search?tag=${tag}`}
                  className="bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground px-3 py-1 rounded-full text-sm transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          
          {/* Comments section */}
          <div id="comments" className="space-y-6 pt-6 border-t">
            <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
            
            {session ? (
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <Textarea 
                  placeholder="Add a comment..." 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!comment.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-center">
                  <Link href="/login" className="text-pixelshelf-primary hover:underline">
                    Sign in
                  </Link>{' '}
                  to join the conversation
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Link href={`/u/${comment.user.username}`} className="block">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                          {comment.user.image ? (
                            <Image 
                              src={comment.user.image} 
                              alt={comment.user.name} 
                              fill 
                              className="object-cover" 
                            />
                          ) : (
                            <User className="h-10 w-10 p-2 text-muted-foreground" />
                          )}
                        </div>
                      </Link>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <Link 
                          href={`/u/${comment.user.username}`}
                          className="font-medium hover:text-pixelshelf-primary"
                        >
                          {comment.user.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {getRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar - creator info, project info */}
        <div className="space-y-6">
          {/* Creator card */}
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <Link href={`/u/${asset.user.username}`} className="block">
                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
                  {asset.user.image ? (
                    <Image 
                      src={asset.user.image} 
                      alt={asset.user.name} 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <User className="h-12 w-12 p-2 text-muted-foreground" />
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/u/${asset.user.username}`}
                  className="font-medium hover:text-pixelshelf-primary text-lg"
                >
                  {asset.user.name}
                </Link>
                <p className="text-sm text-muted-foreground">@{asset.user.username}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Link href={`/u/${asset.user.username}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </Link>
              <Link href={`/chat/${asset.user.id}`} className="flex-1">
                <Button variant="pixel" className="w-full">
                  Message
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Project card */}
          {asset.projectId && (
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="font-medium mb-2">Part of Project</h3>
              <Link 
                href={`/u/${asset.user.username}/projects/${asset.projectId}`}
                className="block hover:bg-muted p-2 rounded-md -mx-2 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-pixelshelf-light rounded-md flex items-center justify-center">
                    <span className="text-pixelshelf-primary font-medium">{asset.project.title.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium hover:text-pixelshelf-primary">{asset.project.title}</p>
                    <p className="text-xs text-muted-foreground">View project</p>
                  </div>
                </div>
              </Link>
            </div>
          )}
          
          {/* Asset info */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="font-medium mb-3">Asset Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{asset.fileType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded</span>
                <span>{formatDate(asset.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Likes</span>
                <span>{likeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comments</span>
                <span>{comments.length}</span>
              </div>
            </div>
          </div>
          
          {/* Similar assets would go here in a full app */}
        </div>
      </div>
    </div>
  );
}