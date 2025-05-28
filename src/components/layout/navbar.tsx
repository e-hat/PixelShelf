'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/feature-specific/user-avatar';
import { 
  User, 
  MessageSquare, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  Home, 
  Search, 
  Upload, 
  FolderPlus,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store';
import { NotificationBell } from '../feature-specific/notification-bell';

const Navbar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const hasNewMessages = useNotificationStore(state => state.hasNewMessages);

  // Track scroll position to add shadow to navbar
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Search },
    { name: 'Upload', href: '/upload', icon: Upload, requiresAuth: true },
    { name: 'New Project', href: '/projects/new', icon: FolderPlus, requiresAuth: true }
  ];

  // Filter items that require authentication if user is not logged in
  const filteredNavItems = navItems.filter(item => 
    !item.requiresAuth || status === 'authenticated'
  );

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border transition-shadow duration-200",
      hasScrolled && "shadow-sm"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 bg-pixelshelf-primary rounded-sm"></div>
                  <div className="absolute inset-0 border-2 border-pixelshelf-dark rounded-sm"></div>
                </div>
                <span className="text-xl font-bold text-pixelshelf-primary">PixelShelf</span>
              </Link>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {/* Navigation links */}
            <div className="flex items-center space-x-4">
              {filteredNavItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors flex items-center",
                    pathname === item.href 
                      ? "text-pixelshelf-primary" 
                      : "text-foreground hover:text-pixelshelf-primary"
                  )}
                >
                  <item.icon className="mr-1 h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* User section */}
            {session ? (
              <div className="flex items-center space-x-4">
                <NotificationBell className="relative" />
                
                <Link 
                  href="/chat" 
                  className={cn(
                    "relative text-foreground hover:text-pixelshelf-primary",
                    pathname?.startsWith('/chat') && "text-pixelshelf-primary"
                  )}
                >
                  <MessageSquare className="h-5 w-5" />
                  {hasNewMessages && (
                    <span className="absolute -top-1 -right-1 bg-pixelshelf-primary text-white rounded-full w-2 h-2" />
                  )}
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-1 focus:outline-none" aria-label="User menu">
                      <UserAvatar 
                        user={session.user} 
                        size="sm" 
                        showBadge 
                        isPremium={session.user.subscriptionTier === 'PREMIUM'} 
                      />
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="font-medium">{session.user.name}</p>
                        <p className="text-xs text-muted-foreground">@{session.user.username || 'username'}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/u/${session.user.username || session.user.name}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings/profile">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="outline" size="sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="pixel" size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  pathname === item.href
                    ? "bg-pixelshelf-light text-pixelshelf-primary"
                    : "text-foreground hover:bg-muted"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
          {session ? (
            <div className="pt-4 pb-3 border-t border-border">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <UserAvatar 
                    user={session.user}
                    size="md"
                    showBadge
                    isPremium={session.user.subscriptionTier === 'PREMIUM'}
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-foreground">{session.user.name}</div>
                  <div className="text-sm font-medium text-muted-foreground">{session.user.email}</div>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                  <NotificationBell />
                  <Link href="/chat" className="text-gray-400 hover:text-gray-300">
                    <MessageSquare className="h-6 w-6" />
                  </Link>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link 
                  href={`/u/${session.user.username || session.user.name}`}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Profile
                  </div>
                </Link>
                <Link 
                  href="/settings/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Settings
                  </div>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
                >
                  <div className="flex items-center">
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign out
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-border px-5 flex flex-col space-y-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Log in</Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="pixel" className="w-full">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;