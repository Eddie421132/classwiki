import { useGuestArticleLimit } from '@/hooks/useGuestArticleLimit';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function GuestLimitBanner() {
  const { user } = useAuth();
  const { allowedArticles, dailyLimit, isGuest } = useGuestArticleLimit();
  const navigate = useNavigate();

  // Only show for guest users
  if (user || !isGuest) {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-amber-600 dark:text-amber-400">
            访客模式
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            您正在以访客身份浏览，每天仅可随机查看 {dailyLimit} 篇文章。
            登录后可查看全部内容。
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 gap-2"
            onClick={() => navigate('/user-auth')}
          >
            <LogIn className="w-4 h-4" />
            立即登录
          </Button>
        </div>
      </div>
    </div>
  );
}
