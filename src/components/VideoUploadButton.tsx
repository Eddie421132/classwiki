import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoUploadButtonProps {
  userId: string;
  onUpload: (url: string) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function VideoUploadButton({
  userId,
  onUpload,
  isLoading = false,
  setIsLoading,
  variant = 'outline',
  size = 'sm',
  className = '',
}: VideoUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('请选择视频文件');
      return;
    }

    // Max 50MB for videos
    if (file.size > 50 * 1024 * 1024) {
      toast.error('视频大小不能超过50MB');
      return;
    }

    setIsLoading?.(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/videos/${Date.now()}.${fileExt}`;

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
      toast.success('视频上传成功');
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error('视频上传失败');
    } finally {
      setIsLoading?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Video className="w-4 h-4" />
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}
