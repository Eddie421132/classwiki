import { useDailyArticleLimit } from '@/hooks/useDailyArticleLimit';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, AlertCircle } from 'lucide-react';

export function DailyLimitBanner() {
  const { user } = useAuth();
  const { remainingViews, dailyLimit, viewedArticles } = useDailyArticleLimit();

  if (!user) return null;

  const isExhausted = remainingViews <= 0;

  return (
    <div className={`rounded-lg p-3 mb-4 flex items-center gap-3 ${
      isExhausted 
        ? 'bg-destructive/10 border border-destructive/20 text-destructive' 
        : 'bg-primary/10 border border-primary/20 text-primary'
    }`}>
      {isExhausted ? (
        <AlertCircle className="w-5 h-5 shrink-0" />
      ) : (
        <Eye className="w-5 h-5 shrink-0" />
      )}
      <div className="text-sm">
        {isExhausted ? (
          <span>今日阅读次数已用完，明天再来吧！</span>
        ) : (
          <span>
            今日已阅读 <strong>{viewedArticles.length}</strong> / {dailyLimit} 篇，
            剩余 <strong>{remainingViews}</strong> 次
          </span>
        )}
      </div>
    </div>
  );
}
