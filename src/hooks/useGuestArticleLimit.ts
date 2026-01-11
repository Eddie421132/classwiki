import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const GUEST_DAILY_LIMIT = 5;
const STORAGE_KEY = 'guest_allowed_articles';
const DATE_KEY = 'guest_articles_date';

interface GuestArticleData {
  allowedIds: string[];
  date: string;
}

export function useGuestArticleLimit() {
  const { user } = useAuth();
  const [allowedArticles, setAllowedArticles] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get today's date string
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Initialize or reset guest allowed articles
  useEffect(() => {
    if (user) {
      // Logged in users have no limit
      setAllowedArticles([]);
      setIsInitialized(true);
      return;
    }

    const today = getTodayString();
    const storedDate = localStorage.getItem(DATE_KEY);
    const storedArticles = localStorage.getItem(STORAGE_KEY);

    if (storedDate === today && storedArticles) {
      // Same day, use stored articles
      try {
        const parsed = JSON.parse(storedArticles);
        setAllowedArticles(parsed);
      } catch {
        setAllowedArticles([]);
      }
    } else {
      // New day or no data, will be set when articles are loaded
      setAllowedArticles([]);
      localStorage.setItem(DATE_KEY, today);
      localStorage.setItem(STORAGE_KEY, '[]');
    }
    setIsInitialized(true);
  }, [user]);

  // Set allowed articles for guest (called when articles are first loaded)
  const initializeAllowedArticles = useCallback((articleIds: string[]) => {
    if (user) return; // Logged in users have no limit

    const today = getTodayString();
    const storedDate = localStorage.getItem(DATE_KEY);
    const storedArticles = localStorage.getItem(STORAGE_KEY);

    if (storedDate === today && storedArticles) {
      try {
        const parsed = JSON.parse(storedArticles);
        if (parsed.length > 0) {
          setAllowedArticles(parsed);
          return parsed;
        }
      } catch {
        // Continue to create new allowed list
      }
    }

    // Shuffle and pick random articles
    const shuffled = [...articleIds].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, GUEST_DAILY_LIMIT);
    
    localStorage.setItem(DATE_KEY, today);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    setAllowedArticles(selected);
    return selected;
  }, [user]);

  // Check if guest can view an article
  const canViewArticle = useCallback((articleId: string): boolean => {
    if (user) return true; // Logged in users can view all
    return allowedArticles.includes(articleId);
  }, [user, allowedArticles]);

  // Filter articles for guest display
  const filterArticlesForGuest = useCallback((articles: { id: string }[]): string[] => {
    if (user) return articles.map(a => a.id); // All for logged in users
    
    // Return only allowed articles
    return articles
      .filter(a => allowedArticles.includes(a.id))
      .map(a => a.id);
  }, [user, allowedArticles]);

  return {
    allowedArticles,
    canViewArticle,
    initializeAllowedArticles,
    filterArticlesForGuest,
    isGuest: !user,
    dailyLimit: GUEST_DAILY_LIMIT,
    isInitialized,
  };
}
