'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, GridIcon, LayoutList, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssetCard from '@/components/feature-specific/asset-card';
import { cn } from '@/lib/utils';
import { Asset } from '@/types';

// Search parameters component that uses useSearchParams
import { ExploreSearchParams } from './search-params';

// Mock data for MVP
const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    title: 'Forest Tileset',
    description: 'A complete tileset for forest environments with 64x64 pixel art tiles.',
    fileUrl: 'https://images.unsplash.com/photo-1561735746-003319594ef0',
    fileType: 'IMAGE',
    projectId: null,
    userId: 'user-1',
    isPublic: true,
    tags: ['forest', 'tileset', 'pixel-art', '2d', 'environment'],
    createdAt: new Date('2023-10-15'),
    updatedAt: new Date('2023-10-16'),
    user: {
      id: 'user-1',
      name: 'PixelQueen',
      username: 'pixelqueen',
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
    fileType: 'IMAGE',
    projectId: null,
    userId: 'user-2',
    isPublic: true,
    tags: ['character', 'sprite-sheet', 'pixel-art', 'animation', 'hero'],
    createdAt: new Date('2023-10-12'),
    updatedAt: new Date('2023-10-13'),
    user: {
      id: 'user-2',
      name: 'GameArtPro',
      username: 'gameartpro',
      image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
    },
    likes: 243,
    comments: 43,
  },
  {
    id: '3',
    title: '8-Bit UI Elements',
    description: 'Comprehensive UI kit with buttons, panels, and icons in retro 8-bit style.',
    fileUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9',
    fileType: 'IMAGE',
    projectId: null,
    userId: 'user-3',
    isPublic: true,
    tags: ['ui', '8-bit', 'retro', 'interface', 'buttons'],
    createdAt: new Date('2023-10-20'),
    updatedAt: new Date('2023-10-21'),
    user: {
      id: 'user-3',
      name: 'RetroDevs',
      username: 'retrodevs',
      image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
    },
    likes: 89,
    comments: 12,
  },
  {
    id: '4',
    title: 'Spaceship 3D Model',
    description: 'Low-poly spaceship model perfect for space shooters or exploration games.',
    fileUrl: 'https://images.unsplash.com/photo-1581822261290-991b38693d1b',
    fileType: 'MODEL_3D',
    projectId: null,
    userId: 'user-4',
    isPublic: true,
    tags: ['3d', 'spaceship', 'low-poly', 'sci-fi', 'model'],
    createdAt: new Date('2023-10-18'),
    updatedAt: new Date('2023-10-19'),
    user: {
      id: 'user-4',
      name: 'GalacticModeler',
      username: 'galacticmodeler',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
    },
    likes: 178,
    comments: 31,
  },
  {
    id: '5',
    title: 'Dungeon Sound Effects',
    description: 'Pack of 20 atmospheric sound effects for dungeon levels.',
    fileUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
    fileType: 'AUDIO',
    projectId: null,
    userId: 'user-5',
    isPublic: true,
    tags: ['audio', 'sound-effects', 'dungeon', 'atmosphere', 'fantasy'],
    createdAt: new Date('2023-10-23'),
    updatedAt: new Date('2023-10-24'),
    user: {
      id: 'user-5',
      name: 'SoundScaper',
      username: 'soundscaper',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    },
    likes: 62,
    comments: 8,
  },
  {
    id: '6',
    title: 'Boss Battle Theme',
    description: 'Epic orchestral boss battle music track for your game\'s climactic moments.',
    fileUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    fileType: 'AUDIO',
    projectId: null,
    userId: 'user-6',
    isPublic: true,
    tags: ['audio', 'music', 'boss-battle', 'orchestral', 'epic'],
    createdAt: new Date('2023-10-10'),
    updatedAt: new Date('2023-10-11'),
    user: {
      id: 'user-6',
      name: 'GameComposer',
      username: 'gamecomposer',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
    },
    likes: 201,
    comments: 37,
  },
  {
    id: '7',
    title: 'Modular Dungeon Kit',
    description: 'Complete set of modular dungeon pieces for building diverse game levels.',
    fileUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d',
    fileType: 'IMAGE',
    projectId: null,
    userId: 'user-7',
    isPublic: true,
    tags: ['dungeon', 'modular', 'tileset', 'level-design', '3d'],
    createdAt: new Date('2023-10-05'),
    updatedAt: new Date('2023-10-06'),
    user: {
      id: 'user-7',
      name: 'DungeonMaster',
      username: 'dungeonmaster',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    },
    likes: 315,
    comments: 52,
  },
  {
    id: '8',
    title: 'Pixel Weather Effects',
    description: 'Collection of rain, snow, fog and other weather effects in pixel art style.',
    fileUrl: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d',
    fileType: 'IMAGE',
    projectId: null,
    userId: 'user-8',
    isPublic: true,
    tags: ['weather', 'effects', 'pixel-art', 'animation', 'particles'],
    createdAt: new Date('2023-10-14'),
    updatedAt: new Date('2023-10-15'),
    user: {
      id: 'user-8',
      name: 'PixelStorm',
      username: 'pixelstorm',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    },
    likes: 127,
    comments: 19,
  },
];


