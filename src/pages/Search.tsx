import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { SearchBox } from '@/components/SearchBox';
import { ArticleCard } from '@/components/ArticleCard';
import { Loader2, Search as SearchIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_at: string;
  profiles: { real_name: string } | null;
}

interface SearchResult {
  articles: Article[];
  aiSummary?: string;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult>({ articles: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      // Search articles
      const { data: articles, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          content,
          cover_image_url,
          created_at,
          profiles!articles_author_id_fkey(real_name)
        `)
        .eq('published', true)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get AI summary if we have results
      let aiSummary = '';
      if (articles && articles.length > 0) {
        try {
          const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-search', {
            body: { query: searchQuery, articles: articles.map(a => ({ title: a.title, content: a.content.substring(0, 500) })) }
          });
          
          if (!aiError && aiData?.summary) {
            aiSummary = aiData.summary;
          }
        } catch (aiErr) {
          console.log('AI summary not available');
        }
      }

      setResults({ 
        articles: (articles || []) as unknown as Article[], 
        aiSummary 
      });
    } catch (error) {
      console.error('Search error:', error);
      toast.error('搜索失败');
      setResults({ articles: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-4 flex items-center gap-2">
              <SearchIcon className="w-8 h-8 text-primary" />
              搜索文章
            </h1>
            <SearchBox onSearch={handleSearch} isLoading={isLoading} size="large" />
          </div>

          {query && (
            <p className="text-muted-foreground mb-6">
              搜索 "{query}" 的结果
            </p>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">正在搜索...</p>
            </div>
          ) : hasSearched ? (
            <>
              {results.aiSummary && (
                <div className="wiki-card mb-8 bg-gradient-to-br from-primary/5 to-accent/5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">AI 智能摘要</h3>
                      <p className="text-muted-foreground">{results.aiSummary}</p>
                    </div>
                  </div>
                </div>
              )}

              {results.articles.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {results.articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      content={article.content}
                      coverImage={article.cover_image_url}
                      authorName={article.profiles?.real_name || '未知作者'}
                      createdAt={article.created_at}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">未找到相关文章</p>
                  <p className="text-sm text-muted-foreground mt-1">尝试使用其他关键词搜索</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">输入关键词开始搜索</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
