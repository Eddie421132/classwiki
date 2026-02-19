import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Search, User, Edit, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isSecondAdmin, isApprovedEditor } = useAuth();

  const canEdit = isAdmin || isSecondAdmin || isApprovedEditor;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { icon: Home, label: '主页', path: '/' },
    { icon: Search, label: '搜索', path: '/search' },
    { icon: BookOpen, label: '文章', path: '/articles' },
    ...(canEdit
      ? [{ icon: Edit, label: '发布', path: '/editor' }]
      : []),
    ...(user
      ? [{ icon: Settings, label: '设置', path: '/settings' }]
      : [{ icon: User, label: '登录', path: '/user-auth' }]),
  ];

  // Hide bottom nav on editor page to avoid blocking toolbar
  const hiddenPaths = ['/editor', '/admin', '/admin-login', '/auth'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-stretch h-16">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors py-2',
              isActive(path)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5 transition-transform',
                isActive(path) && 'scale-110'
              )}
              strokeWidth={isActive(path) ? 2.5 : 1.8}
            />
            <span className={cn('font-medium', isActive(path) && 'font-semibold')}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
