import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  isOnline?: boolean;
  isPremium?: boolean;
}

export function UserAvatar({
  user,
  className,
  size = "md",
  showBadge = false,
  isOnline = false,
  isPremium = false,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  const fallbackSize = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-8 w-8",
    xl: "h-10 w-10",
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
        <AvatarFallback>
          {user.name ? (
            getInitials(user.name)
          ) : (
            <User className={fallbackSize[size]} />
          )}
        </AvatarFallback>
      </Avatar>

      {showBadge && (
        <>
          {isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
          )}
          {isPremium && (
            <div className="absolute -bottom-1 -right-1 bg-pixelshelf-primary text-white text-xs px-1.5 py-0.5 rounded-full text-[10px] font-bold border border-background">
              PRO
            </div>
          )}
        </>
      )}
    </div>
  );
}