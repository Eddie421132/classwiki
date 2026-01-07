import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AuthorBadge } from '@/components/AuthorBadge';
import { ImageLightbox } from '@/components/ImageLightbox';
import { BackgroundMusicPlayer } from '@/components/BackgroundMusicPlayer';
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
  background_music_url: string | null;
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
  const [authorRole, setAuthorRole] = useState<'admin' | 'editor' | null>(null);
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

      // Fetch author role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.author_id)
        .in('role', ['admin', 'editor'])
        .maybeSingle();

      if (roleData && (roleData.role === 'admin' || roleData.role === 'editor')) {
        setAuthorRole(roleData.role);
      }
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

  // Add click handler for content images
  useEffect(() => {
    if (!article) return;

    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('.prose')) {
        const imgSrc = (target as HTMLImageElement).src;
        // Create a modal for the image
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out';
        modal.innerHTML = `
          <button class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <img src="${imgSrc}" alt="" class="max-w-full max-h-full object-contain" />
        `;
        modal.onclick = () => modal.remove();
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        const cleanup = () => {
          document.body.style.overflow = '';
        };
        modal.addEventListener('click', cleanup);
      }
    };

    document.addEventListener('click', handleImageClick);
    return () => document.removeEventListener('click', handleImageClick);
  }, [article]);

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
              <ImageLightbox
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
                <Link to={`/profile/${article.author_id}`}>
                  <Avatar className="w-10 h-10 hover:ring-2 ring-primary transition-all">
                    <AvatarImage src={article.profiles?.avatar_url || ''} />
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/profile/${article.author_id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {article.profiles?.real_name || '未知作者'}
                    </Link>
                    <AuthorBadge role={authorRole} size="sm" />
                  </div>
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
            className="prose prose-lg max-w-none [&_img]:cursor-zoom-in [&_video]:max-w-full [&_video]:rounded-lg"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content, {
              ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'video', 'source', 'div', 'iframe'],
              ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'controls', 'type', 'style', 'width', 'height', 'allowfullscreen', 'frameborder', 'autoplay', 'loop', 'muted', 'playsinline', 'poster', 'preload'],
              ADD_TAGS: ['video', 'source'],
              ADD_ATTR: ['controls', 'autoplay', 'loop', 'muted', 'playsinline', 'poster', 'preload'],
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
      
      {/* Background Music Player */}
      <BackgroundMusicPlayer musicUrl={article.background_music_url} />
    </div>
  );
}
