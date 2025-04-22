import Image from 'next/image';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { User, MessageSquare, Bell, Menu, X, LogOut, Settings, Home, Search, Upload, FolderPlus } from 'lucide-react';
import { useState } from 'react';
import NotificationIndicator from '../feature-specific/notification-indicator';

const Navbar = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Search },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'New Project', href: '/projects/new', icon: FolderPlus }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
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
              {navItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="text-sm text-foreground hover:text-pixelshelf-primary transition-colors flex items-center"
                >
                  <item.icon className="mr-1 h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* User section */}
            {session ? (
              <div className="flex items-center space-x-4">
                <Link href="/notifications" className="relative text-foreground hover:text-pixelshelf-primary">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-pixelshelf-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                    3
                  </span>
                </Link>
                <Link href="/chat" className="text-foreground hover:text-pixelshelf-primary">
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-1">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-pixelshelf-light border border-pixelshelf-primary">
                      {session.user?.image ? (
                        <Image 
                          src={session.user.image} 
                          alt={session.user.name || 'User'} 
                          width={32} 
                          height={32} 
                        />
                      ) : (
                        <User className="h-5 w-5 m-1.5 text-pixelshelf-primary" />
                      )}
                    </div>
                  </button>
                  <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block">
                    <div className="py-1">
                      <Link 
                        href={`/u/${session.user?.name}`} 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Profile
                      </Link>
                      <Link 
                        href="/settings" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Settings
                      </Link>
                      <button 
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
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
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-pixelshelf-light hover:text-pixelshelf-primary"
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
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-pixelshelf-light border border-pixelshelf-primary">
                    {session.user?.image ? (
                      <Image 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        width={40} 
                        height={40} 
                      />
                    ) : (
                      <User className="h-6 w-6 m-2 text-pixelshelf-primary" />
                    )}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-foreground">{session.user?.name}</div>
                  <div className="text-sm font-medium text-muted-foreground">{session.user?.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link 
                  href={`/u/${session.user?.name}`}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-pixelshelf-light hover:text-pixelshelf-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Profile
                  </div>
                </Link>
                <Link 
                  href="/settings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-pixelshelf-light hover:text-pixelshelf-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Settings
                  </div>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-pixelshelf-light hover:text-pixelshelf-primary"
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
      <NotificationIndicator />
    </nav>
  );
};

export default Navbar;