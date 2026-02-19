import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Edit, LogOut, User, Bell, Settings, FileText, History, MessageSquare } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, profile, isAdmin, isSecondAdmin, isApprovedEditor, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const canEdit = isAdmin || isSecondAdmin || isApprovedEditor;
  const canAccessAdmin = isAdmin || isSecondAdmin;

  const roleLabel = isAdmin
    ? '管理员'
    : isSecondAdmin
    ? '第二管理员'
    : isApprovedEditor
    ? '编者'
    : profile?.status === 'user'
    ? '普通用户'
    : '待审核';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-lg md:text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          7班Wiki
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              {canAccessAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="hidden md:flex gap-2"
                >
                  <Bell className="w-4 h-4" />
                  管理中心
                </Button>
              )}

              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => navigate('/editor')}
                  className="hidden md:flex gap-2 bg-primary text-primary-foreground"
                >
                  <Edit className="w-4 h-4" />
                  发布文章
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0">
                    <UserAvatar
                      userId={user.id}
                      avatarUrl={profile?.avatar_url}
                      fallback={profile?.real_name}
                      size="md"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.real_name || '用户'}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    个人设置
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => navigate('/drafts')}>
                      <FileText className="w-4 h-4 mr-2" />
                      草稿箱
                    </DropdownMenuItem>
                  )}
                  {!canAccessAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/suggestions')}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      建议箱
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/changelog')}>
                    <History className="w-4 h-4 mr-2" />
                    更新日志
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin-login')}
                className="hidden md:flex gap-2"
              >
                <Shield className="w-4 h-4" />
                管理员
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/user-auth')}
                className="gap-1.5"
              >
                <User className="w-4 h-4" />
                <span className="hidden md:inline">用户登录</span>
                <span className="md:hidden">登录</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/auth')}
                className="gap-1.5 bg-primary text-primary-foreground"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden md:inline">编者入口</span>
                <span className="md:hidden">编者</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
