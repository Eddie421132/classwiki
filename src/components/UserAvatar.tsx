import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnlineIndicator } from '@/components/OnlineIndicator';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  userId: string;
  avatarUrl?: string | null;
  fallback?: string;
  className?: string;
  showOnlineStatus?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function UserAvatar({ 
  userId, 
  avatarUrl, 
  fallback, 
  className,
  showOnlineStatus = true,
  size = 'md'
}: UserAvatarProps) {
  const onlineUserIds = useOnlineUsers();
  const isOnline = onlineUserIds.has(userId);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-24 w-24',
  };

  const indicatorSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
    xl: 'lg' as const,
  };

  return (
    <div className="relative inline-flex flex-shrink-0">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={avatarUrl || ''} />
        <AvatarFallback>
          {fallback ? fallback.charAt(0) : <User className="w-1/2 h-1/2" />}
        </AvatarFallback>
      </Avatar>
      {showOnlineStatus && (
        <OnlineIndicator 
          isOnline={isOnline} 
          size={indicatorSizes[size]} 
          className="-bottom-0.5 -right-0.5"
        />
      )}
    </div>
  );
}
