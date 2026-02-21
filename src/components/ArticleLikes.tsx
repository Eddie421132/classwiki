import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { sendPushNotification } from '@/lib/pushNotification';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserAvatar } from '@/components/UserAvatar';

interface LikeUser {
  user_id: string;
  created_at: string;
  profiles: {
    real_name: string;
    avatar_url: string | null;
  } | null;
}

interface ArticleLikesProps {
  articleId: string;
}

export function ArticleLikes({ articleId }: ArticleLikesProps) {
  const { user, isAdmin } = useAuth();
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLikers, setShowLikers] = useState(false);

  useEffect(() => {
    fetchLikes();
  }, [articleId, user]);

  const fetchLikes = async () => {
    try {
      const { data, error } = await supabase
        .from('article_likes')
        .select(`
          user_id,
          created_at,
          profiles!article_likes_user_id_fkey(real_name, avatar_url)
        `)
        .eq('article_id', articleId);

      if (error) throw error;
      setLikes((data as unknown as LikeUser[]) || []);
      
      if (user) {
        setHasLiked(data?.some(like => like.user_id === user.id) || false);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setIsLoading(true);
    try {
      if (hasLiked) {
        const { error } = await supabase
          .from('article_likes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);

        if (error) throw error;
        setHasLiked(false);
        setLikes(likes.filter(like => like.user_id !== user.id));
      } else {
        const { error } = await supabase
          .from('article_likes')
          .insert({ article_id: articleId, user_id: user.id });

        if (error) throw error;
        setHasLiked(true);

        // Send push notification to article author
        const { data: article } = await supabase
          .from('articles')
          .select('author_id, title')
          .eq('id', articleId)
          .single();

        if (article && article.author_id !== user.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('real_name')
            .eq('user_id', user.id)
            .single();

          sendPushNotification({
            type: 'like',
            articleId,
            articleTitle: article.title,
            actorName: profile?.real_name || '未知用户',
            targetUserId: article.author_id,
          });
        }

        fetchLikes();
      }
    } catch (error: any) {
      console.error('Like error:', error);
      toast.error('操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        variant={hasLiked ? "default" : "outline"}
        size="sm"
        onClick={handleLike}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
        )}
        {likes.length} 赞
      </Button>

      {isAdmin && likes.length > 0 && (
        <Dialog open={showLikers} onOpenChange={setShowLikers}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Users className="w-4 h-4" />
              查看点赞用户
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>点赞用户 ({likes.length})</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {likes.map((like) => (
                <div key={like.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <UserAvatar
                    userId={like.user_id}
                    avatarUrl={like.profiles?.avatar_url}
                    fallback={like.profiles?.real_name}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium text-sm">{like.profiles?.real_name || '未知用户'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(like.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
