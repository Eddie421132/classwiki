import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import { Upload, Loader2, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserAuthPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  
  // Email verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resending code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
  };

  const handleSendVerificationCode = async () => {
    if (!registerEmail.trim() || !registerEmail.includes('@')) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setIsSendingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email: registerEmail.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setIsCodeSent(true);
      setCountdown(60);
      toast.success('验证码已发送到您的邮箱');
    } catch (error: any) {
      console.error('Send code error:', error);
      toast.error(error.message || '发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast.error('请输入验证码');
      return;
    }

    setIsVerifyingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: { 
          email: registerEmail.trim(),
          code: verificationCode.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setIsEmailVerified(true);
      toast.success('邮箱验证成功！');
    } catch (error: any) {
      console.error('Verify code error:', error);
      toast.error(error.message || '验证码验证失败');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
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
    
    if (!isEmailVerified) {
      toast.error('请先验证邮箱');
      return;
    }

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

    if (!registerUsername.trim()) {
      toast.error('请输入用户名');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail.trim(),
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

        // Create profile with 'user' status (auto-approved regular user)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            real_name: registerUsername.trim(),
            avatar_url: uploadedAvatarUrl,
            email: registerEmail.trim(),
            status: 'user', // Regular user, auto-approved
          });

        if (profileError) throw profileError;

        toast.success('注册成功！');
        await refreshProfile();
        navigate('/');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message?.includes('already registered')) {
        toast.error('该邮箱已被注册');
      } else {
        toast.error(error.message || '注册失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset verification state when email changes
  const handleEmailChange = (email: string) => {
    setRegisterEmail(email);
    if (isCodeSent || isEmailVerified) {
      setIsCodeSent(false);
      setIsEmailVerified(false);
      setVerificationCode('');
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
              <CardTitle className="font-serif text-2xl">用户登录</CardTitle>
              <CardDescription>登录或注册成为7班Wiki用户，可评论和点赞</CardDescription>
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
                      <Label htmlFor="login-email">邮箱</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="输入你的邮箱"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
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
                    
                    {/* Email with verification */}
                    <div className="space-y-2">
                      <Label htmlFor="register-email">邮箱</Label>
                      <div className="flex gap-2">
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="输入你的邮箱"
                          value={registerEmail}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          disabled={isEmailVerified}
                          required
                          className="flex-1"
                        />
                        {isEmailVerified ? (
                          <div className="flex items-center text-green-600 px-3">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendVerificationCode}
                            disabled={isSendingCode || countdown > 0 || !registerEmail.includes('@')}
                            className="whitespace-nowrap"
                          >
                            {isSendingCode ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : countdown > 0 ? (
                              `${countdown}s`
                            ) : (
                              <>
                                <Mail className="w-4 h-4 mr-1" />
                                获取验证码
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Verification code input */}
                    {isCodeSent && !isEmailVerified && (
                      <div className="space-y-2">
                        <Label htmlFor="verification-code">验证码</Label>
                        <div className="flex gap-2">
                          <Input
                            id="verification-code"
                            type="text"
                            placeholder="输入6位验证码"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            className="flex-1 tracking-widest text-center text-lg"
                          />
                          <Button
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={isVerifyingCode || verificationCode.length !== 6}
                          >
                            {isVerifyingCode ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              '验证'
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          验证码已发送至 {registerEmail}，10分钟内有效
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="register-username">用户名</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="输入你的用户名"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
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
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || !isEmailVerified}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      注册
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      验证邮箱后可直接注册，无需审核
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 pt-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground mb-2">想成为编者？</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                  申请成为编者
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
