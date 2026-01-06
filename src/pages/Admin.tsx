import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, FileText, Bell, Check, X, Ban, Trash2, 
  Loader2, User, Clock, ShieldCheck, MapPin
} from 'lucide-react';
import { UserIpDialog } from '@/components/UserIpDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RegistrationRequest {
  id: string;
  user_id: string;
  real_name: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  real_name: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
  last_login_ip: string | null;
}

interface Article {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
  profiles: { real_name: string } | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface UserCardProps {
  profile: Profile;
  isMainAdmin: boolean;
  isSecondAdmin: boolean;
  userRoles: UserRole[];
  adminUserIds: string[];
  onBan: (profile: Profile) => void;
  onUnban: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  onToggleSecondAdmin: (profile: Profile, isCurrentlySecondAdmin: boolean) => void;
  canViewIp: boolean;
}

function UserCard({ 
  profile, 
  isMainAdmin, 
  isSecondAdmin, 
  userRoles, 
  adminUserIds,
  onBan, 
  onUnban, 
  onDelete,
  onToggleSecondAdmin,
  canViewIp
}: UserCardProps) {
  const isUserAdmin = adminUserIds.includes(profile.user_id);
  const isUserSecondAdmin = userRoles.some(r => r.user_id === profile.user_id && r.role === 'second_admin');
  
  // Second admin cannot ban/delete main admin
  const canBanUser = isMainAdmin || (!isSecondAdmin || !isUserAdmin);
  const canDeleteUser = isMainAdmin; // Only main admin can delete

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border rounded-lg">
      <div className="flex items-center justify-between p-4 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">{profile.real_name}</p>
              <Badge variant={profile.status === 'approved' ? 'default' : profile.status === 'banned' ? 'destructive' : 'secondary'}>
                {profile.status === 'approved' ? '已批准' : profile.status === 'banned' ? '已封禁' : '待审核'}
              </Badge>
              {isUserAdmin && (
                <Badge variant="outline" className="gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  管理员
                </Badge>
              )}
              {isUserSecondAdmin && (
                <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  第二管理员
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              注册于 {formatDate(profile.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* IP record button */}
          {canViewIp && (
            <UserIpDialog userId={profile.user_id} userName={profile.real_name}>
              <Button size="sm" variant="outline" className="gap-1">
                <MapPin className="w-4 h-4" />
                IP记录
              </Button>
            </UserIpDialog>
          )}
          {/* Only main admin can set second admin, and not for other main admins */}
          {isMainAdmin && !isUserAdmin && (
            <Button 
              size="sm" 
              variant={isUserSecondAdmin ? "secondary" : "outline"}
              onClick={() => onToggleSecondAdmin(profile, isUserSecondAdmin)}
              className="gap-1"
            >
              <ShieldCheck className="w-4 h-4" />
              {isUserSecondAdmin ? '取消第二管理员' : '设为第二管理员'}
            </Button>
          )}
          {canBanUser && (
            profile.status === 'banned' ? (
              <Button size="sm" variant="outline" onClick={() => onUnban(profile)}>
                解封
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onBan(profile)} className="gap-1">
                <Ban className="w-4 h-4" />
                封禁
              </Button>
            )
          )}
          {canDeleteUser && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="gap-1">
                  <Trash2 className="w-4 h-4" />
                  删除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除用户？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作不可撤销，用户及其所有数据将被永久删除。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(profile)}>
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isSecondAdmin, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isMainAdmin = isAdmin && !isSecondAdmin;
  const canAccessAdmin = isAdmin || isSecondAdmin;

  useEffect(() => {
    if (!authLoading && (!user || !canAccessAdmin)) {
      navigate('/admin-login');
    }
  }, [user, canAccessAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && canAccessAdmin) {
      fetchData();
    }
  }, [user, canAccessAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch pending requests
      const { data: requestsData } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Fetch all users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all articles
      const { data: articlesData } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          author_id,
          created_at,
          profiles!articles_author_id_profiles_fkey(real_name)
        `)
        .order('created_at', { ascending: false });

      // Fetch privileged roles (admin + second_admin)
      const { data: rolesData, error: rolesError } = await supabase
        .rpc('get_admin_and_second_admin_roles');

      if (rolesError) throw rolesError;

      setRequests(requestsData || []);
      setUsers(usersData || []);
      setArticles((articlesData || []) as unknown as Article[]);
      setUserRoles((rolesData || []) as UserRole[]);
      
      // Get main admin user IDs
      const adminIds = (rolesData || [])
        .filter((r: any) => r.role === 'admin')
        .map((r: any) => r.user_id);
      setAdminUserIds(adminIds);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (request: RegistrationRequest) => {
    try {
      // Update request status
      await supabase
        .from('registration_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq('id', request.id);

      // Update profile status
      await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('user_id', request.user_id);

      toast.success(`已批准 ${request.real_name} 的注册申请`);
      fetchData();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('操作失败');
    }
  };

  const handleRejectRequest = async (request: RegistrationRequest) => {
    try {
      await supabase
        .from('registration_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq('id', request.id);

      await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('user_id', request.user_id);

      toast.success(`已拒绝 ${request.real_name} 的注册申请`);
      fetchData();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('操作失败');
    }
  };

  const handleBanUser = async (profile: Profile) => {
    // Second admin cannot ban main admin
    if (isSecondAdmin && adminUserIds.includes(profile.user_id)) {
      toast.error('无法封禁正式管理员');
      return;
    }
    
    try {
      await supabase
        .from('profiles')
        .update({ status: 'banned' })
        .eq('id', profile.id);

      toast.success(`已封禁用户 ${profile.real_name}`);
      fetchData();
    } catch (error) {
      console.error('Ban error:', error);
      toast.error('操作失败');
    }
  };

  const handleUnbanUser = async (profile: Profile) => {
    try {
      await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', profile.id);

      toast.success(`已解封用户 ${profile.real_name}`);
      fetchData();
    } catch (error) {
      console.error('Unban error:', error);
      toast.error('操作失败');
    }
  };

  const handleDeleteArticle = async (article: Article) => {
    // Second admin cannot delete main admin's articles
    if (isSecondAdmin && adminUserIds.includes(article.author_id)) {
      toast.error('无法删除正式管理员的文章');
      return;
    }
    
    try {
      await supabase.from('articles').delete().eq('id', article.id);
      toast.success('文章已删除');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败');
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    if (!isMainAdmin) {
      toast.error('只有正式管理员才能删除用户');
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { targetUserId: profile.user_id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`已删除用户 ${profile.real_name}`);
      fetchData();
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast.error(error.message || '删除用户失败');
    }
  };

  const handleToggleSecondAdmin = async (profile: Profile, isCurrentlySecondAdmin: boolean) => {
    if (!isMainAdmin) {
      toast.error('只有正式管理员才能设置第二管理员');
      return;
    }
    
    try {
      if (isCurrentlySecondAdmin) {
        // Remove second admin role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', profile.user_id)
          .eq('role', 'second_admin');
        toast.success(`已取消 ${profile.real_name} 的第二管理员权限`);
      } else {
        // Add second admin role
        await supabase
          .from('user_roles')
          .insert({
            user_id: profile.user_id,
            role: 'second_admin'
          });
        toast.success(`已设置 ${profile.real_name} 为第二管理员`);
      }
      fetchData();
    } catch (error) {
      console.error('Toggle second admin error:', error);
      toast.error('操作失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if article can be deleted by current user
  const canDeleteArticle = (article: Article) => {
    if (isMainAdmin) return true;
    if (isSecondAdmin && !adminUserIds.includes(article.author_id)) return true;
    return false;
  };

  if (authLoading || !user || !canAccessAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold mb-2">管理中心</h1>
          <p className="text-muted-foreground">
            {isMainAdmin ? '正式管理员' : '第二管理员'} - 管理用户、文章和审核申请
          </p>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="requests" className="gap-2">
              <Bell className="w-4 h-4" />
              待审核
              {requests.length > 0 && (
                <Badge variant="destructive" className="ml-1">{requests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="w-4 h-4" />
              文章管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>注册审核</CardTitle>
                <CardDescription>审核新编者的注册申请</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : requests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">暂无待审核的申请</p>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.avatar_url || ''} />
                            <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.real_name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request)}
                            className="gap-1"
                          >
                            <Check className="w-4 h-4" />
                            批准
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectRequest(request)}
                            className="gap-1"
                          >
                            <X className="w-4 h-4" />
                            拒绝
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>管理所有注册用户</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">暂无用户</p>
                ) : (
                  <div className="space-y-4">
                    {users.map((profile) => {
                      const isProfileAdmin = adminUserIds.includes(profile.user_id);
                      // Main admin can see all IPs; second admin can see non-admin IPs
                      const canViewIp = isMainAdmin || (isSecondAdmin && !isProfileAdmin);
                      return (
                        <UserCard 
                          key={profile.id} 
                          profile={profile} 
                          isMainAdmin={isMainAdmin}
                          isSecondAdmin={isSecondAdmin}
                          userRoles={userRoles}
                          adminUserIds={adminUserIds}
                          onBan={handleBanUser}
                          onUnban={handleUnbanUser}
                          onDelete={handleDeleteUser}
                          onToggleSecondAdmin={handleToggleSecondAdmin}
                          canViewIp={canViewIp}
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <CardTitle>文章列表</CardTitle>
                <CardDescription>管理所有已发布的文章</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : articles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">暂无文章</p>
                ) : (
                  <div className="space-y-4">
                    {articles.map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{article.title}</p>
                            {adminUserIds.includes(article.author_id) && (
                              <Badge variant="outline" className="text-xs">管理员文章</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            作者: {article.profiles?.real_name || '未知'} · {formatDate(article.created_at)}
                          </p>
                        </div>
                        {canDeleteArticle(article) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-1">
                                <Trash2 className="w-4 h-4" />
                                删除
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除文章？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  此操作不可撤销，文章将被永久删除。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteArticle(article)}>
                                  确认删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
