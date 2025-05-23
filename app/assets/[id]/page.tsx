// app/assets/[id]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Share, 
  Download, 
  User, 
  FileAudio, 
  Box, 
  FileText,
  Play, 
  Pause, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, getRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  useAssetQuery
} from '@/hooks/use-assets-query';
import { 
  useCommentsQuery, 
  useCreateCommentMutation 
} from '@/hooks/use-comments-query';
import { useAssetLikeToggle } from '@/hooks/use-likes-query';
import { LikeButton } from '@/components/shared/like-button';
import { Comment } from '@/types';

export default function AssetDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [comment, setComment] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Fetch asset data
  const { 
    data: asset, 
    isLoading, 
    error 
  } = useAssetQuery(id as string);

  // Fetch comments
  const { 
    comments, 
    isLoading: isLoadingComments 
  } = useCommentsQuery(id as string);

  const safeComments = comments ?? []

  // Like/unlike mutations
  const { toggleLike, isLoading: isLikeLoading } = useAssetLikeToggle();

  // Create comment mutation
  const createCommentMutation = useCreateCommentMutation();

  // Scroll to bottom of comments when new one is added
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleDownload = () => {
    if (!asset) return;
    
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = asset.fileUrl;
    link.download = asset.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Download started');
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      toast.error('Please sign in to comment');
      return;
    }
    
    if (!asset || !comment.trim()) return;
    
    createCommentMutation.mutate({
      assetId: asset.id,
      content: comment
    }, {
      onSuccess: () => {
        setComment('');
      }
    });
  };

  const renderAssetPreview = () => {
    if (!asset) return null;
    
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
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
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
              {isPlaying ? <Pause className="h-8 w-8 text-pixelshelf-primary" />
                         : <Play  className="h-8 w-8 text-pixelshelf-primary ml-1" />}
            </Button>
          </div>
        );
      // Add cases for other file types
      default:
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
            <Box className="h-24 w-24 text-gray-400" />
          </div>
        );
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Error state
  if (error || !asset) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Asset not found</h2>
        <p className="text-muted-foreground mb-6">{error instanceof Error ? error.message : 'The asset you are looking for could not be found'}</p>
        <Button variant="outline" onClick={() => router.push('/')}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {renderAssetPreview()}

          {/* like / comment / share buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <LikeButton 
                isLiked={asset.likedByUser || false}
                likeCount={asset.likes || 0}
                onToggle={() => {
                  if (!session) {
                    toast.error('Please sign in to like this asset');
                    return;
                  }
                  if (!asset) return;
                  toggleLike(asset.id, asset.likedByUser || false);
                }}
                isLoading={isLikeLoading}
              />
              <button
                onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-pixelshelf-primary"
              >
                <MessageSquare className="h-5 w-5" />
                <span>{safeComments.length}</span>
              </button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />Download
              </Button>
            </div>
          </div>

          {/* title, desc, tags */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{asset.title}</h1>
            <p className="text-muted-foreground whitespace-pre-line">{asset.description}</p>
          </div>
          {asset.tags && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {asset.tags.map((tag: string, i: number) => (
                <Link
                  key={i}
                  href={`/search?tag=${tag}`}
                  className="bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground px-3 py-1 rounded-full text-sm transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* comments */}
          <div id="comments" className="space-y-6 pt-6 border-t">
            <h2 className="text-xl font-semibold">Comments ({safeComments.length})</h2>
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
                    disabled={!comment.trim() || createCommentMutation.isPending}
                  >
                    {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="bg-muted p-4 rounded-md text-center">
                <Link href="/login" className="text-pixelshelf-primary hover:underline">
                  Sign in
                </Link>{' '}
                to join the conversation
              </div>
            )}

            {isLoadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {safeComments.map((c: Comment) => (
                  <div key={c.id} className="border-b pb-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Link href={`/u/${c.user.username}`}>
                          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                            {c.user.image
                              ? <Image
                                  src={c.user.image}
                                  alt={c.user.name || ''}
                                  fill
                                  className="object-cover"
                                  placeholder="blur"
                                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              : <User className="h-10 w-10 p-2 text-muted-foreground" />}
                          </div>
                        </Link>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <Link href={`/u/${c.user.username}`} className="font-medium hover:text-pixelshelf-primary">
                            {c.user.name || c.user.username}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {getRelativeTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1">{c.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* creator card */}
          {asset.user && (
            <div className="border rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <Link href={`/u/${asset.user.username}`}>
                  <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
                    {asset.user.image
                      ? <Image
                          src={asset.user.image}
                          alt={asset.user.name || ''}
                          fill
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      : <User className="h-12 w-12 p-2 text-muted-foreground" />}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/u/${asset.user.username}`} className="font-medium hover:text-pixelshelf-primary text-lg">
                    {asset.user.name || asset.user.username}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    @{asset.user.username}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/u/${asset.user.username}`}>View Profile</Link>
                </Button>
                {session && session.user.id !== asset.user.id && (
                  <Button asChild variant="pixel" className="w-full">
                    <Link href={`/chat?with=${asset.user.id}`}>Message</Link>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* project card */}
          {asset.projectId && asset.project && (
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="font-medium mb-2">Part of Project</h3>
              <Link
                href={`/u/${asset.user.username}/projects/${asset.projectId}`}
                className="block hover:bg-muted p-2 rounded-md -mx-2 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-pixelshelf-light rounded-md flex items-center justify-center">
                    <span className="text-pixelshelf-primary font-medium">
                      {asset.project.title.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium hover:text-pixelshelf-primary">
                      {asset.project.title}
                    </p>
                    <p className="text-xs text-muted-foreground">View project</p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* metadata */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="font-medium mb-3">Asset Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{asset.fileType.replace('_',' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded</span>
                <span>{formatDate(asset.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Likes</span>
                <span>{asset.likes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comments</span>
                <span>{safeComments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}