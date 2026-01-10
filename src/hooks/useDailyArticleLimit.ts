import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DAILY_LIMIT = 5;

export function useDailyArticleLimit() {
  const { user } = useAuth();
  const [viewedArticles, setViewedArticles] = useState<string[]>([]);
  const [allowedArticles, setAllowedArticles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodayViews = useCallback(async () => {
    if (!user) {
      setViewedArticles([]);
      setAllowedArticles([]);
      setIsLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_article_views')
        .select('article_id')
        .eq('user_id', user.id)
        .eq('viewed_date', today);

      if (error) throw error;

      const viewed = data?.map(d => d.article_id) || [];
      setViewedArticles(viewed);

      // If user hasn't reached limit, fetch random articles they can view
      if (viewed.length < DAILY_LIMIT) {
        const remaining = DAILY_LIMIT - viewed.length;
        
        // Get random articles not yet viewed
        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select('id')
          .eq('published', true)
          .not('id', 'in', viewed.length > 0 ? `(${viewed.join(',')})` : '(00000000-0000-0000-0000-000000000000)')
          .limit(remaining * 3); // Get more to randomize

        if (articlesError) throw articlesError;

        // Shuffle and pick random ones
        const shuffled = (articles || []).sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, remaining).map(a => a.id);
        
        setAllowedArticles([...viewed, ...selected]);
      } else {
        setAllowedArticles(viewed);
      }
    } catch (error) {
      console.error('Error fetching daily views:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayViews();
  }, [fetchTodayViews]);

  const canViewArticle = useCallback((articleId: string): boolean => {
    if (!user) return true; // Non-logged in users can view all (they just can't interact)
    return allowedArticles.includes(articleId);
  }, [user, allowedArticles]);

  const recordView = useCallback(async (articleId: string): Promise<boolean> => {
    if (!user) return true;

    // Already viewed today
    if (viewedArticles.includes(articleId)) {
      return true;
    }

    // Check if can view
    if (!canViewArticle(articleId)) {
      return false;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_article_views')
        .insert({
          user_id: user.id,
          article_id: articleId,
          viewed_date: today,
        });

      if (error) {
        // Might be duplicate, that's fine
        if (!error.message.includes('duplicate')) {
          throw error;
        }
      }

      setViewedArticles(prev => [...prev, articleId]);
      return true;
    } catch (error) {
      console.error('Error recording view:', error);
      return false;
    }
  }, [user, viewedArticles, canViewArticle]);

  const remainingViews = DAILY_LIMIT - viewedArticles.length;

  return {
    viewedArticles,
    allowedArticles,
    canViewArticle,
    recordView,
    remainingViews,
    isLoading,
    dailyLimit: DAILY_LIMIT,
  };
}
