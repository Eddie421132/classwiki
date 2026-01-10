import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SearchBox } from '@/components/SearchBox';
import { ArticleCard } from '@/components/ArticleCard';
import { DailyLimitBanner } from '@/components/DailyLimitBanner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BookOpen, Users, FileText } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_at: string;
  is_pinned: boolean;
  pinned_at: string | null;
  author_id: string;
  profiles: { real_name: string } | null;
  authorRole?: 'admin' | 'editor' | null;
}

const Index = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ articles: 0, editors: 0 });

  useEffect(() => {
    fetchArticles();
    fetchStats();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          content,
          cover_image_url,
          created_at,
          is_pinned,
          pinned_at,
          author_id,
          profiles!articles_author_id_profiles_fkey(real_name)
        `)
        .eq('published', true)
        .order('is_pinned', { ascending: false })
        .order('pinned_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      // Fetch author roles
      const authorIds = [...new Set((data || []).map(a => a.author_id))];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', authorIds);

      const roleMap = new Map<string, 'admin' | 'editor'>();
      rolesData?.forEach(r => {
        if (r.role === 'admin' || r.role === 'editor') {
          roleMap.set(r.user_id, r.role);
        }
      });

      const articlesWithRoles = (data || []).map(article => ({
        ...article,
        authorRole: roleMap.get(article.author_id) || null,
      }));

      setArticles(articlesWithRoles as unknown as Article[]);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [articlesCount, editorsCount] = await Promise.all([
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('published', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved')
      ]);

      setStats({
        articles: articlesCount.count || 0,
        editors: editorsCount.count || 0
      });
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center">
          <div className="animate-slide-up">
            <h1 className="wiki-title mb-4">
              7班Wiki百科
            </h1>
            <p className="wiki-subtitle max-w-2xl mx-auto mb-10">
              记录班级故事，分享有趣的事情
            </p>
          </div>

          <div className="animate-slide-up animation-delay-200">
            <SearchBox size="large" className="max-w-2xl mx-auto mb-8" />
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-16 animate-fade-in animation-delay-300">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary mb-1">
                <FileText className="w-5 h-5" />
                <span className="text-3xl font-bold">{stats.articles}</span>
              </div>
              <p className="text-sm text-muted-foreground">篇文章</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-secondary mb-1">
                <Users className="w-5 h-5" />
                <span className="text-3xl font-bold">{stats.editors}</span>
              </div>
              <p className="text-sm text-muted-foreground">位编者</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Articles */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <DailyLimitBanner />
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <h2 className="font-serif text-2xl font-bold">最新文章</h2>
            </div>
            <Button variant="outline" onClick={() => navigate('/articles')} className="gap-2">
              <FileText className="w-4 h-4" />
              查看全部
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : articles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <div 
                  key={article.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ArticleCard
                    id={article.id}
                    title={article.title}
                    content={article.content}
                    coverImage={article.cover_image_url}
                    authorName={article.profiles?.real_name || '未知作者'}
                    authorRole={article.authorRole}
                    createdAt={article.created_at}
                    isPinned={article.is_pinned}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 wiki-card">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">还没有文章</p>
              <p className="text-sm text-muted-foreground mt-1">成为编者，发布第一篇文章吧！</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 7班Wiki百科 · 用知识连接我们</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
