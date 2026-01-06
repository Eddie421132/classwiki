import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudioUploadButtonProps {
  userId: string;
  currentUrl: string | null;
  onUpload: (url: string | null) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

export function AudioUploadButton({
  userId,
  currentUrl,
  onUpload,
  isLoading = false,
  setIsLoading,
}: AudioUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('请选择音频文件');
      return;
    }

    // Max 10MB for audio
    if (file.size > 10 * 1024 * 1024) {
      toast.error('音频大小不能超过10MB');
      return;
    }

    setIsLoading?.(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/music/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('articles')
        .upload(fileName, file, {
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('articles')
        .getPublicUrl(fileName);

      onUpload(publicUrl);
      toast.success('背景音乐上传成功');
    } catch (error) {
      console.error('Audio upload error:', error);
      toast.error('音频上传失败');
    } finally {
      setIsLoading?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={currentUrl ? 'secondary' : 'outline'}
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="gap-1"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Music className="w-4 h-4" />
        )}
        {currentUrl ? '更换音乐' : '背景音乐'}
      </Button>
      {currentUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onUpload(null)}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