const MOCK_CREATORS = [
  {
    id: '1',
    name: 'PixelQueen',
    username: 'pixelqueen',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    bio: 'Pixel artist specializing in environment art and tilesets',
    followerCount: 1250,
    assetCount: 47,
    tags: ['pixel-art', 'environments', 'tilesets'],
  },
  {
    id: '2',
    name: 'GameArtPro',
    username: 'gameartpro',
    image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
    bio: 'Professional game artist with 10+ years experience in character design',
    followerCount: 3420,
    assetCount: 129,
    tags: ['character-design', 'animation', '3d-modeling'],
  },
  {
    id: '3',
    name: 'RetroDevs',
    username: 'retrodevs',
    image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
    bio: 'Creating authentic retro game assets inspired by the 8-bit and 16-bit eras',
    followerCount: 876,
    assetCount: 63,
    tags: ['retro', '8-bit', '16-bit', 'pixel-art'],
  },
  {
    id: '4',
    name: 'GalacticModeler',
    username: 'galacticmodeler',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
    bio: 'Sci-fi 3D models and environments for space-themed games',
    followerCount: 754,
    assetCount: 38,
    tags: ['3d-modeling', 'sci-fi', 'space', 'low-poly'],
  },
  {
    id: '5',
    name: 'SoundScaper',
    username: 'soundscaper',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    bio: 'Sound designer and foley artist creating immersive game audio',
    followerCount: 521,
    assetCount: 85,
    tags: ['audio', 'sound-effects', 'ambient', 'music'],
  },
  {
    id: '6',
    name: 'GameComposer',
    username: 'gamecomposer',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
    bio: 'Composer specializing in orchestral and chiptune game soundtracks',
    followerCount: 1879,
    assetCount: 112,
    tags: ['music', 'soundtrack', 'orchestral', 'chiptune'],
  },
];

