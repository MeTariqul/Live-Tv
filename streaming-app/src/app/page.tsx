'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Radio, Calendar, Clock, Play, ArrowRight, Users, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import { SITE_NAME } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

export default function HomePage() {
  const stream = useAppStore((s) => s.stream);
  const schedule = useAppStore((s) => s.schedule);
  const recordings = useAppStore((s) => s.recordings);
  const isLive = stream.is_live;
  const nextStream = schedule.find((s) => s.is_active);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative mb-12 overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-background to-purple-500/10 p-8 sm:p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            {isLive ? <Badge variant="live">LIVE NOW</Badge> : <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Offline</Badge>}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Welcome to {SITE_NAME}</h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">{stream.description || 'Watch live streams, past broadcasts, and stay updated.'}</p>
          <div className="flex flex-wrap gap-3">
            {isLive ? (
              <Link href="/live"><Button size="lg" className="bg-red-500 hover:bg-red-600 text-white"><Radio className="mr-2 h-4 w-4" /> Watch Live</Button></Link>
            ) : nextStream ? (
              <Link href="/schedule"><Button size="lg"><Calendar className="mr-2 h-4 w-4" /> View Schedule</Button></Link>
            ) : null}
            <Link href="/streams"><Button size="lg" variant="outline"><Play className="mr-2 h-4 w-4" /> Past Streams</Button></Link>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/5 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
      </motion.section>

      {/* Live Preview */}
      {isLive && (
        <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-12">
          <Link href="/live" className="group block">
            <Card className="overflow-hidden border-red-500/20 hover:border-red-500/40 transition-colors">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted flex items-center justify-center">
                  <Radio className="h-16 w-16 text-red-500 animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="live">LIVE</Badge>
                      {stream.viewer_count > 0 && <span className="flex items-center gap-1 text-xs text-white/80"><Users className="h-3 w-3" /> {stream.viewer_count.toLocaleString()}</span>}
                    </div>
                    <h2 className="text-xl font-bold text-white">{stream.title}</h2>
                    {stream.game && <p className="text-sm text-white/70">{stream.game}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.section>
      )}

      {/* Stats */}
      <section className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Radio, label: 'Streams', value: recordings.length },
          { icon: Users, label: 'Total Views', value: recordings.reduce((a, r) => a + r.view_count, 0).toLocaleString() },
          { icon: Calendar, label: 'Schedule', value: schedule.length ? `${schedule.length} days` : 'TBD' },
          { icon: Zap, label: 'Status', value: isLive ? 'Live' : 'Offline' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }}>
            <Card><CardContent className="p-4 text-center"><stat.icon className="mx-auto h-5 w-5 text-muted-foreground mb-2" /><div className="text-2xl font-bold">{stat.value}</div><div className="text-xs text-muted-foreground">{stat.label}</div></CardContent></Card>
          </motion.div>
        ))}
      </section>

      {/* Schedule */}
      {schedule.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Stream Schedule</h2>
            <Link href="/schedule" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {schedule.slice(0, 6).map((entry) => (
              <Card key={entry.id}><CardContent className="p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">{entry.day.slice(0, 3)}</div><div><p className="font-medium text-sm">{entry.title}</p><p className="text-xs text-muted-foreground">{entry.start_time} - {entry.end_time}</p></div></div></CardContent></Card>
            ))}
          </div>
        </section>
      )}

      {/* Recordings */}
      {recordings.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Streams</h2>
            <Link href="/streams" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recordings.slice(0, 6).map((rec) => (
              <Link key={rec.id} href={`/streams#${rec.id}`}>
                <Card className="overflow-hidden hover:border-primary/40 transition-colors group">
                  <div className="relative aspect-video bg-muted flex items-center justify-center"><Play className="h-12 w-12 text-muted-foreground/30" />
                    {rec.duration > 0 && <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">{Math.floor(rec.duration / 60)}:{String(rec.duration % 60).padStart(2, '0')}</div>}
                  </div>
                  <CardContent className="p-4"><h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">{rec.title}</h3><p className="text-xs text-muted-foreground mt-1">{formatDate(rec.created_at)}</p></CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
