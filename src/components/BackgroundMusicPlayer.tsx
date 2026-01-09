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

const EXT_TO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  flac: 'audio/flac',
  amr: 'audio/amr',
  '3gp': 'audio/3gpp',
  aiff: 'audio/aiff',
  aif: 'audio/aiff',
};

const getAudioExtFromUrl = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    return ext || null;
  } catch {
    const clean = url.split('?')[0];
    const ext = clean.split('.').pop()?.toLowerCase();
    return ext || null;
  }
};

const canBrowserProbablyPlayAudioUrl = (url: string) => {
  const ext = getAudioExtFromUrl(url);
  if (!ext) return true;

  const mime = EXT_TO_MIME[ext];
  if (!mime) return true;

  const el = document.createElement('audio');
  return el.canPlayType(mime) !== '';
};

export function BackgroundMusicPlayer({ musicUrl }: BackgroundMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  const initAudio = useCallback(() => {
    if (!musicUrl) return null;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = 0.3;
    audio.autoplay = true;

    // iOS/Safari friendliness
    try {
      audio.setAttribute('playsinline', '');
    } catch {
      // ignore
    }

    return audio;
  }, [musicUrl]);

  // Auto-play when audio is ready (may be blocked by browser policy)
  const tryAutoPlay = useCallback(async () => {
    if (!audioRef.current || hasAutoPlayed) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setHasAutoPlayed(true);
    } catch (err: any) {
      console.log('Auto-play blocked:', err?.name);
      // Not an error state: user can still click play.
      setIsPlaying(false);
    }
  }, [hasAutoPlayed]);

  useEffect(() => {
    if (!musicUrl) {
      setIsPlaying(false);
      setIsLoading(false);
      setHasError(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
    setIsPlaying(false);
    setHasAutoPlayed(false);

    if (!canBrowserProbablyPlayAudioUrl(musicUrl)) {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('当前浏览器不支持该音频格式，请上传 mp3/m4a/wav');
      return;
    }

    const audio = initAudio();
    if (!audio) return;

    audioRef.current = audio;

    const handleReady = () => {
      setIsLoading(false);
      void tryAutoPlay();
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    const handlePauseEvent = () => {
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e, audio.error, { src: musicUrl });
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('音频加载失败，请重试或更换音频格式');
    };

    const handleEnded = () => {
      audio.currentTime = 0;
      audio.play().catch(console.error);
    };

    audio.addEventListener('loadeddata', handleReady);
    audio.addEventListener('canplay', handleReady);
    audio.addEventListener('canplaythrough', handleReady);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePauseEvent);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    audio.src = musicUrl;
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('loadeddata', handleReady);
      audio.removeEventListener('canplay', handleReady);
      audio.removeEventListener('canplaythrough', handleReady);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePauseEvent);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.src = '';
      audioRef.current = null;
    };
  }, [musicUrl, initAudio, tryAutoPlay]);

  const handlePlay = async () => {
    if (!audioRef.current || !musicUrl) return;

    if (!canBrowserProbablyPlayAudioUrl(musicUrl)) {
      setHasError(true);
      setErrorMessage('当前浏览器不支持该音频格式，请上传 mp3/m4a/wav');
      return;
    }

    setHasError(false);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setIsMuted(false);
    } catch (err: any) {
      console.error('Play error:', err);
      setHasError(true);
      setErrorMessage(err?.name === 'NotAllowedError' ? '浏览器阻止播放，请再点一次' : '播放失败，请重试');
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

  const buttonText = isLoading
    ? '加载中...'
    : hasError
      ? errorMessage?.includes('不支持')
        ? '不支持格式'
        : '重试'
      : '播放';

  return (
    <div className="fixed top-20 right-4 z-50">
      {!isPlaying ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePlay}
          className="gap-2 shadow-lg backdrop-blur-sm bg-background/80"
          title={errorMessage || undefined}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {buttonText}
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
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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

