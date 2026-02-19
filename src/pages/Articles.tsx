import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { ArticleCard } from '@/components/ArticleCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, BookOpen, ChevronLeft, ChevronRight, Lock, LogIn } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_at: string;
  is_pinned: boolean;
  pinned_at: string | null;
  author_id: string;
  profiles: { 
    real_name: string;
    avatar_url: string | null;
  } | null;
  authorRole?: 'admin' | 'editor' | null;
}

const ARTICLES_PER_PAGE = 12;

export default function ArticlesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  useEffect(() => {
    fetchArticles();
  }, [currentPage]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      // Get total count
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('published', true);
      
      setTotalCount(count || 0);

      // Fetch paginated articles
      const from = (currentPage - 1) * ARTICLES_PER_PAGE;
      const to = from + ARTICLES_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          profiles!articles_author_id_profiles_fkey(real_name, avatar_url)
        `)
        .eq('published', true)
        .order('is_pinned', { ascending: false })
        .order('pinned_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Fetch author roles
      const authorIds = [...new Set(data?.map(a => a.author_id) || [])];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', authorIds)
        .in('role', ['admin', 'editor']);

      const rolesMap = new Map(
        rolesData?.map(r => [r.user_id, r.role as 'admin' | 'editor']) || []
      );

      const articlesWithRoles = (data || []).map(article => ({
        ...article,
        authorRole: rolesMap.get(article.author_id) || null,
      })) as Article[];

      setArticles(articlesWithRoles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guest users cannot access all articles page
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background pb-safe md:pb-0">
        <Header />
        
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">需要登录</h1>
            <p className="text-muted-foreground mb-6">
              访客用户每天只能查看首页的5篇随机文章。登录后可查看全部文章。
            </p>
            <Button onClick={() => navigate('/user-auth')} className="gap-2">
              <LogIn className="w-4 h-4" />
              立即登录
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe md:pb-0">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-12">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-primary" />
            全部文章
          </h1>
          <p className="text-muted-foreground">
            共 {totalCount} 篇文章
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              {articles.map((article) => (
                <ArticleCard 
                  key={article.id} 
                  id={article.id}
                  title={article.title}
                  content={article.content}
                  coverImage={article.cover_image_url}
                  authorName={article.profiles?.real_name || '未知作者'}
                  authorRole={article.authorRole}
                  createdAt={article.created_at}
                  isPinned={article.is_pinned}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 2
                    )
                    .map((page, index, arr) => {
                      const prevPage = arr[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      
                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无文章</p>
          </div>
        )}
      </main>
    </div>
  );
}
