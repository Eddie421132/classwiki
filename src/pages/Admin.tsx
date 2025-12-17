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
  Loader2, User, Clock
} from 'lucide-react';
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
}

interface Article {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
  profiles: { real_name: string } | null;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/admin-login');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

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

      setRequests(requestsData || []);
      setUsers(usersData || []);
      setArticles((articlesData || []) as unknown as Article[]);
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
    try {
      await supabase.from('articles').delete().eq('id', article.id);
      toast.success('文章已删除');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败');
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

  if (authLoading || !user || !isAdmin) {
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
          <p className="text-muted-foreground">管理用户、文章和审核申请</p>
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
                    {users.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={profile.avatar_url || ''} />
                            <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.real_name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                profile.status === 'approved' ? 'default' :
                                profile.status === 'banned' ? 'destructive' :
                                'secondary'
                              }>
                                {profile.status === 'approved' ? '已激活' :
                                 profile.status === 'banned' ? '已封禁' :
                                 profile.status === 'pending' ? '待审核' : '已拒绝'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {profile.real_name !== '管理员' && (
                          <div className="flex gap-2">
                            {profile.status === 'banned' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnbanUser(profile)}
                              >
                                解封
                              </Button>
                            ) : profile.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBanUser(profile)}
                                className="gap-1"
                              >
                                <Ban className="w-4 h-4" />
                                封禁
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
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
                          <p className="font-medium">{article.title}</p>
                          <p className="text-sm text-muted-foreground">
                            作者: {article.profiles?.real_name || '未知'} · {formatDate(article.created_at)}
                          </p>
                        </div>
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
