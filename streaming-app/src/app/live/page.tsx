'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Maximize, Minimize, Share2, Radio, Users, Info, ExternalLink, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStream } from '@/hooks/use-data';
import { useUIStore } from '@/stores/ui';
import { STREAM_PLATFORM, YOUTUBE_VIDEO_ID, TWITCH_CHANNEL } from '@/lib/constants';
import { getYouTubeEmbedUrl, getTwitchEmbedUrl, cn } from '@/lib/utils';

export default function LivePage() {
  const { data: stream, isLoading } = useStream();
  const { theaterMode, toggleTheaterMode } = useUIStore();
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const isLive = stream?.is_live ?? false;

  const getEmbedUrl = useCallback(() => {
    if (STREAM_PLATFORM === 'youtube' && YOUTUBE_VIDEO_ID) {
      return getYouTubeEmbedUrl(YOUTUBE_VIDEO_ID, isLive);
    }
    if (STREAM_PLATFORM === 'twitch' && TWITCH_CHANNEL) {
      return getTwitchEmbedUrl(TWITCH_CHANNEL);
    }
    return '';
  }, [isLive]);

  const embedUrl = getEmbedUrl();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: stream?.title || 'Live Stream', url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Skeleton className="aspect-video w-full rounded-xl mb-6" />
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className={cn('mx-auto px-4 py-6 sm:px-6', theaterMode ? 'max-w-full' : 'max-w-7xl')}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Player */}
        <div className={cn(
          'relative overflow-hidden rounded-xl bg-black mb-6',
          theaterMode ? 'aspect-[21/9]' : 'aspect-video'
        )}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={stream?.title || 'Live Stream'}
            />
          ) : (
            <div className="flex h-full items-center justify-center flex-col gap-4">
              <Radio className="h-16 w-16 text-muted-foreground/30" />
              <p className="text-muted-foreground">No stream configured</p>
              <p className="text-xs text-muted-foreground/60">Set up your stream in the admin dashboard</p>
            </div>
          )}

          {/* Live indicator overlay */}
          {isLive && (
            <div className="absolute top-4 left-4 z-10">
              <Badge variant="live">
                <span className="h-1.5 w-1.5 rounded-full bg-white mr-1 animate-pulse" />
                LIVE
              </Badge>
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-black/50 backdrop-blur text-white border-0 hover:bg-black/70"
              onClick={toggleTheaterMode}
            >
              {theaterMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-black/50 backdrop-blur text-white border-0 hover:bg-black/70"
              onClick={handleShare}
            >
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Stream Info */}
        <div className={cn('grid gap-6', theaterMode ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-3')}>
          <div className={cn(theaterMode ? 'lg:col-span-2' : 'lg:col-span-2')}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold">{stream?.title || 'Live Stream'}</h1>
                {stream?.game && (
                  <p className="text-muted-foreground mt-1">{stream.game}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isLive && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {(stream?.viewer_count ?? 0).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {stream?.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">{stream.description}</p>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" /> Stream Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isLive ? 'live' : 'secondary'}>
                    {isLive ? 'Live' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="capitalize">{STREAM_PLATFORM}</span>
                </div>
                {stream?.started_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started</span>
                    <span>{new Date(stream.started_at).toLocaleTimeString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {embedUrl && (
              <Button asChild variant="outline" className="w-full">
                <a href={embedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Watch on {STREAM_PLATFORM === 'youtube' ? 'YouTube' : 'Twitch'}
                </a>
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
