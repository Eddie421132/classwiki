import { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, MessageCircle, Reply, Trash2, User } from 'lucide-react';

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles: {
    real_name: string;
    avatar_url: string | null;
  } | null;
  replies?: Comment[];
}

interface ArticleCommentsProps {
  articleId: string;
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  userId?: string;
  isAdmin: boolean;
  replyToId: string | null;
  replyContent: string;
  isSubmitting: boolean;
  onReplyClick: (id: string, name: string) => void;
  onReplyContentChange: (value: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
  onDelete: (commentId: string) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const CommentItem = memo(({ 
  comment, 
  depth = 0, 
  userId, 
  isAdmin,
  replyToId,
  replyContent,
  isSubmitting,
  onReplyClick,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
  onDelete
}: CommentItemProps) => {
  const canDelete = userId && (userId === comment.user_id || isAdmin);
  const isReplying = replyToId === comment.id;
  
  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url || ''} />
          <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.profiles?.real_name || '未知用户'}</span>
            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
          <div className="flex items-center gap-2 mt-2">
            {userId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => onReplyClick(comment.id, comment.profiles?.real_name || '用户')}
              >
                <Reply className="w-3 h-3" />
                回复
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="w-3 h-3" />
                删除
              </Button>
            )}
          </div>
          
          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder={`回复 ${comment.profiles?.real_name || '用户'}...`}
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                rows={2}
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={isSubmitting || !replyContent.trim()}
                >
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  发送
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelReply}
                >
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              depth={depth + 1}
              userId={userId}
              isAdmin={isAdmin}
              replyToId={replyToId}
              replyContent={replyContent}
              isSubmitting={isSubmitting}
              onReplyClick={onReplyClick}
              onReplyContentChange={onReplyContentChange}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

CommentItem.displayName = 'CommentItem';

export function ArticleComments({ articleId }: ArticleCommentsProps) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('article_comments')
        .select(`
          *,
          profiles!article_comments_user_id_fkey(real_name, avatar_url)
        `)
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Organize comments into tree structure
      const commentsMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];
      
      (data as unknown as Comment[])?.forEach(comment => {
        comment.replies = [];
        commentsMap.set(comment.id, comment);
      });
      
      (data as unknown as Comment[])?.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          if (parent) {
            parent.replies?.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });
      
      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('请先登录');
      return;
    }
    if (!newComment.trim()) return;

    // Check for forbidden emoji
    if (newComment.includes('🤔')) {
      toast.error('评论中不能包含 🤔 表情');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('article_comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;
      setNewComment('');
      toast.success('评论发布成功');
      fetchComments();
    } catch (error: any) {
      console.error('Comment error:', error);
      toast.error('评论失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = useCallback(async (parentId: string) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    if (!replyContent.trim()) return;

    // Check for forbidden emoji
    if (replyContent.includes('🤔')) {
      toast.error('回复中不能包含 🤔 表情');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('article_comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          parent_id: parentId,
          content: replyContent.trim(),
        });

      if (error) throw error;
      setReplyContent('');
      setReplyToId(null);
      toast.success('回复成功');
      fetchComments();
    } catch (error: any) {
      console.error('Reply error:', error);
      toast.error('回复失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [articleId, replyContent, user]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('article_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      toast.success('评论已删除');
      fetchComments();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('删除失败');
    }
  }, []);

  const handleReplyClick = useCallback((id: string, name: string) => {
    setReplyToId(id);
    setReplyContent('');
  }, []);

  const handleReplyContentChange = useCallback((value: string) => {
    setReplyContent(value);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyToId(null);
    setReplyContent('');
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        评论 ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h3>

      {user ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <Textarea
            placeholder="写下你的评论..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            发布评论
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground text-sm">登录后可以发表评论</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length > 0 ? (
        <div className="divide-y divide-border">
          {comments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment}
              userId={user?.id}
              isAdmin={isAdmin}
              replyToId={replyToId}
              replyContent={replyContent}
              isSubmitting={isSubmitting}
              onReplyClick={handleReplyClick}
              onReplyContentChange={handleReplyContentChange}
              onSubmitReply={handleSubmitReply}
              onCancelReply={handleCancelReply}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">暂无评论</p>
      )}
    </div>
  );
}
