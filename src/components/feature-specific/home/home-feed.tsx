'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  UserCheck, 
  Plus, 
  Upload, 
  Star, 
  Users, 
  TagIcon, 
  Clock, 
  RefreshCw,
  ArrowUpRight, 
  Bell, 
  FileText, 
  FolderKanban
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DashboardFeed, TabOption } from '@/components/feature-specific/dashboard-feed';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api/api-client';
import { Asset, UserProfile } from '@/types';
import { formatDate } from '@/lib/utils';
import { HomeFeedSkeleton } from './home-feed-skeleton';

export default function HomeFeed() {
  const { data: session } = useSession();
  const [trendingCreators, setTrendingCreators] = useState<UserProfile[]>([]);
  const [popularTags, setPopularTags] = useState<{name: string, count: number}[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showSidecards, setShowSidecards] = useState(true);
  const [layoutClass, setLayoutClass] = useState('show-sidecards');
  
  // Fetch sidebar data
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch trending creators using the API method
        const creatorsResponse = await api.users.getTrendingCreators(3);
        setTrendingCreators(creatorsResponse.users || []);
        
        // For popular tags, we'll simulate this with static data for now
        setPopularTags([
          { name: 'pixel-art', count: 253 },
          { name: '3d-models', count: 187 },
          { name: 'gamedev', count: 165 },
          { name: 'vfx', count: 122 },
          { name: 'unity', count: 98 },
        ]);
        
        // For recent activity, we'll simulate this with static data
        setRecentActivity([
          { type: 'like', user: 'Jane Cooper', content: 'liked your project "Pixel RPG Assets"', time: '2h ago' },
          { type: 'follow', user: 'Alex Johnson', content: 'started following you', time: '4h ago' },
          { type: 'comment', user: 'Mark Stevens', content: 'commented on your asset "Forest Tileset"', time: '1d ago' },
        ]);
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSidebarData();
  }, []);
  
  // Handle view mode changes
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    
    if (mode === 'list') {
      // First set the correct class to trigger animations
      setLayoutClass('show-sidecards');
      // Then update the state
      setShowSidecards(true);
    } else {
      // First set the correct class to trigger animations
      setLayoutClass('hide-sidecards');
      // Then update the state
      setTimeout(() => {
        setShowSidecards(false);
      }, 300); // Wait for animation to complete
    }
  };
  
  const homeTabs: TabOption[] = [
    {
      id: 'trending',
      label: 'Trending',
      icon: <TrendingUp className="mr-2 h-4 w-4" />,
    },
    {
      id: 'following',
      label: 'Following',
      icon: <UserCheck className="mr-2 h-4 w-4" />,
      requiredAuth: true,
    },
  ];

  // Empty state component for the Following tab when user isn't following anyone
  const EmptyFollowingState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mb-4">
        <UserCheck className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Nothing in your feed yet</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Follow some creators to see their latest work in your feed.
      </p>
      <Link href="/explore">
        <Button variant="pixel">Discover Creators</Button>
      </Link>
    </div>
  );

  // Left sidebar: User profile card and quick actions
  const LeftSidebar = () => (
    <div className="home-feed-sidebar left-sidebar">
      {/* Profile Card */}
      {session?.user && (
        <div className="sidebar-card flex flex-col items-center text-center mb-4">
          <UserAvatar 
            user={session.user}
            size="xl"
            className="mb-4"
          />
          <h3 className="font-semibold text-lg">{session.user.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">@{session.user.username}</p>
          
          <div className="flex justify-around w-full mb-4">
            <div className="text-center">
              <p className="font-semibold">0</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">0</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">0</p>
              <p className="text-xs text-muted-foreground">Assets</p>
            </div>
          </div>
          
          <Link href={`/u/${session.user.username}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full">
              View Profile
            </Button>
          </Link>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="sidebar-card">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Link href="/upload" className="flex items-center p-2 hover:bg-muted rounded-md transition-colors">
            <Upload className="h-4 w-4 mr-2 text-pixelshelf-primary" />
            <span>Upload New Asset</span>
          </Link>
          <Link href="/projects/new" className="flex items-center p-2 hover:bg-muted rounded-md transition-colors">
            <FolderKanban className="h-4 w-4 mr-2 text-pixelshelf-primary" />
            <span>Create Project</span>
          </Link>
          <Link href="/notifications" className="flex items-center p-2 hover:bg-muted rounded-md transition-colors">
            <Bell className="h-4 w-4 mr-2 text-pixelshelf-primary" />
            <span>View Notifications</span>
          </Link>
          <Link href="/explore" className="flex items-center p-2 hover:bg-muted rounded-md transition-colors">
            <Users className="h-4 w-4 mr-2 text-pixelshelf-primary" />
            <span>Discover Creators</span>
          </Link>
        </div>
      </div>
      
      {/* Popular Tags */}
      <div className="sidebar-card">
        <h3 className="font-semibold mb-3">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map(tag => (
            <Link 
              key={tag.name} 
              href={`/search?tag=${tag.name}`}
              className="text-xs bg-muted hover:bg-accent px-2 py-1 rounded-full transition-colors"
            >
              #{tag.name}
              <span className="ml-1 text-muted-foreground">({tag.count})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Right sidebar: Trending creators, recent activity
  const RightSidebar = () => (
    <div className="home-feed-sidebar right-sidebar">
      {/* Trending Creators */}
      <div className="sidebar-card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Trending Creators</h3>
          <Link href="/explore?tab=creators" className="text-xs text-pixelshelf-primary hover:underline flex items-center">
            See all
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {trendingCreators.map(creator => (
            <Link 
              key={creator.id} 
              href={`/u/${creator.username}`}
              className="flex items-center p-2 hover:bg-muted rounded-md transition-colors"
            >
              <UserAvatar user={creator} size="sm" />
              <div className="ml-3 flex-1 min-w-0">
                <p className="font-medium text-sm">{creator.name}</p>
                <p className="text-xs text-muted-foreground truncate">@{creator.username}</p>
              </div>
              <Button size="sm" variant="outline" className="ml-2 text-xs h-8">
                Follow
              </Button>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="sidebar-card">
        <h3 className="font-semibold mb-3">Recent Activity</h3>
        
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity to show
          </p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start">
                <div className="rounded-full bg-muted p-2 mr-3">
                  {activity.type === 'like' && <Star className="h-3 w-3" />}
                  {activity.type === 'follow' && <UserCheck className="h-3 w-3" />}
                  {activity.type === 'comment' && <FileText className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight">
                    <span className="font-medium">{activity.user}</span> {activity.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="text-xs text-muted-foreground mt-6 px-2">
        <div className="flex flex-wrap gap-2 mb-2">
          <Link href="/about" className="hover:text-foreground">About</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <span>•</span>
          <Link href="/help" className="hover:text-foreground">Help</Link>
        </div>
        <p>© {new Date().getFullYear()} PixelShelf</p>
      </div>
    </div>
  );

  return (
    <div className="container px-4 py-8">
      <PageHeader
        title="Your Feed"
        description="Discover trending assets or see the latest from creators you follow"
      />
      
      {isLoading ? (
        <HomeFeedSkeleton />
      ) : (
        <div className={`home-feed-layout ${layoutClass}`}>
          {/* Left Sidebar */}
          <LeftSidebar />
          
          {/* Main Feed */}
          <div className="home-feed-main">
            <DashboardFeed 
              initialTab={session ? "trending" : "following"} 
              tabs={homeTabs}
              infiniteScroll={true}
              emptyFollowingComponent={<EmptyFollowingState />}
              itemsPerRow={viewMode === 'grid' ? 4 : 1} // 1 in list mode, 4 in grid mode
              showSidecards={showSidecards}
              defaultViewMode={viewMode}
              listViewFirst={true} // List view button first
              onViewModeChange={handleViewModeChange}
            />
          </div>
          
          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      )}
    </div>
  );
}