const POPULAR_TAGS = [
  'pixel-art',
  '3d-models',
  'characters',
  'environments',
  'ui',
  'sound-effects',
  'music',
  'animations',
  'tilesets',
  'sprites',
  'vfx',
  'low-poly',
  'retro',
  'sci-fi',
  'fantasy',
];

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('assets');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [filteredAssets, setFilteredAssets] = useState(MOCK_ASSETS);
  const [filteredCreators, setFilteredCreators] = useState(MOCK_CREATORS);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore</h1>
          <p className="text-muted-foreground">
            Discover game assets and connect with talented game developers
          </p>
        </div>
        
        {/* Wrap the component that uses useSearchParams in a Suspense boundary */}
        <Suspense fallback={<div>Loading search parameters...</div>}>
          <ExploreSearchParams 
            setSearchQuery={setSearchQuery}
            setSelectedTags={setSelectedTags}
            setSelectedType={setSelectedType}
            setActiveTab={setActiveTab}
            applyFilters={(query, tags, type) => {
              // Filter assets
              let assets = MOCK_ASSETS;
              
              if (query) {
                const lowerQuery = query.toLowerCase();
                assets = assets.filter(asset => 
                  asset.title.toLowerCase().includes(lowerQuery) || 
                  asset.description?.toLowerCase().includes(lowerQuery) ||
                  asset.user.name?.toLowerCase().includes(lowerQuery)
                );
              }
              
              if (tags.length > 0) {
                assets = assets.filter(asset => 
                  asset.tags.some(tag => tags.includes(tag))
                );
              }
              
              if (type) {
                assets = assets.filter(asset => asset.fileType === type);
              }
              
              setFilteredAssets(assets);
              
              // Filter creators
              let creators = MOCK_CREATORS;
              
              if (query) {
                const lowerQuery = query.toLowerCase();
                creators = creators.filter(creator => 
                  creator.name.toLowerCase().includes(lowerQuery) || 
                  creator.username.toLowerCase().includes(lowerQuery) || 
                  creator.bio.toLowerCase().includes(lowerQuery)
                );
              }
              
              if (tags.length > 0) {
                creators = creators.filter(creator => 
                  creator.tags.some(tag => tags.includes(tag))
                );
              }
              
              setFilteredCreators(creators);
            }}
          />
        </Suspense>
        
        {/* Search and filters */}
        <div className="space-y-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            
            // Update URL with search params
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (selectedTags.length > 0) params.set('tag', selectedTags[0]);
            if (selectedType) params.set('type', selectedType);
            params.set('tab', activeTab);
            
            router.push(`/explore?${params.toString()}`);
            
            // Apply filters
            const tags = selectedTags;
            const type = selectedType;
            
            // Filter assets
            let assets = MOCK_ASSETS;
            
            if (searchQuery) {
              const lowerQuery = searchQuery.toLowerCase();
              assets = assets.filter(asset => 
                asset.title.toLowerCase().includes(lowerQuery) || 
                asset.description?.toLowerCase().includes(lowerQuery) ||
                asset.user.name?.toLowerCase().includes(lowerQuery)
              );
            }
            
            if (tags.length > 0) {
              assets = assets.filter(asset => 
                asset.tags.some(tag => tags.includes(tag))
              );
            }
            
            if (type) {
              assets = assets.filter(asset => asset.fileType === type);
            }
            
            setFilteredAssets(assets);
            
            // Filter creators
            let creators = MOCK_CREATORS;
            
            if (searchQuery) {
              const lowerQuery = searchQuery.toLowerCase();
              creators = creators.filter(creator => 
                creator.name.toLowerCase().includes(lowerQuery) || 
                creator.username.toLowerCase().includes(lowerQuery) || 
                creator.bio.toLowerCase().includes(lowerQuery)
              );
            }
            
            if (tags.length > 0) {
              creators = creators.filter(creator => 
                creator.tags.some(tag => tags.includes(tag))
              );
            }
            
            setFilteredCreators(creators);
          }} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search assets, creators, or tags..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-muted' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button type="submit">Search</Button>
          </form>
          
          {/* Filters panel */}
          {showFilters && (
            <div className="border rounded-lg p-4 shadow-sm space-y-4">
              <div>
                <h3 className="font-medium mb-2">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm transition-colors",
                        selectedTags.includes(tag) 
                          ? "bg-pixelshelf-primary text-white" 
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Asset Type</h3>
                <div className="flex flex-wrap gap-2">
                  {['IMAGE', 'MODEL_3D', 'AUDIO', 'DOCUMENT'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(selectedType === type ? null : type)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm transition-colors",
                        selectedType === type 
                          ? "bg-pixelshelf-primary text-white" 
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
          
          {/* Selected filters display */}
          {(selectedTags.length > 0 || selectedType) && (
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedTags.map((tag) => (
                <div 
                  key={tag} 
                  className="flex items-center bg-pixelshelf-light text-pixelshelf-primary px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                  <button 
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    className="ml-1 hover:text-pixelshelf-dark"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {selectedType && (
                <div className="flex items-center bg-pixelshelf-light text-pixelshelf-primary px-3 py-1 rounded-full text-sm">
                  {selectedType.replace('_', ' ')}
                  <button 
                    onClick={() => setSelectedType(null)}
                    className="ml-1 hover:text-pixelshelf-dark"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <button 
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        
        {/* Tabs and view toggle */}
        <div className="flex justify-between items-center">
          <Tabs 
            defaultValue={activeTab} 
            onValueChange={(value: string) => {
              setActiveTab(value);
              
              // Update URL
              const params = new URLSearchParams();
              if (searchQuery)      params.set('q', searchQuery);
              if (selectedTags[0])  params.set('tag', selectedTags[0]);
              if (selectedType)     params.set('type', selectedType);
              params.set('tab', value);
              router.push(`/explore?${params.toString()}`);
            }}
          >
            <TabsList>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="creators">Creators</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex rounded-md overflow-hidden border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-muted' : 'bg-background'}`}
              title="Grid view"
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-muted' : 'bg-background'}`}
              title="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div>
          {activeTab === 'assets' ? (
            <>
              {filteredAssets.length > 0 ? (
                <div className={viewMode === 'grid' ? 'grid-masonry' : 'space-y-4'}>
                  {filteredAssets.map((asset) => (
                    <AssetCard 
                      key={asset.id} 
                      asset={asset} 
                      variant={viewMode === 'list' ? 'horizontal' : 'vertical'} 
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No assets found matching your search.</p>
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {filteredCreators.length > 0 ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredCreators.map((creator) => (
                    <Link 
                      key={creator.id} 
                      href={`/u/${creator.username}`}
                      className={cn(
                        "block border rounded-lg overflow-hidden hover:shadow-md transition-shadow",
                        viewMode === 'list' ? 'flex items-center p-4' : ''
                      )}
                    >
                      {viewMode === 'grid' ? (
                        <div className="p-6 text-center">
                          <div className="mx-auto mb-4 relative h-24 w-24 rounded-full overflow-hidden bg-muted">
                            {creator.image ? (
                              <Image 
                                src={creator.image} 
                                alt={creator.name} 
                                fill 
                                className="object-cover" 
                              />
                            ) : (
                              <User className="h-24 w-24 p-6 text-muted-foreground" />
                            )}
                          </div>
                          <h3 className="font-medium text-lg mb-1">{creator.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">@{creator.username}</p>
                          <p className="text-sm mb-4 line-clamp-2">{creator.bio}</p>
                          <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                            <span>{creator.followerCount} followers</span>
                            <span>{creator.assetCount} assets</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-shrink-0 mr-4 relative h-16 w-16 rounded-full overflow-hidden bg-muted">
                            {creator.image ? (
                              <Image 
                                src={creator.image} 
                                alt={creator.name} 
                                fill 
                                className="object-cover" 
                              />
                            ) : (
                              <User className="h-16 w-16 p-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-1">{creator.name}</h3>
                            <p className="text-sm text-muted-foreground mb-1">@{creator.username}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{creator.bio}</p>
                          </div>
                          <div className="flex-shrink-0 ml-4 text-sm text-muted-foreground">
                            <div>{creator.followerCount} followers</div>
                            <div>{creator.assetCount} assets</div>
                          </div>
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No creators found matching your search.</p>
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
  
  // Helper function to toggle tag selection
  function toggleTag(tag: string) {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
  }
  
  // Helper function to clear filters
  function clearFilters() {
    setSelectedTags([]);
    setSelectedType(null);
    setSearchQuery('');
    
    // Update URL
    router.push('/explore');
    
    // Reset to all assets/creators
    setFilteredAssets(MOCK_ASSETS);
    setFilteredCreators(MOCK_CREATORS);
  }
}