import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2, Play, Pause } from 'lucide-react';

interface BackgroundMusicPlayerProps {
  musicUrl: string | null;
}

// Supported audio formats - including phone recorder formats
const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',      // mp3
  'audio/mp3',       // mp3 alternate
  'audio/wav',       // wav
  'audio/wave',      // wav alternate
  'audio/x-wav',     // wav alternate
  'audio/ogg',       // ogg
  'audio/webm',      // webm
  'audio/aac',       // aac
  'audio/mp4',       // m4a
  'audio/x-m4a',     // m4a alternate
  'audio/m4a',       // m4a
  'audio/flac',      // flac
  'audio/x-flac',    // flac alternate
  'audio/3gpp',      // 3gp (phone recorder)
  'audio/amr',       // amr (phone recorder)
  'audio/x-aiff',    // aiff
  'audio/aiff',      // aiff
];

export function BackgroundMusicPlayer({ musicUrl }: BackgroundMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  const initAudio = useCallback(() => {
    if (!musicUrl) return null;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = 0.3;
    
    return audio;
  }, [musicUrl]);

  // Auto-play when audio is ready
  const tryAutoPlay = useCallback(async () => {
    if (!audioRef.current || hasAutoPlayed) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setHasAutoPlayed(true);
    } catch (err) {
      console.log('Auto-play blocked, waiting for user interaction');
      // Auto-play was blocked, user needs to click
      setIsPlaying(false);
    }
  }, [hasAutoPlayed]);

  useEffect(() => {
    if (!musicUrl) {
      setIsPlaying(false);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setHasAutoPlayed(false);

    const audio = initAudio();
    if (!audio) return;

    audioRef.current = audio;

    const handleCanPlay = () => {
      console.log('Audio can play');
      setIsLoading(false);
      tryAutoPlay();
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e, audio.error);
      setIsLoading(false);
      setHasError(true);
    };

    const handleEnded = () => {
      audio.currentTime = 0;
      audio.play().catch(console.error);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    audio.src = musicUrl;
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.src = '';
      audioRef.current = null;
    };
  }, [musicUrl, initAudio, tryAutoPlay]);

  const handlePlay = async () => {
    if (!audioRef.current) return;
    
    setIsLoading(true);
    
    try {
      if (hasError && musicUrl) {
        audioRef.current.src = musicUrl;
        audioRef.current.load();
        setHasError(false);
      }

      await audioRef.current.play();
      setIsPlaying(true);
      setIsMuted(false);
    } catch (err) {
      console.error('Play error:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = 0.3;
    } else {
      audioRef.current.volume = 0;
    }
    setIsMuted(!isMuted);
  };

  if (!musicUrl) return null;

  return (
    <div className="fixed top-20 right-4 z-50">
      {!isPlaying ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePlay}
          disabled={isLoading}
          className="gap-2 shadow-lg backdrop-blur-sm bg-background/80"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isLoading ? '加载中...' : hasError ? '重试' : '播放'}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleMute}
            className="shadow-lg backdrop-blur-sm bg-background/80"
            title={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handlePause}
            className="shadow-lg backdrop-blur-sm bg-background/80"
            title="暂停"
          >
            <Pause className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
