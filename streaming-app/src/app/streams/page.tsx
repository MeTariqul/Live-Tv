'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Clock, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecordings } from '@/hooks/use-data';
import { formatDate } from '@/lib/utils';

export default function StreamsPage() {
  const { data: recordings, isLoading } = useRecordings();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Past Streams</h1>
        <p className="text-muted-foreground mb-8">Browse previous broadcasts and highlights.</p>
        {recordings && recordings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recordings.map((rec) => (
              <Card key={rec.id} id={rec.id} className="overflow-hidden hover:border-primary/40 transition-colors group">
                <div className="relative aspect-video bg-muted">
                  {rec.thumbnail_url ? (
                    <Image src={rec.thumbnail_url} alt={rec.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Play className="h-12 w-12 text-muted-foreground/30" /></div>
                  )}
                  {rec.duration > 0 && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white flex items-center gap-1">
                      <Clock className="h-3 w-3" />{Math.floor(rec.duration / 60)}:{String(rec.duration % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">{rec.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{formatDate(rec.created_at)}</span>
                    {rec.view_count > 0 && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{rec.view_count.toLocaleString()}</span>}
                    {rec.category && <Badge variant="secondary">{rec.category}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No past streams available yet.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
