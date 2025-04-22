import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define store types
interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Recently viewed assets
  recentlyViewedAssets: RecentAsset[];
  addRecentlyViewedAsset: (asset: RecentAsset) => void;
  clearRecentlyViewedAssets: () => void;
  
  // User preferences
  preferences: UserPreferences;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Search history
  searchHistory: string[];
  addSearchTerm: (term: string) => void;
  clearSearchHistory: () => void;
}

interface RecentAsset {
  id: string;
  title: string;
  imageUrl: string;
  timestamp: number;
}

interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  gridViewMode: 'grid' | 'list';
  assetSortPreference: 'latest' | 'popular' | 'oldest';
}

// Create the store
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme state
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // Recently viewed assets state
      recentlyViewedAssets: [],
      addRecentlyViewedAsset: (asset) => 
        set((state) => {
          // Remove if it already exists (to avoid duplicates)
          const filtered = state.recentlyViewedAssets.filter(a => a.id !== asset.id);
          
          // Add to the beginning of the array
          return { 
            recentlyViewedAssets: [asset, ...filtered].slice(0, 10) // Keep only 10 most recent
          };
        }),
      clearRecentlyViewedAssets: () => set({ recentlyViewedAssets: [] }),
      
      // User preferences state
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        gridViewMode: 'grid',
        assetSortPreference: 'latest',
      },
      updatePreferences: (newPreferences) => 
        set((state) => ({ 
          preferences: { ...state.preferences, ...newPreferences } 
        })),
      
      // Search history state
      searchHistory: [],
      addSearchTerm: (term) => 
        set((state) => {
          // Don't add empty or duplicate terms
          if (!term.trim() || state.searchHistory.includes(term)) {
            return state;
          }
          
          // Add to the beginning of the array
          return { 
            searchHistory: [term, ...state.searchHistory].slice(0, 20) // Keep only 20 most recent
          };
        }),
      clearSearchHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: 'pixelshelf-storage',
      partialize: (state) => ({
        theme: state.theme,
        recentlyViewedAssets: state.recentlyViewedAssets,
        preferences: state.preferences,
        searchHistory: state.searchHistory,
      }),
    }
  )
);

// Define notification store types
interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number | ((prev: number) => number)) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (count?: number) => void;
  resetUnreadCount: () => void;
  
  hasNewMessages: boolean;
  setHasNewMessages: (value: boolean) => void;
}

// Create notification store
export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (countOrUpdater) =>
    set((state) => ({
      unreadCount: typeof countOrUpdater === 'function'
        ? countOrUpdater(state.unreadCount)
        : countOrUpdater,
    })),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnreadCount: (count = 1) => 
    set((state) => ({ 
      unreadCount: Math.max(0, state.unreadCount - count) 
    })),
  resetUnreadCount: () => set({ unreadCount: 0 }),
  
  hasNewMessages: false,
  setHasNewMessages: (value) => set({ hasNewMessages: value }),
}));