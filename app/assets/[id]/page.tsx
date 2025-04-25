'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  Heart, MessageSquare, Share, Download, User, FileAudio, Box, FileText,
  Play, Pause
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

export default function AssetDetailPage() {
  const { id } = useParams();            // ← pull the `id` from the URL
  const { data: session } = useSession();
  const router = useRouter();

  // If you still want to use a mock while you build
  const [asset, setAsset] = useState(MOCK_ASSET);
  // … rest of your state …
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(asset.likes);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState(asset.comments);

  // Now if you want to fetch the real asset at `api.assets.getById(id)`:
  useEffect(() => {
    if (!id) return;
    // fetch from your API instead of the mock…
    // api.assets.getById(id).then(setAsset)…
  }, [id]);

  const handleLike = () => {
    if (!session) {
      toast.error('Please sign in to like this asset');
      return;
    }
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    setLiked(!liked);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleDownload = () => {
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
    try {
      await new Promise((r) => setTimeout(r, 1000));
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
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

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
      // … other cases …
      default:
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
            <Box className="h-24 w-24 text-gray-400" />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ——————————————————————————————  Main column */}
        <div className="lg:col-span-2 space-y-6">
          {renderAssetPreview()}

          {/* like / comment / share buttons */}
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
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {asset.tags.map((tag, i) => (
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
                  <Button type="submit" disabled={!comment.trim() || isSubmittingComment}>
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
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

            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="border-b pb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Link href={`/u/${c.user.username}`}>
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                          {c.user.image
                            ? <Image src={c.user.image} alt={c.user.name} fill className="object-cover" />
                            : <User className="h-10 w-10 p-2 text-muted-foreground" />}
                        </div>
                      </Link>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <Link href={`/u/${c.user.username}`} className="font-medium hover:text-pixelshelf-primary">
                          {c.user.name}
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
            </div>
          </div>
        </div>

        {/* ——————————————————————————————  Sidebar */}
        <div className="space-y-6">
          {/* creator card */}
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <Link href={`/u/${asset.user.username}`}>
                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
                  {asset.user.image
                    ? <Image src={asset.user.image} alt={asset.user.name} fill className="object-cover" />
                    : <User className="h-12 w-12 p-2 text-muted-foreground" />}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/u/${asset.user.username}`} className="font-medium hover:text-pixelshelf-primary text-lg">
                  {asset.user.name}
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
              <Button asChild variant="pixel" className="w-full">
                <Link href={`/chat/${asset.user.id}`}>Message</Link>
              </Button>
            </div>
          </div>

          {/* project card */}
          {asset.projectId && (
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
                <span>{likeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comments</span>
                <span>{comments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
