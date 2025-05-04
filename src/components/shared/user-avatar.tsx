// src/components/shared/user-avatar.tsx
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: {
    id?: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  };
  linkToProfile?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  isOnline?: boolean;
  isPremium?: boolean;
  className?: string;
}

export function UserAvatar({
  user,
  linkToProfile = true,
  size = 'md',
  showBadge = false,
  isOnline = false,
  isPremium = false,
  className,
}: UserAvatarProps) {
  if (!user) return null;
  
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  
  const iconSizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-4',
  };
  
  const avatar = (
    <div className={cn(
      `relative ${sizeClasses[size]} rounded-full overflow-hidden bg-muted`,
      className
    )}>
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name || 'User'}
          fill
          className="object-cover"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
          sizes="96px"
        />
      ) : (
        <User className={cn(`h-full w-full ${iconSizes[size]} text-muted-foreground`)} />
      )}
      
      {showBadge && (
        <>
          {isOnline && (
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
          )}
          {isPremium && (
            <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-pixelshelf-primary text-white text-[8px] font-bold ring-2 ring-white">
              PRO
            </span>
          )}
        </>
      )}
    </div>
  );
  
  if (linkToProfile && user.username) {
    return (
      <Link href={`/u/${user.username}`}>
        {avatar}
      </Link>
    );
  }
  
  return avatar;
}