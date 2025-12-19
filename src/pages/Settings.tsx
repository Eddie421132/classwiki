import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { toast } from 'sonner';
import { Upload, Loader2, User, Save, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, refreshProfile, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [realName, setRealName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setAvatarUrl(profile.avatar_url);
      setRealName(profile.real_name);
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      
      // Update profile with new avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('头像更新成功');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || '上传失败');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!user || !realName.trim()) {
      toast.error('请输入真实姓名');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ real_name: realName.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('保存成功');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { targetUserId: user.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('账户已删除');
      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || '删除账户失败');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || !user) {
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
        <div className="max-w-md mx-auto">
          <Card className="wiki-card">
            <CardHeader className="text-center">
              <CardTitle className="font-serif text-2xl">个人设置</CardTitle>
              <CardDescription>管理你的个人资料</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-2 border-border">
                    <AvatarImage src={avatarUrl || undefined} alt={realName} />
                    <AvatarFallback className="text-2xl">
                      <User className="w-10 h-10" />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">点击上传新头像（最大2MB）</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Name Section */}
              <div className="space-y-2">
                <Label htmlFor="real-name">真实姓名</Label>
                <Input
                  id="real-name"
                  type="text"
                  placeholder="输入你的真实姓名"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                />
              </div>

              {/* Status Display */}
              <div className="space-y-2">
                <Label>账号状态</Label>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.status === 'approved' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : profile?.status === 'banned'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {profile?.status === 'approved' ? '已通过' : profile?.status === 'banned' ? '已封禁' : '待审核'}
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSave} 
                className="w-full gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                保存修改
              </Button>

              {/* Delete Account Section */}
              <div className="pt-6 border-t border-border">
                <div className="space-y-2">
                  <Label className="text-destructive">危险操作</Label>
                  <p className="text-sm text-muted-foreground">
                    删除账户后，所有数据将被永久删除，无法恢复。
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full gap-2" disabled={isDeleting}>
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        删除我的账户
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除账户？</AlertDialogTitle>
                        <AlertDialogDescription>
                          此操作不可撤销。您的账户、文章、评论等所有数据将被永久删除。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount}>
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
