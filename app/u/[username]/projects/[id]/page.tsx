// app/u/[username]/projects/[id]/page.tsx
'use client';

import { useState, use } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AssetCard from '@/components/feature-specific/asset-card';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useProjectQuery} from '@/hooks/use-projects-query';
import { useAssetsQuery } from '@/hooks/use-assets-query';
import { Asset } from '@/types';
import { LikeButton } from '@/components/shared/like-button';
import { useProjectLikeToggle } from '@/hooks/use-likes-query';

type Params = Promise<{ username: string; id: string }>;

export default function ProjectDetailPage({ params }: { params: Params }) {
  // Unwrap the promised params
  const { username, id } = use(params);

  const { data: session } = useSession();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch project data
  const {
    data: project,
    isLoading: isProjectLoading,
    error: projectError
  } = useProjectQuery(id);

  // Fetch assets for this project
  const {
    assets,
    isLoading: isAssetsLoading
  } = useAssetsQuery({
    projectId: id,
    enabled: !!project
  });

  // Project like functionality
  const { toggleLike, isLoading: isLikeLoading } = useProjectLikeToggle();

  const isOwner = session?.user?.username === username;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };
  
  // Loading state
  if (isProjectLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Error state
  if (projectError || !project) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Project not found</h2>
        <p className="text-muted-foreground mb-6">{projectError instanceof Error ? projectError.message : 'The project you are looking for could not be found'}</p>
        <Button variant="outline" onClick={() => router.push('/')}>Return to Home</Button>
      </div>
    );
  }

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
          <LikeButton 
            isLiked={project.likedByUser || false}
            likeCount={project.likes || 0}
            onToggle={() => {
              if (!session) {
                toast.error('Please sign in to like this project');
                return;
              }
              toggleLike(project.id, project.likedByUser || false);
            }}
            isLoading={isLikeLoading}
          />
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
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                      alt={project.user.name || username}
                      fill
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                  {project.user.name || username}
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
            <div className="space-y-2 text-sm">
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
                {assets.length} assets
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-2" />
                {project.likes} likes
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Description */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-3">About This Project</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {project.description || 'No description provided.'}
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

        {isAssetsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : assets.length > 0 ? (
          <div
            className={
              viewMode === "grid" ? "grid-masonry" : "space-y-4"
            }
          >
            {assets.map((asset: Asset) => (
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
              This project doesn't have any assets yet.
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