import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface BackgroundMusicPlayerProps {
  musicUrl: string | null;
}

export function BackgroundMusicPlayer({ musicUrl }: BackgroundMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!musicUrl) return;

    setIsLoading(true);
    setIsReady(false);
    setIsPlaying(false);

    const audio = new Audio();
    audioRef.current = audio;
    
    audio.addEventListener('canplaythrough', () => {
      setIsLoading(false);
      setIsReady(true);
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio load error:', e);
      setIsLoading(false);
      setIsReady(false);
    });

    audio.addEventListener('ended', () => {
      // Loop manually if needed
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });

    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = 'auto';
    audio.src = musicUrl;
    audio.load();

    // Try auto-play
    const tryAutoPlay = () => {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log('Auto-play prevented:', error);
          setIsPlaying(false);
        });
    };

    // Wait for ready then try auto-play
    audio.addEventListener('canplaythrough', tryAutoPlay, { once: true });

    // Cleanup: stop music when leaving the page
    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('canplaythrough', tryAutoPlay);
      audioRef.current = null;
    };
  }, [musicUrl]);

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = 0.3;
    } else {
      audioRef.current.volume = 0;
    }
    setIsMuted(!isMuted);
  };

  const handlePlay = () => {
    if (!audioRef.current) return;
    
    setIsLoading(true);
    
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        setIsMuted(false);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Play error:', err);
        setIsLoading(false);
      });
  };

  if (!musicUrl) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isPlaying ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePlay}
          disabled={isLoading}
          className="gap-2 shadow-lg"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
          {isLoading ? '加载中...' : '播放背景音乐'}
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleMute}
          className="shadow-lg"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}
