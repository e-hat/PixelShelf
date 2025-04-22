'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, 
  CreditCard, 
  Lock, 
  Bell, 
  HelpCircle, 
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: User,
    description: 'Manage your personal information and how others see you',
  },
  {
    title: 'Subscription',
    href: '/settings/subscription',
    icon: CreditCard,
    description: 'Manage your subscription plan and billing settings',
  },
  {
    title: 'Account',
    href: '/settings/account',
    icon: Lock,
    description: 'Manage your account security and privacy settings',
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Configure how you receive notifications',
  },
  {
    title: 'Help & Support',
    href: '/settings/support',
    icon: HelpCircle,
    description: 'Get help with PixelShelf or contact support',
  },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar navigation */}
        <aside className="md:w-64 flex-shrink-0">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-pixelshelf-light text-pixelshelf-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    isActive ? "text-pixelshelf-primary" : "text-muted-foreground"
                  )} />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4",
                    isActive ? "text-pixelshelf-primary" : "text-muted-foreground"
                  )} />
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}