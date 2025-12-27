import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageLightbox } from '@/components/ImageLightbox';
import { AuthorBadge } from '@/components/AuthorBadge';
import { toast } from 'sonner';
import { Loader2, MessageCircle, Reply, Trash2, User, ImageIcon, X } from 'lucide-react';

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    real_name: string;
    avatar_url: string | null;
    status: string;
  } | null;
  replies?: Comment[];
}

interface UserRole {
  user_id: string;
  role: string;
}

interface ArticleCommentsProps {
  articleId: string;
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  userId?: string;
  isAdmin: boolean;
  userRoles: UserRole[];
  replyToId: string | null;
  replyContent: string;
  replyImage: string | null;
  isSubmitting: boolean;
  onReplyClick: (id: string, name: string) => void;
  onReplyContentChange: (value: string) => void;
  onReplyImageChange: (url: string | null) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
  onDelete: (commentId: string) => void;
  onImageUpload: (file: File) => Promise<string | null>;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper to get user role for display
const getUserRole = (userId: string, userRoles: UserRole[], profileStatus?: string): 'admin' | 'second_admin' | 'editor' | null => {
  const roles = userRoles.filter(r => r.user_id === userId);
  
  // Check for admin first
  if (roles.some(r => r.role === 'admin')) {
    return 'admin';
  }
  
  // Check for second admin
  if (roles.some(r => r.role === 'second_admin')) {
    return 'second_admin';
  }
  
  // Check if approved editor (has profile with approved status)
  if (profileStatus === 'approved') {
    return 'editor';
  }
  
  // Regular user - no badge
  return null;
};

const CommentItem = memo(({ 
  comment, 
  depth = 0, 
  userId, 
  isAdmin,
  userRoles,
  replyToId,
  replyContent,
  replyImage,
  isSubmitting,
  onReplyClick,
  onReplyContentChange,
  onReplyImageChange,
  onSubmitReply,
  onCancelReply,
  onDelete,
  onImageUpload
}: CommentItemProps) => {
  const canDelete = userId && (userId === comment.user_id || isAdmin);
  const isReplying = replyToId === comment.id;
  const replyImageInputRef = useRef<HTMLInputElement>(null);
  
  const userRole = getUserRole(comment.user_id, userRoles, comment.profiles?.status);

  const handleReplyImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    const url = await onImageUpload(file);
    if (url) {
      onReplyImageChange(url);
    }
  };
  
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
            <AuthorBadge role={userRole} size="sm" />
            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
          
          {comment.image_url && (
            <div className="mt-2">
              <ImageLightbox 
                src={comment.image_url} 
                alt="评论图片" 
                className="max-w-xs max-h-48 object-cover rounded-lg"
              />
            </div>
          )}
          
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
              
              {replyImage && (
                <div className="relative inline-block">
                  <img src={replyImage} alt="待上传图片" className="max-w-xs max-h-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => onReplyImageChange(null)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 items-center">
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
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => replyImageInputRef.current?.click()}
                  className="gap-1"
                >
                  <ImageIcon className="w-3 h-3" />
                  图片
                </Button>
                <input
                  ref={replyImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReplyImageSelect}
                  className="hidden"
                />
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
              userRoles={userRoles}
              replyToId={replyToId}
              replyContent={replyContent}
              replyImage={replyImage}
              isSubmitting={isSubmitting}
              onReplyClick={onReplyClick}
              onReplyContentChange={onReplyContentChange}
              onReplyImageChange={onReplyImageChange}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              onDelete={onDelete}
              onImageUpload={onImageUpload}
            />
          ))}
        </div>
      )}
    </div>
  );
});

CommentItem.displayName = 'CommentItem';

export function ArticleComments({ articleId }: ArticleCommentsProps) {
  const { user, isAdmin, isSecondAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newCommentImage, setNewCommentImage] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyImage, setReplyImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const [commentsResult, rolesResult] = await Promise.all([
        supabase
          .from('article_comments')
          .select(`
            *,
            profiles!article_comments_user_id_fkey(real_name, avatar_url, status)
          `)
          .eq('article_id', articleId)
          .order('created_at', { ascending: true }),
        supabase.rpc('get_admin_and_second_admin_roles')
      ]);

      if (commentsResult.error) throw commentsResult.error;
      if (rolesResult.error) throw rolesResult.error;
      
      // Set user roles (only admin + second_admin are exposed)
      setUserRoles((rolesResult.data || []) as UserRole[]);
      // Organize comments into tree structure
      const commentsMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];
      
      (commentsResult.data as unknown as Comment[])?.forEach(comment => {
        comment.replies = [];
        commentsMap.set(comment.id, comment);
      });
      
      (commentsResult.data as unknown as Comment[])?.forEach(comment => {
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

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/comments/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('articles')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('articles')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('图片上传失败');
      return null;
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    const url = await uploadImage(file);
    if (url) {
      setNewCommentImage(url);
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
          image_url: newCommentImage,
        });

      if (error) throw error;

      setNewComment('');
      setNewCommentImage(null);
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
          image_url: replyImage,
        });

      if (error) throw error;

      setReplyContent('');
      setReplyImage(null);
      setReplyToId(null);
      toast.success('回复成功');
      fetchComments();
    } catch (error: any) {
      console.error('Reply error:', error);
      toast.error('回复失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [articleId, replyContent, replyImage, user]);

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
    setReplyImage(null);
  }, []);

  const handleReplyContentChange = useCallback((value: string) => {
    setReplyContent(value);
  }, []);

  const handleReplyImageChange = useCallback((url: string | null) => {
    setReplyImage(url);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyToId(null);
    setReplyContent('');
    setReplyImage(null);
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
          
          {newCommentImage && (
            <div className="relative inline-block">
              <img src={newCommentImage} alt="待上传图片" className="max-w-xs max-h-32 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => setNewCommentImage(null)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              发布评论
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              className="gap-1"
            >
              <ImageIcon className="w-4 h-4" />
              添加图片
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </form>
      ) : (
        <p className="text-muted-foreground text-center py-4">
          请登录后发表评论
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">暂无评论</p>
      ) : (
        <div className="divide-y">
          {comments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment}
              userId={user?.id}
              isAdmin={isAdmin || isSecondAdmin}
              userRoles={userRoles}
              replyToId={replyToId}
              replyContent={replyContent}
              replyImage={replyImage}
              isSubmitting={isSubmitting}
              onReplyClick={handleReplyClick}
              onReplyContentChange={handleReplyContentChange}
              onReplyImageChange={handleReplyImageChange}
              onSubmitReply={handleSubmitReply}
              onCancelReply={handleCancelReply}
              onDelete={handleDeleteComment}
              onImageUpload={uploadImage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
