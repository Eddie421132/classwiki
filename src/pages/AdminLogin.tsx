import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { ADMIN_PASSWORD } from '@/lib/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== ADMIN_PASSWORD) {
      setError('管理员密码错误');
      setIsLoading(false);
      return;
    }

    try {
      // Sign in or create admin account
      const adminEmail = 'admin@class7wiki.local';
      
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: ADMIN_PASSWORD,
      });

      if (signInError) {
        // If sign in fails, create the admin account
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: adminEmail,
          password: ADMIN_PASSWORD,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Create admin profile
          await supabase.from('profiles').insert({
            user_id: data.user.id,
            real_name: '管理员',
            status: 'approved',
          });

          // Assign admin role using security definer function
          await supabase.rpc('assign_admin_role', { _user_id: data.user.id });
        }
      }

      toast.success('管理员登录成功');
      navigate('/admin');
    } catch (error: any) {
      console.error('Admin login error:', error);
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
              <CardDescription>输入管理员密码以访问管理中心</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
