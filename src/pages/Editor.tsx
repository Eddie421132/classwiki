import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RichTextEditor } from '@/components/RichTextEditor';
import { AudioUploadButton } from '@/components/AudioUploadButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Send, ImageIcon, X, Save, FileText } from 'lucide-react';
import { validateContent } from '@/lib/emojiValidator';

interface DraftData {
  id?: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  background_music_url: string | null;
}

export default function EditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isApprovedEditor, isLoading: authLoading } = useAuth();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Load draft (URL param preferred; legacy sessionStorage fallback)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const draftFromQuery = params.get('draft');

    const loadFromSessionStorage = () => {
      const savedDraft = sessionStorage.getItem('edit-draft');
      if (!savedDraft) return;
      try {
        const draft: DraftData = JSON.parse(savedDraft);
        setDraftId(draft.id || null);
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setCoverImage(draft.cover_image_url || null);
        setBackgroundMusic(draft.background_music_url || null);
      } catch (e) {
        console.error('Failed to load draft:', e);
      } finally {
        sessionStorage.removeItem('edit-draft');
      }
    };

    if (!draftFromQuery) {
      loadFromSessionStorage();
      return;
    }

    if (!user) return;

    const loadFromDb = async () => {
      setIsLoadingDraft(true);
      try {
        const { data, error } = await supabase
          .from('article_drafts')
          .select('id,title,content,cover_image_url,background_music_url')
          .eq('id', draftFromQuery)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast.error('草稿不存在或无权限访问');
          return;
        }

        setDraftId(data.id);
        setTitle(data.title || '');
        setContent(data.content || '');
        setCoverImage(data.cover_image_url || null);
        setBackgroundMusic(data.background_music_url || null);
      } catch (e) {
        console.error('Failed to load draft:', e);
        toast.error('加载草稿失败');
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadFromDb();
  }, [location.search, user]);

  // Auto-save draft every 30 seconds
  const saveDraft = useCallback(async ({ notify = false }: { notify?: boolean } = {}) => {
    if (!user || (!title.trim() && !content.trim())) return true;

    setIsSaving(true);
    try {
      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('article_drafts')
          .update({
            title: title.trim(),
            content,
            cover_image_url: coverImage,
            background_music_url: backgroundMusic,
          })
          .eq('id', draftId);

        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('article_drafts')
          .insert({
            user_id: user.id,
            title: title.trim(),
            content,
            cover_image_url: coverImage,
            background_music_url: backgroundMusic,
          })
          .select('id')
          .single();

        if (error) throw error;
        if (data) setDraftId(data.id);
      }

      setLastSaved(new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Save draft error:', error);
      if (notify) toast.error('草稿保存失败');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, draftId, title, content, coverImage, backgroundMusic]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (title.trim() || content.trim()) {
        void saveDraft();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [title, content, coverImage, backgroundMusic, saveDraft]);

  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && !isApprovedEditor))) {
      toast.error('您没有权限发布文章');
      navigate('/');
    }
  }, [user, isAdmin, isApprovedEditor, authLoading, navigate]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/covers/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('articles')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('articles')
        .getPublicUrl(fileName);

      setCoverImage(publicUrl);
      toast.success('封面图片上传成功');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('图片上传失败');
    }
  };

  const handleSaveDraft = async () => {
    const ok = await saveDraft({ notify: true });
    if (ok) toast.success('草稿已保存');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('请输入文章标题');
      return;
    }

    if (!content.trim() || content === '<p></p>') {
      toast.error('请输入文章内容');
      return;
    }

    // Validate content for forbidden emoji
    const validation = validateContent(title + content);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('articles').insert({
        title: title.trim(),
        content,
        cover_image_url: coverImage,
        background_music_url: backgroundMusic,
        author_id: user!.id,
        published: true,
      });

      if (error) throw error;

      // Delete draft if exists
      if (draftId) {
        await supabase.from('article_drafts').delete().eq('id', draftId);
      }

      toast.success('文章发布成功');
      navigate('/');
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error.message || '发布失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = async () => {
    if (title.trim() || content.trim()) {
      const ok = await saveDraft();
      if (ok) toast.success('草稿已自动保存');
    }
    navigate('/');
  };

  const formatSavedTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || isLoadingDraft || !user || (!isAdmin && !isApprovedEditor)) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleExit}>
            <X className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>编辑文章</span>
            {lastSaved && (
              <span className="text-xs">· 已保存于 {formatSavedTime(lastSaved)}</span>
            )}
            {isSaving && (
              <span className="text-xs">· 保存中...</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving} className="gap-1">
            <Save className="w-4 h-4" />
            保存草稿
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="gap-1">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            发布
          </Button>
          <AudioUploadButton
            userId={user.id}
            currentUrl={backgroundMusic}
            onUpload={setBackgroundMusic}
            isLoading={isUploadingMusic}
            setIsLoading={setIsUploadingMusic}
          />
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Title Input */}
          <Input
            placeholder="输入文章标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-serif font-bold border-none shadow-none focus-visible:ring-0 px-0 mb-6 placeholder:text-muted-foreground/50"
          />

          {/* Cover Image */}
          <div className="mb-6">
            {coverImage ? (
              <div className="relative group">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    更换封面
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setCoverImage(null)}
                  >
                    移除封面
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
                onClick={() => coverInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="w-8 h-8" />
                  <p>添加封面图片（可选）</p>
                  <p className="text-xs">支持 JPG, PNG, GIF，最大 5MB</p>
                </div>
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="min-h-[400px]">
            <RichTextEditor content={content} onChange={setContent} />
          </div>
        </div>
      </main>
    </div>
  );
}
