// src/components/feature-specific/home/home-feed-skeleton.tsx

import { Skeleton } from "@/components/ui/skeleton-loader";

export function HomeFeedSkeleton() {
  return (
    <div className="home-feed-layout">
      {/* Left Sidebar Skeleton */}
      <div className="home-feed-sidebar">
        <div className="sidebar-card flex flex-col items-center text-center mb-4">
          <Skeleton className="h-16 w-16 rounded-full mb-4" />
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24 mb-4" />
          
          <div className="flex justify-around w-full mb-4">
            <div className="text-center">
              <Skeleton className="h-4 w-8 mb-1 mx-auto" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="text-center">
              <Skeleton className="h-4 w-8 mb-1 mx-auto" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="text-center">
              <Skeleton className="h-4 w-8 mb-1 mx-auto" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          
          <Skeleton className="h-8 w-full" />
        </div>
        
        <div className="sidebar-card mb-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center p-2">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="sidebar-card">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Feed Skeleton */}
      <div className="home-feed-main">
        <div className="flex justify-between items-center mb-4">
          <div className="flex">
            <Skeleton className="h-10 w-24 mr-4" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6">
            <div className="border rounded-lg p-4">
              <Skeleton className="w-full aspect-video mb-4 rounded-lg" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full mr-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Right Sidebar Skeleton */}
      <div className="home-feed-sidebar">
        <div className="sidebar-card mb-4">
          <div className="flex justify-between items-center mb-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-2 mb-3">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-16 ml-2" />
            </div>
          ))}
        </div>
        
        <div className="sidebar-card">
          <Skeleton className="h-5 w-32 mb-3" />
          
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start mb-3">
              <Skeleton className="h-8 w-8 rounded-full mr-3" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}