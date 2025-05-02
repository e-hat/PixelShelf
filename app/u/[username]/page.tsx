// app/u/[username]/page.tsx
'use client';

import { useState, use } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User as UserIcon, 
  MapPin, 
  Twitter, 
  Github, 
  Linkedin, 
  Globe, 
  Edit, 
  Grid, 
  FolderKanban, 
  ChevronDown,
  Users,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssetCard from '@/components/feature-specific/asset-card';
import ProjectCard from '@/components/feature-specific/project-card';
import { formatDate } from '@/lib/utils';
import { useUserProfileQuery, useFollowUserMutation, useUnfollowUserMutation } from '@/hooks/use-user-profile-query';
import { useAssetsQuery } from '@/hooks/use-assets-query';
import { useProjectsQuery } from '@/hooks/use-projects-query';
import { useCreateChatMutation } from '@/hooks/use-chats-query';
import { Asset, Project } from '@/types';
import router from 'next/router';
import { toast } from 'sonner';

type Params = Promise<{ username: string }>;

export default function UserProfilePage({ params }: { params: Params }) {
  // Unwrap the promised params
  const { username } = use(params);
  
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"assets" | "projects">("assets");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Fetch user profile
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useUserProfileQuery(username);

  // Fetch user assets
  const {
    assets,
    isLoading: isLoadingAssets,
    error: assetsError
  } = useAssetsQuery({
    userId: profile?.id,
    enabled: !!profile,
  });

  // Fetch user projects
  const {
    projects,
    isLoading: isLoadingProjects,
    error: projectsError
  } = useProjectsQuery({
    userId:  profile?.id,
    enabled: !!profile
});

  // Follow/unfollow mutations
  const followMutation = useFollowUserMutation();
  const unfollowMutation = useUnfollowUserMutation();

  // Create chat mutation
  const createChatMutation = useCreateChatMutation();

  const isOwnProfile = session?.user?.username?.toLowerCase() === username.toLowerCase();

  const handleFollow = async () => {
    if (!session) {
      toast.error('Please sign in to follow users');
      return;
    }
    
    if (!profile) return;
    
    if (profile.isFollowing) {
      unfollowMutation.mutate(profile.id);
    } else {
      followMutation.mutate(profile.id);
    }
  };

  const handleMessage = async () => {
    if (!session) {
      toast.error('Please sign in to message users');
      return;
    }
    
    if (!profile) return;
    
    createChatMutation.mutate(profile.id, {
      onSuccess: (newChat) => {
        router.push(`/chat?with=${profile.id}`);
      }
    });
  };

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (profileError || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <p className="text-muted-foreground mb-8">
          {profileError instanceof Error ? profileError.message : "The user you're looking for doesn't exist or couldn't be loaded."}
        </p>
        <Button asChild variant="outline">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-64 md:h-80 w-full bg-gradient-to-br from-pixelshelf-light to-pixelshelf-primary overflow-hidden">
        {profile.bannerImage && (
          <Image
            src={profile.bannerImage}
            alt={`${profile.name}'s banner`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        {isOwnProfile && (
          <Link
            href="/settings/profile"
            className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-background/100 transition-colors"
          >
            <Edit className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Profile info */}
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row mb-8">
          {/* Avatar */}
          <div className="relative mb-4 md:mb-0 md:mr-6 -mt-24 md:-mt-16">
            <div className="rounded-full overflow-hidden border-4 border-background h-32 w-32 md:h-48 md:w-48 bg-background relative">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name || 'User avatar'}
                  fill
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <UserIcon className="h-full w-full p-10 text-muted-foreground" />
              )}
            </div>
            {profile.subscriptionTier === 'PREMIUM' && (
              <div className="absolute bottom-2 right-2 bg-pixelshelf-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                PRO
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 pt-0 md:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <div className="flex items-center text-muted-foreground mb-2">
                  <span className="text-sm">@{profile.username}</span>
                  {profile.location && (
                    <>
                      <span className="mx-2">•</span>
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{profile.location}</span>
                    </>
                  )}
                </div>
              </div>

              {!isOwnProfile ? (
                <div className="flex space-x-2 mt-2 md:mt-0">
                  <Button
                    variant={profile.isFollowing ? "outline" : "pixel"}
                    onClick={handleFollow}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                  >
                    {profile.isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleMessage}
                    disabled={createChatMutation.isPending}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              ) : (
                <div className="mt-2 md:mt-0">
                  <Link href="/settings/profile">
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Bio */}
            <p className="text-foreground mb-4 max-w-3xl">{profile.bio}</p>

            {/* Social & Stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-3 mb-4 md:mb-0">
                {profile.social?.website && (
                  <a
                    href={`https://${profile.social.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    {profile.social.website}
                  </a>
                )}
                {profile.social?.twitter && (
                  <a
                    href={`https://twitter.com/${profile.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Twitter className="h-4 w-4 mr-1" />
                    @{profile.social.twitter}
                  </a>
                )}
                {profile.social?.github && (
                  <a
                    href={`https://github.com/${profile.social.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Github className="h-4 w-4 mr-1" />
                    {profile.social.github}
                  </a>
                )}
                {profile.social?.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${profile.social.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Linkedin className="h-4 w-4 mr-1" />
                    {profile.social.linkedin}
                  </a>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="font-semibold mr-1">{profile.stats.followers}</span>
                  <span className="text-muted-foreground text-sm">
                    Followers
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold mr-1">{profile.stats.following}</span>
                  <span className="text-muted-foreground text-sm">
                    Following
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Joined {formatDate(profile.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assets" className="mb-8">
          <TabsList className="border-b pb-0 mb-4 w-full flex justify-start">
            <TabsTrigger
              value="assets"
              className="pb-2 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-pixelshelf-primary"
              onClick={() => setActiveTab("assets")}
            >
              <Grid className="h-4 w-4 mr-2" />
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="pb-2 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-pixelshelf-primary"
              onClick={() => setActiveTab("projects")}
            >
              <FolderKanban className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            <div className="flex justify-end mb-4">
              <button className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <span>Recent</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>
            </div>
            
            {isLoadingAssets ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : assetsError ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">{assetsError instanceof Error ? assetsError.message : 'Failed to load assets'}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : assets.length > 0 ? (
              <div className="grid-masonry">
                {assets.map((asset: Asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No assets found.</p>
                {isOwnProfile && (
                  <Link href="/upload">
                    <Button variant="outline" className="mt-4">
                      Upload your first asset
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            {isLoadingProjects ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : projectsError ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">{projectsError instanceof Error ? projectsError.message : 'Failed to load projects'}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project: Project) => (
                  <ProjectCard
                    key={project.id}
                    project={{
                      id: project.id,
                      title: project.title,
                      description: project.description || '',
                      thumbnail: project.thumbnail || '',
                      assetCount: project.assetCount || 0,
                      createdAt: new Date(project.createdAt)
                    }}
                    username={profile.username || ''}
                  />
                ))}

                {isOwnProfile && (
                  <Link
                    href="/projects/new"
                    className="border-2 border-dashed rounded-lg border-muted hover:border-pixelshelf-primary p-6 flex flex-col items-center justify-center text-center min-h-[300px] transition-colors"
                  >
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <FolderKanban className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Create a New Project
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Organize your assets into a project to showcase your work
                    </p>
                  </Link>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No projects found.</p>
                {isOwnProfile && (
                  <Link href="/projects/new">
                    <Button variant="outline" className="mt-4">
                      Create your first project
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}