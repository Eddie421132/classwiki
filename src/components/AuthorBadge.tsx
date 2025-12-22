import { Badge } from '@/components/ui/badge';
import { Shield, PenTool } from 'lucide-react';

interface AuthorBadgeProps {
  role?: 'admin' | 'editor' | null;
  size?: 'sm' | 'md';
}

export function AuthorBadge({ role, size = 'sm' }: AuthorBadgeProps) {
  if (!role) return null;

  const isAdmin = role === 'admin';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const badgeSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <Badge 
      variant={isAdmin ? 'default' : 'secondary'} 
      className={`gap-1 ${badgeSize} shrink-0`}
    >
      {isAdmin ? (
        <>
          <Shield className={iconSize} />
          管理员
        </>
      ) : (
        <>
          <PenTool className={iconSize} />
          编者
        </>
      )}
    </Badge>
  );
}
