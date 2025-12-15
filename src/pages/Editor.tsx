import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Loader2, Send, ImageIcon } from 'lucide-react';

export default function EditorPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isApprovedEditor, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && !isApprovedEditor))) {
      toast.error('您没有权限发布文章');
      navigate('/');
    }
  }, [user, isAdmin, isApprovedEditor, authLoading, navigate]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/covers/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('articles')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('articles')
        .getPublicUrl(fileName);

      setCoverImage(publicUrl);
      toast.success('封面图片上传成功');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('图片上传失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('请输入文章标题');
      return;
    }

    if (!content.trim() || content === '<p></p>') {
      toast.error('请输入文章内容');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('articles').insert({
        title: title.trim(),
        content,
        cover_image_url: coverImage,
        author_id: user!.id,
        published: true,
      });

      if (error) throw error;

      toast.success('文章发布成功');
      navigate('/');
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error.message || '发布失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || (!isAdmin && !isApprovedEditor)) {
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
        <div className="max-w-4xl mx-auto">
          <Card className="wiki-card">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">发布新文章</CardTitle>
              <CardDescription>编写并发布文章到7班Wiki</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">文章标题</Label>
                  <Input
                    id="title"
                    placeholder="输入文章标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>封面图片（可选）</Label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {coverImage ? (
                      <div className="relative">
                        <img
                          src={coverImage}
                          alt="Cover preview"
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="mt-2"
                        >
                          更换图片
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="w-10 h-10" />
                        <p>点击上传封面图片</p>
                        <p className="text-xs">支持 JPG, PNG, GIF，最大 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <Label>文章内容</Label>
                  <RichTextEditor content={content} onChange={setContent} />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    发布文章
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
