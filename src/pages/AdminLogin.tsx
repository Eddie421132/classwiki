import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Shield, Loader2, AlertCircle, UserCheck } from 'lucide-react';
import { verifyAdminPassword } from '@/lib/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Verify password server-side
      const authResult = await verifyAdminPassword(password);
      
      if (!authResult.success) {
        setError(authResult.error || '管理员密码错误');
        setIsLoading(false);
        return;
      }

      // Sign in with credentials returned from server
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authResult.email!,
        password: authResult.password!,
      });

      if (signInError) {
        throw signInError;
      }

      toast.success('管理员登录成功');
      navigate('/');
    } catch (error: any) {
      console.error('Admin login error:', error);
      setError(error.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecondAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // First, get the email by username (real_name)
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_email_by_real_name', { _real_name: username });

      if (emailError || !emailData) {
        setError('用户名不存在');
        setIsLoading(false);
        return;
      }

      // Sign in with user's credentials
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailData,
        password: userPassword,
      });

      if (signInError) {
        throw signInError;
      }

      // Check if user has second_admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'second_admin')
        .maybeSingle();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        setError('您没有第二管理员权限');
        setIsLoading(false);
        return;
      }

      toast.success('第二管理员登录成功');
      navigate('/');
    } catch (error: any) {
      console.error('Second admin login error:', error);
      setError(error.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          <Card className="wiki-card">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">管理员登录</CardTitle>
              <CardDescription>选择登录方式以访问管理中心</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="admin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="admin" className="gap-1">
                    <Shield className="w-4 h-4" />
                    正式管理员
                  </TabsTrigger>
                  <TabsTrigger value="second" className="gap-1">
                    <UserCheck className="w-4 h-4" />
                    第二管理员
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="admin">
                  <form onSubmit={handleAdminSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">管理员密码</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="输入管理员密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      登录管理中心
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="second">
                  <form onSubmit={handleSecondAdminSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="second-username">用户名</Label>
                      <Input
                        id="second-username"
                        type="text"
                        placeholder="输入您的用户名（真实姓名）"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="second-password">密码</Label>
                      <Input
                        id="second-password"
                        type="password"
                        placeholder="输入您的密码"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      第二管理员登录
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}