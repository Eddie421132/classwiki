import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, FileText, Edit, Trash2, Send, Clock } from 'lucide-react';
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
import { validateContent } from '@/lib/emojiValidator';

interface Draft {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function DraftsPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isApprovedEditor, isLoading: authLoading } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && !isApprovedEditor))) {
      toast.error('您没有权限访问草稿箱');
      navigate('/');
    }
  }, [user, isAdmin, isApprovedEditor, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('article_drafts')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Fetch drafts error:', error);
      toast.error('加载草稿失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (draft: Draft) => {
    // Store draft data in sessionStorage and navigate to editor
    sessionStorage.setItem('edit-draft', JSON.stringify(draft));
    navigate('/editor');
  };

  const handlePublish = async (draft: Draft) => {
    if (!draft.title.trim()) {
      toast.error('请输入文章标题');
      return;
    }

    if (!draft.content.trim() || draft.content === '<p></p>') {
      toast.error('请输入文章内容');
      return;
    }

    // Validate content for forbidden emoji
    const validation = validateContent(draft.title + draft.content);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setPublishingId(draft.id);
    try {
      // Insert article
      const { error: insertError } = await supabase.from('articles').insert({
        title: draft.title.trim(),
        content: draft.content,
        cover_image_url: draft.cover_image_url,
        author_id: user!.id,
        published: true,
      });

      if (insertError) throw insertError;

      // Delete draft
      await supabase.from('article_drafts').delete().eq('id', draft.id);

      toast.success('文章发布成功');
      fetchDrafts();
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error.message || '发布失败');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('article_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      toast.success('草稿已删除');
      fetchDrafts();
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
      minute: '2-digit',
    });
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
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
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold mb-2">草稿箱</h1>
          <p className="text-muted-foreground">管理你的文章草稿</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              我的草稿
            </CardTitle>
            <CardDescription>共 {drafts.length} 篇草稿</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无草稿</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/editor')}
                >
                  开始写作
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {draft.title || '无标题'}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {stripHtml(draft.content) || '无内容'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                        <Clock className="w-3 h-3" />
                        最后编辑: {formatDate(draft.updated_at)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(draft)}
                        className="gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePublish(draft)}
                        disabled={publishingId === draft.id}
                        className="gap-1"
                      >
                        {publishingId === draft.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        发布
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="gap-1">
                            <Trash2 className="w-4 h-4" />
                            删除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除草稿？</AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作不可撤销，草稿将被永久删除。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(draft.id)}>
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
