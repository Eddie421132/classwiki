import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Upload, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Login form state
  const [loginRealName, setLoginRealName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerRealName, setRegisterRealName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB');
      return;
    }

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Find the user's email by real name using secure function
      const { data: email, error: lookupError } = await supabase
        .rpc('get_email_by_real_name', { _real_name: loginRealName.trim() });

      console.log('Login lookup result:', { email, lookupError, loginRealName });

      if (lookupError) {
        console.error('Lookup error:', lookupError);
        throw new Error('查找用户时出错');
      }
      
      if (!email) {
        throw new Error('找不到该用户，请检查姓名是否正确');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: loginPassword,
      });

      if (error) throw error;

      toast.success('登录成功');
      await refreshProfile();
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (registerPassword !== registerConfirmPassword) {
      toast.error('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }

    if (registerPassword.length < 6) {
      toast.error('密码至少需要6个字符');
      setIsLoading(false);
      return;
    }

    if (!registerRealName.trim()) {
      toast.error('请输入真实姓名');
      setIsLoading(false);
      return;
    }

    try {
      // Generate a valid email using only numbers (avoid Chinese characters)
      const uniqueEmail = `user_${Date.now()}@class7wiki.local`;
      
      const { data, error } = await supabase.auth.signUp({
        email: uniqueEmail,
        password: registerPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Upload avatar if selected
        let uploadedAvatarUrl = null;
        const file = fileInputRef.current?.files?.[0];
        
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${data.user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            uploadedAvatarUrl = urlData.publicUrl;
          }
        }

        // Create profile with email for login lookup
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            real_name: registerRealName,
            avatar_url: uploadedAvatarUrl,
            email: uniqueEmail,
            status: 'pending',
          });

        if (profileError) throw profileError;

        // Create registration request
        const { error: requestError } = await supabase
          .from('registration_requests')
          .insert({
            user_id: data.user.id,
            real_name: registerRealName,
            avatar_url: uploadedAvatarUrl,
            status: 'pending',
          });

        if (requestError) throw requestError;

        // Create admin message
        await supabase
          .from('admin_messages')
          .insert({
            type: 'registration_request',
            content: `新编者 "${registerRealName}" 申请注册`,
            related_user_id: data.user.id,
          });

        toast.success('注册申请已提交，请等待管理员审核');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          <Card className="wiki-card">
            <CardHeader className="text-center">
              <CardTitle className="font-serif text-2xl">编者入口</CardTitle>
              <CardDescription>登录或注册成为7班Wiki编者</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">登录</TabsTrigger>
                  <TabsTrigger value="register">注册</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-name">姓名</Label>
                      <Input
                        id="login-name"
                        type="text"
                        placeholder="输入你的真实姓名"
                        value={loginRealName}
                        onChange={(e) => setLoginRealName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">密码</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="输入密码"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      登录
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="flex justify-center">
                      <div
                        className="avatar-upload"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar preview" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Upload className="w-6 h-6" />
                            <span className="text-xs">上传头像</span>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-name">真实姓名</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="输入你的真实姓名"
                        value={registerRealName}
                        onChange={(e) => setRegisterRealName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">密码</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="设置密码（至少6位）"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">确认密码</Label>
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="再次输入密码"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      提交审核
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      提交后需等待管理员审核通过
                    </p>
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
