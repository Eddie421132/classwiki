import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function OnlineIndicator({ isOnline, className, size = 'md' }: OnlineIndicatorProps) {
  if (!isOnline) return null;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'absolute rounded-full bg-green-500 border-2 border-background',
        'animate-pulse',
        sizeClasses[size],
        className
      )}
      title="在线"
    />
  );
}
