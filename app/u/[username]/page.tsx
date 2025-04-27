'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User, 
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
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssetCard from '@/components/feature-specific/asset-card';
import ProjectCard from '@/components/feature-specific/project-card';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Asset } from '@/types';

interface PageProps {
  params: {
    username: string;
  };
}

// Mock data for the MVP
const MOCK_USER = {
  id: '1',
  username: 'pixelartist',
  name: 'Alex Johnson',
  bio: 'Indie game developer and pixel artist. Creating retro-style games with modern gameplay. Currently working on my forest platformer "Woodland Warriors".',
  image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  bannerImage: 'https://images.unsplash.com/photo-1616031037011-287c29dd8ea2',
  location: 'San Francisco, CA',
  social: {
    twitter: 'pixelartist',
    github: 'pixeldev',
    website: 'pixelartist.dev',
    linkedin: 'alexjohnson',
  },
  followers: 342,
  following: 125,
  subscriptionTier: 'PREMIUM',
  createdAt: new Date('2023-01-15'),
  isPremium: true,
};

const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    title: 'Forest Tileset',
    description: 'A complete tileset for forest environments with 64x64 pixel art tiles.',
    fileUrl: 'https://images.unsplash.com/photo-1561735746-003319594ef0',
    fileType: 'IMAGE',
    projectId: null,
    userId: '1',
    isPublic: true,
    tags: ['forest', 'tileset', 'pixel art'],
    createdAt: new Date('2023-10-15'),
    updatedAt: new Date('2023-10-16'),
    user: {
      id: '1',
      name: 'Alex Johnson',
      username: 'pixelartist',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    },
    likes: 156,
    comments: 24,
    likedByUser: false,
  },
  {
    id: '2',
    title: 'Character Sprite Sheet',
    description: 'Main hero character with walking, running, and attack animations.',
    fileUrl: 'https://images.unsplash.com/photo-1633467067804-c08b17fd2a8a',
    fileType: 'IMAGE',
    projectId: null,
    userId: '1',
    isPublic: true,
    tags: ['character', 'spritesheet', 'pixel art'],
    createdAt: new Date('2023-10-12'),
    updatedAt: new Date('2023-10-13'),
    user: {
      id: '1',
      name: 'Alex Johnson',
      username: 'pixelartist',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    },
    likes: 243,
    comments: 43,
    likedByUser: false,
  },
  {
    id: '3',
    title: '8-Bit UI Elements',
    description: 'Comprehensive UI kit with buttons, panels, and icons in retro 8-bit style.',
    fileUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9',
    fileType: 'IMAGE',
    projectId: null,
    userId: '1',
    isPublic: true,
    tags: ['ui', '8-bit', 'interface'],
    createdAt: new Date('2023-10-20'),
    updatedAt: new Date('2023-10-21'),
    user: {
      id: '1',
      name: 'Alex Johnson',
      username: 'pixelartist',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    },
    likes: 89,
    comments: 12,
    likedByUser: false,
  },
];

const MOCK_PROJECTS = [
  {
    id: '1',
    title: 'Woodland Warriors',
    description: 'A 2D action platformer set in a mystical forest world with hand-crafted pixel art.',
    thumbnail: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1',
    assetCount: 28,
    createdAt: new Date('2023-05-12'),
  },
  {
    id: '2',
    title: 'Cosmic Drifter',
    description: 'Space exploration game with procedurally generated galaxies and retro-futuristic aesthetics.',
    thumbnail: 'https://images.unsplash.com/photo-1581822261290-991b38693d1b',
    assetCount: 15,
    createdAt: new Date('2023-08-22'),
  },
];

type Params = Promise<{ username: string }>;

export default function UserProfilePage({ params }: { params: Params }) {
  // unwrap the promised params
  const { username } = use(params);

  const { data: session } = useSession();
  const [user, setUser] = useState(MOCK_USER);
  const [activeTab, setActiveTab] = useState<"assets" | "projects">("assets");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(user.followers);

  const isOwnProfile =
    session?.user?.name?.toLowerCase() === username.toLowerCase();

  const handleFollow = () => {
    if (isFollowing) {
      setFollowerCount((c) => c - 1);
      toast.success(`Unfollowed ${user.name}`);
    } else {
      setFollowerCount((c) => c + 1);
      toast.success(`Following ${user.name}`);
    }
    setIsFollowing((f) => !f);
  };

  const handleMessage = () => {
    toast.success(`Started a chat with ${user.name}`);
  };

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-64 md:h-80 w-full bg-gradient-to-br from-pixelshelf-light to-pixelshelf-primary overflow-hidden">
        {user.bannerImage && (
          <Image
            src={user.bannerImage}
            alt={`${user.name}'s banner`}
            fill
            className="object-cover"
            priority
            {...(user.bannerImage.startsWith('data:') ? {
              placeholder: "blur",
              blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
            } : {})}
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
      <div className="container px-4 md:px-6 relative">
        <div className="flex flex-col md:flex-row -mt-24 md:-mt-16 mb-8">
          {/* Avatar */}
          <div className="relative mb-4 md:mb-0 md:mr-6">
            <div className="rounded-full overflow-hidden border-4 border-background h-32 w-32 md:h-48 md:w-48 bg-background relative">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  fill
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <User className="h-full w-full p-10 text-muted-foreground" />
              )}
            </div>
            {user.isPremium && (
              <div className="absolute bottom-2 right-2 bg-pixelshelf-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                PRO
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 pt-0 md:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <div className="flex items-center text-muted-foreground mb-2">
                  <span className="text-sm">@{user.username}</span>
                  {user.location && (
                    <>
                      <span className="mx-2">•</span>
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{user.location}</span>
                    </>
                  )}
                </div>
              </div>

              {!isOwnProfile ? (
                <div className="flex space-x-2 mt-2 md:mt-0">
                  <Button
                    variant={isFollowing ? "outline" : "pixel"}
                    onClick={handleFollow}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline" onClick={handleMessage}>
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
            <p className="text-foreground mb-4 max-w-3xl">{user.bio}</p>

            {/* Social & Stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-3 mb-4 md:mb-0">
                {user.social?.website && (
                  <a
                    href={`https://${user.social.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    {user.social.website}
                  </a>
                )}
                {user.social?.twitter && (
                  <a
                    href={`https://twitter.com/${user.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Twitter className="h-4 w-4 mr-1" />
                    @{user.social.twitter}
                  </a>
                )}
                {user.social?.github && (
                  <a
                    href={`https://github.com/${user.social.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Github className="h-4 w-4 mr-1" />
                    {user.social.github}
                  </a>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="font-semibold mr-1">{followerCount}</span>
                  <span className="text-muted-foreground text-sm">
                    Followers
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold mr-1">{user.following}</span>
                  <span className="text-muted-foreground text-sm">
                    Following
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Joined {formatDate(user.createdAt)}
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
            <div className="grid-masonry">
              {MOCK_ASSETS.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_PROJECTS.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  username={user.username}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}