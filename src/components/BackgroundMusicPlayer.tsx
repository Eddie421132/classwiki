import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface BackgroundMusicPlayerProps {
  musicUrl: string | null;
}

export function BackgroundMusicPlayer({ musicUrl }: BackgroundMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!musicUrl) return;

    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    // Auto-play when component mounts
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log('Auto-play prevented:', error);
          setIsPlaying(false);
        });
    }

    // Cleanup: stop music when leaving the page
    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [musicUrl]);

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = 0.3;
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } else {
      audioRef.current.volume = 0;
    }
    setIsMuted(!isMuted);
  };

  const handlePlay = () => {
    if (!audioRef.current) return;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      setIsMuted(false);
    }).catch(() => {});
  };

  if (!musicUrl) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isPlaying ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePlay}
          className="gap-2 shadow-lg"
        >
          <Volume2 className="w-4 h-4" />
          播放背景音乐
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
