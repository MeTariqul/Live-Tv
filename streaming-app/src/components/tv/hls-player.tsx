'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HLSPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  channelName?: string;
}

function proxyUrl(url: string): string {
  return `/api/tv/proxy?url=${encodeURIComponent(url)}`;
}

export function HLSPlayer({ src, className, autoPlay = true, channelName }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retries, setRetries] = useState(0);

  const destroyHls = () => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
  };

  const loadStream = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video || !url) return;
    destroyHls();
    setError(null);
    setLoading(true);

    const proxied = proxyUrl(url);
    const isHls = url.includes('.m3u8') || url.includes('m3u8') || url.includes('.mpd');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startFragPrefetch: true,
        testBandwidth: false,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 3,
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 3,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 3,
      });
      hlsRef.current = hls;

      hls.loadSource(proxied);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        setRetries(0);
        if (autoPlay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          if (retries < 2) {
            setRetries((r) => r + 1);
            setTimeout(() => hls.startLoad(), 2000);
          } else {
            setError('Stream offline or unavailable');
            setLoading(false);
          }
        } else {
          setError('Stream format not supported');
          setLoading(false);
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxied;
      video.onloadedmetadata = () => { setLoading(false); if (autoPlay) video.play().catch(() => {}); };
      video.onerror = () => { setError('Stream unavailable'); setLoading(false); };
    } else {
      video.src = proxied;
      video.onloadeddata = () => { setLoading(false); if (autoPlay) video.play().catch(() => {}); };
      video.onerror = () => { setError('Stream unavailable'); setLoading(false); };
    }
  }, [autoPlay, retries]);

  useEffect(() => {
    if (src) { setRetries(0); loadStream(src); }
    return destroyHls;
  }, [src]);

  const togglePlay = () => { const v = videoRef.current; if (!v) return; v.paused ? (v.play(), setIsPlaying(true)) : (v.pause(), setIsPlaying(false)); };
  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setIsMuted(v.muted); };
  const toggleFullscreen = () => { const v = videoRef.current; if (!v) return; document.fullscreenElement ? document.exitFullscreen() : v.requestFullscreen(); };
  const handleRetry = () => { setRetries(0); loadStream(src); };

  return (
    <div className={cn('relative group bg-black rounded-lg overflow-hidden', className)}>
      <video ref={videoRef} className="w-full h-full object-contain" playsInline muted={isMuted} onClick={togglePlay} />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-center space-y-3">
            <div className="h-10 w-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-white/70 text-sm">Loading stream...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center space-y-3 px-6">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
            <p className="text-white text-sm font-medium">{error}</p>
            {channelName && <p className="text-white/50 text-xs">{channelName}</p>}
            <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2 border-white/20 text-white hover:bg-white/10">
              <RefreshCw className="mr-2 h-3 w-3" />Retry
            </Button>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={toggleMute}>
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <div className="flex-1" />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={toggleFullscreen}>
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
