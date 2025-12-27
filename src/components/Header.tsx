import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Edit, LogOut, User, Bell, Settings, FileText, History } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, profile, isAdmin, isApprovedEditor, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const canEdit = isAdmin || isApprovedEditor;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          7班Wiki
        </Link>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/changelog')}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            更新日志
          </Button>

          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="gap-2"
                >
                  <Bell className="w-4 h-4" />
                  管理中心
                </Button>
              )}
              
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => navigate('/editor')}
                  className="gap-2 bg-primary text-primary-foreground"
                >
                  <Edit className="w-4 h-4" />
                  发布文章
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.real_name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {profile?.real_name?.charAt(0) || <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.real_name || '用户'}</p>
                    <p className="text-xs text-muted-foreground">
                      {isAdmin ? '管理员' : isApprovedEditor ? '编者' : profile?.status === 'user' ? '普通用户' : '待审核'}
                    </p>
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
                className="gap-2"
              >
                <Shield className="w-4 h-4" />
                管理员
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/user-auth')}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                用户登录
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/auth')}
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Edit className="w-4 h-4" />
                编者入口
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
