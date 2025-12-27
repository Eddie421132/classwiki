import { Badge } from '@/components/ui/badge';
import { Shield, PenTool, ShieldCheck } from 'lucide-react';

interface AuthorBadgeProps {
  role?: 'admin' | 'second_admin' | 'editor' | null;
  size?: 'sm' | 'md';
}

export function AuthorBadge({ role, size = 'sm' }: AuthorBadgeProps) {
  if (!role) return null;

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const badgeSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (role === 'admin') {
    return (
      <Badge variant="default" className={`gap-1 ${badgeSize} shrink-0`}>
        <Shield className={iconSize} />
        管理员
      </Badge>
    );
  }

  if (role === 'second_admin') {
    return (
      <Badge variant="secondary" className={`gap-1 ${badgeSize} shrink-0 bg-blue-500/10 text-blue-600 border-blue-500/30`}>
        <ShieldCheck className={iconSize} />
        第二管理员
      </Badge>
    );
  }

  // Editor
  return (
    <Badge variant="secondary" className={`gap-1 ${badgeSize} shrink-0`}>
      <PenTool className={iconSize} />
      编者
    </Badge>
  );
}
