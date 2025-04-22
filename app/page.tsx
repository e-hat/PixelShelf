'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { ArrowRight, Heart, MessageSquare, Share } from 'lucide-react';
import AssetCard from '@/components/feature-specific/asset-card';

// Temporary mock data for the MVP
const MOCK_TRENDING_ASSETS = [
  {
    id: '1',
    title: 'Forest Tileset',
    description: 'A complete tileset for forest environments with 64x64 pixel art tiles.',
    fileUrl: 'https://images.unsplash.com/photo-1561735746-003319594ef0',
    fileType: 'IMAGE',
    user: {
      name: 'PixelQueen',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    },
    likes: 156,
    comments: 24,
    createdAt: new Date('2023-10-15'),
  },
  {
    id: '2',
    title: 'Character Sprite Sheet',
    description: 'Main hero character with walking, running, and attack animations.',
    fileUrl: 'https://images.unsplash.com/photo-1633467067804-c08b17fd2a8a',
    fileType: 'IMAGE',
    user: {
      name: 'GameArtPro',
      image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
    },
    likes: 243,
    comments: 43,
    createdAt: new Date('2023-10-12'),
  },
  {
    id: '3',
    title: '8-Bit UI Elements',
    description: 'Comprehensive UI kit with buttons, panels, and icons in retro 8-bit style.',
    fileUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9',
    fileType: 'IMAGE',
    user: {
      name: 'RetroDevs',
      image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
    },
    likes: 89,
    comments: 12,
    createdAt: new Date('2023-10-20'),
  },
  {
    id: '4',
    title: 'Spaceship 3D Model',
    description: 'Low-poly spaceship model perfect for space shooters or exploration games.',
    fileUrl: 'https://images.unsplash.com/photo-1581822261290-991b38693d1b',
    fileType: 'MODEL_3D',
    user: {
      name: 'GalacticModeler',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
    },
    likes: 178,
    comments: 31,
    createdAt: new Date('2023-10-18'),
  },
  {
    id: '5',
    title: 'Dungeon Sound Effects',
    description: 'Pack of 20 atmospheric sound effects for dungeon levels.',
    fileUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
    fileType: 'AUDIO',
    user: {
      name: 'SoundScaper',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    },
    likes: 62,
    comments: 8,
    createdAt: new Date('2023-10-23'),
  },
  {
    id: '6',
    title: 'Boss Battle Theme',
    description: 'Epic orchestral boss battle music track for your game\'s climactic moments.',
    fileUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    fileType: 'AUDIO',
    user: {
      name: 'GameComposer',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
    },
    likes: 201,
    comments: 37,
    createdAt: new Date('2023-10-10'),
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<'trending' | 'following'>('trending');
  
  // For the MVP, we're just using static data
  // In a real app, we would fetch from an API based on the selected tab
  const assets = MOCK_TRENDING_ASSETS;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero section for non-logged in users */}
      {!session && (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-pixelshelf-light via-background to-pixelshelf-light">
          <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-8">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Your Game Dev Portfolio, <span className="text-pixelshelf-primary">Leveled Up</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-[85%] mx-auto">
                PixelShelf is where game developers build beautiful portfolios, share their work, and connect with the community.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button variant="pixel" size="lg" className="font-semibold">
                  Create Your Portfolio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg">
                  Explore Portfolios
                </Button>
              </Link>
            </div>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="flex flex-col items-center space-y-3 p-6 bg-background rounded-lg shadow-sm border">
                <div className="p-3 bg-pixelshelf-light rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pixelshelf-primary h-6 w-6">
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2zM10 4v4"></path>
                    <rect width="4" height="4" x="4" y="4" rx="1"></rect>
                    <rect width="4" height="4" x="4" y="12" rx="1"></rect>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Create Your Profile</h3>
                <p className="text-muted-foreground text-center">Upload your best work, write your bio, and link your socials.</p>
              </div>
              <div className="flex flex-col items-center space-y-3 p-6 bg-background rounded-lg shadow-sm border">
                <div className="p-3 bg-pixelshelf-light rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pixelshelf-primary h-6 w-6">
                    <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                    <path d="M3 9h18"></path>
                    <path d="M9 21V9"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Organize Projects</h3>
                <p className="text-muted-foreground text-center">Group your assets into projects to showcase complete games.</p>
              </div>
              <div className="flex flex-col items-center space-y-3 p-6 bg-background rounded-lg shadow-sm border">
                <div className="p-3 bg-pixelshelf-light rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pixelshelf-primary h-6 w-6">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Connect with Devs</h3>
                <p className="text-muted-foreground text-center">Follow creators, chat directly, and discover new collaborators.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main content */}
      <div className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            {session ? 'Your Feed' : 'Discover'}
          </h2>
          {session && (
            <div className="flex rounded-md overflow-hidden border">
              <button
                onClick={() => setTab('trending')}
                className={`px-4 py-2 text-sm font-medium ${
                  tab === 'trending' ? 'bg-pixelshelf-primary text-white' : 'bg-background'
                }`}
              >
                Trending
              </button>
              <button
                onClick={() => setTab('following')}
                className={`px-4 py-2 text-sm font-medium ${
                  tab === 'following' ? 'bg-pixelshelf-primary text-white' : 'bg-background'
                }`}
              >
                Following
              </button>
            </div>
          )}
        </div>

        {/* Grid of assets */}
        <div className="grid-masonry">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>

        {/* Show more button */}
        <div className="flex justify-center mt-8">
          <Button variant="outline">
            Load More
          </Button>
        </div>
      </div>
    </div>
  );
}