import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Calendar, User, ArrowLeft, Trash2, Pin, PinOff } from 'lucide-react';
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
import { ArticleLikes } from '@/components/ArticleLikes';
import { ArticleComments } from '@/components/ArticleComments';

interface Article {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  pinned_at: string | null;
  profiles: { 
    real_name: string;
    avatar_url: string | null;
  } | null;
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          profiles!articles_author_id_profiles_fkey(real_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setArticle(data as unknown as Article);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('文章不存在或已被删除');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;
      toast.success('文章已删除');
      navigate('/');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败');
    }
  };

  const handleTogglePin = async () => {
    if (!article) return;
    
    try {
      const newPinnedStatus = !article.is_pinned;
      const { error } = await supabase
        .from('articles')
        .update({ 
          is_pinned: newPinnedStatus,
          pinned_at: newPinnedStatus ? new Date().toISOString() : null
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setArticle({ ...article, is_pinned: newPinnedStatus });
      toast.success(newPinnedStatus ? '文章已置顶' : '已取消置顶');
    } catch (error) {
      console.error('Pin error:', error);
      toast.error('操作失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEdit = user && (user.id === article?.author_id || isAdmin);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>

          <article className="wiki-card animate-fade-in">
            {article.cover_image_url && (
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-64 md:h-80 object-cover rounded-lg mb-6"
              />
            )}

            <div className="flex items-start gap-3 mb-6">
              {article.is_pinned && (
                <Badge variant="secondary" className="gap-1 mt-2 shrink-0">
                  <Pin className="w-3 h-3" />
                  置顶
                </Badge>
              )}
              <h1 className="font-serif text-3xl md:text-4xl font-bold flex-1">
                {article.title}
              </h1>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-border">
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={article.profiles?.avatar_url || ''} />
                  <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{article.profiles?.real_name || '未知作者'}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(article.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={handleTogglePin}
                  >
                    {article.is_pinned ? (
                      <>
                        <PinOff className="w-4 h-4" />
                        取消置顶
                      </>
                    ) : (
                      <>
                        <Pin className="w-4 h-4" />
                        置顶
                      </>
                    )}
                  </Button>
                )}
                {canEdit && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1">
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
                        <AlertDialogAction onClick={handleDelete}>
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content, {
                ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
              }) }}
            />

            <div className="mt-8 pt-6 border-t border-border">
              <ArticleLikes articleId={article.id} />
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <ArticleComments articleId={article.id} />
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
