'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User, 
  Heart, 
  Share, 
  MoreHorizontal, 
  GridIcon, 
  Clock, 
  Edit,
  Plus,
  FolderKanban,
  ImageIcon,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AssetCard from '@/components/feature-specific/asset-card';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { ASSET_TYPES } from '@/constants';

// Mock data for the MVP
const MOCK_PROJECT = {
  id: '1',
  title: 'Woodland Warriors',
  description: 'A 2D action platformer set in a mystical forest world with hand-crafted pixel art. Players take control of animal heroes defending their home from corruption.',
  thumbnail: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1',
  createdAt: new Date('2023-05-12'),
  updatedAt: new Date('2023-10-15'),
  isPublic: true,
  likes: 86,
  user: {
    id: '1',
    name: 'Alex Johnson',
    username: 'pixelartist',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  },
  assets: [
    {
      id: '1',
      title: 'Forest Tileset',
      description: 'A complete tileset for forest environments with 64x64 pixel art tiles.',
      fileUrl: 'https://images.unsplash.com/photo-1561735746-003319594ef0',
      fileType: 'IMAGE' as keyof typeof ASSET_TYPES,
      userId: '1',
      projectId: '1',
      isPublic: true,
      tags: ['tileset', 'environment', 'forest'],
      createdAt: new Date('2023-10-15'),
      updatedAt: new Date('2023-10-15'),
      user: {
        id: '1',
        name: 'Alex Johnson',
        username: 'pixelartist',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      },
      likes: 156,
      comments: 24,
    },
    {
      id: '2',
      title: 'Character Sprite Sheet',
      description: 'Main hero character with walking, running, and attack animations.',
      fileUrl: 'https://images.unsplash.com/photo-1633467067804-c08b17fd2a8a',
      fileType: 'IMAGE' as keyof typeof ASSET_TYPES,
      userId: '1',
      projectId: '1',
      isPublic: true,
      tags: ['character', 'sprite-sheet', 'animation'],
      createdAt: new Date('2023-10-12'),
      updatedAt: new Date('2023-10-12'),
      user: {
        id: '1',
        name: 'Alex Johnson',
        username: 'pixelartist',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      },
      likes: 243,
      comments: 43,
    },
    {
      id: '3',
      title: 'Game UI Elements',
      description: 'Complete UI kit with buttons, panels, and icons in a natural, wooden style.',
      fileUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9',
      fileType: 'IMAGE' as keyof typeof ASSET_TYPES,
      userId: '1',
      projectId: '1',
      isPublic: true,
      tags: ['ui', 'interface', 'buttons'],
      createdAt: new Date('2023-10-20'),
      updatedAt: new Date('2023-10-20'),
      user: {
        id: '1',
        name: 'Alex Johnson',
        username: 'pixelartist',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      },
      likes: 89,
      comments: 12,
    },
    {
      id: '5',
      title: 'Forest Ambience',
      description: 'Pack of atmospheric forest sound effects for level ambience.',
      fileUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
      fileType: 'AUDIO' as keyof typeof ASSET_TYPES,
      userId: '1',
      projectId: '1',
      isPublic: true,
      tags: ['audio', 'sound-effects', 'atmosphere'],
      createdAt: new Date('2023-10-23'),
      updatedAt: new Date('2023-10-23'),
      user: {
        id: '1',
        name: 'Alex Johnson',
        username: 'pixelartist',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      },
      likes: 62,
      comments: 8,
    },
  ]  
};

type Params = Promise<{ username: string; id: string }>;

export default function ProjectDetailPage({ params }: { params: Params }) {
  // unwrap the promised params
  const { username, id } = use(params);

  const { data: session } = useSession();
  const [project, setProject] = useState(MOCK_PROJECT);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(project.likes);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const isOwner = session?.user?.username === username;

  const handleLike = () => {
    if (!session) {
      toast.error("Please sign in to like this project");
      return;
    }
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    setLiked((l) => !l);
    toast.success(liked ? "Removed like" : "Added like");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb + Title */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Link href={`/u/${username}`} className="hover:text-foreground">
              {username}
            </Link>
            <span className="mx-2">/</span>
            <span>Projects</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">{project.title}</span>
          </div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
        </div>

        <div className="flex space-x-2">
          {isOwner && (
            <Link href={`/projects/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            </Link>
          )}
          <Button
            variant={liked ? "default" : "outline"}
            size="sm"
            onClick={handleLike}
            className={liked ? "bg-pixelshelf-primary hover:bg-pixelshelf-primary/90" : ""}
          >
            <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-white" : ""}`} />
            {likeCount}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Header + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {project.thumbnail ? (
              <Image
                src={project.thumbnail}
                alt={project.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-pixelshelf-light to-pixelshelf-accent flex items-center justify-center">
                <FolderKanban className="h-24 w-24 text-white" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Creator */}
          <Card className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Link href={`/u/${username}`} className="block">
                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
                  {project.user.image ? (
                    <Image
                      src={project.user.image}
                      alt={project.user.name}
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
                  href={`/u/${username}`}
                  className="font-medium hover:text-pixelshelf-primary text-lg"
                >
                  {project.user.name}
                </Link>
                <p className="text-sm text-muted-foreground">@{username}</p>
              </div>
            </div>
            <Link href={`/u/${username}`} className="w-full">
              <Button variant="outline" className="w-full">
                View All Projects
              </Button>
            </Link>
          </Card>

          {/* Info */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Project Information</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Created: {formatDate(project.createdAt)}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Updated: {formatDate(project.updatedAt)}
              </div>
              <div className="flex items-center">
                <ImageIcon className="h-4 w-4 mr-2" />
                {project.assets.length} assets
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-2" />
                {likeCount} likes
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Description */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-3">About This Project</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {project.description}
        </p>
      </div>

      {/* Assets */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Project Assets</h2>
          <div className="flex items-center space-x-2">
            {isOwner && (
              <Link href={`/upload?projectId=${id}`}>
                <Button variant="pixel" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </Link>
            )}
            <div className="flex rounded-md overflow-hidden border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${
                  viewMode === "grid" ? "bg-muted" : "bg-background"
                }`}
                title="Grid view"
              >
                <GridIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${
                  viewMode === "list" ? "bg-muted" : "bg-background"
                }`}
                title="List view"
              >
                <GridIcon className="h-4 w-4 rotate-45" />
              </button>
            </div>
          </div>
        </div>

        {project.assets.length > 0 ? (
          <div
            className={
              viewMode === "grid" ? "grid-masonry" : "space-y-4"
            }
          >
            {project.assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                variant={viewMode === "list" ? "horizontal" : "vertical"}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border rounded-lg">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No assets yet</h3>
            <p className="text-muted-foreground mb-4">
              This project doesn’t have any assets yet.
            </p>
            {isOwner && (
              <Link href={`/upload?projectId=${id}`}>
                <Button variant="pixel">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Asset
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}