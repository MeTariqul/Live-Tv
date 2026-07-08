'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRecordings } from '@/hooks/use-data';
import toast from 'react-hot-toast';

export default function AdminRecordingsPage() {
  const { data: recordings } = useRecordings();
  const [filter, setFilter] = useState<'all' | 'published' | 'private'>('all');

  const filtered = recordings?.filter((r) => {
    if (filter === 'published') return r.published && !r.is_private;
    if (filter === 'private') return r.is_private;
    return true;
  }) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recordings</h1>
        <div className="flex gap-2">
          {(['all', 'published', 'private'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filtered.map((rec, i) => (
          <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{rec.title}</h3>
                    <Badge variant={rec.is_private ? 'destructive' : rec.published ? 'default' : 'secondary'}>
                      {rec.is_private ? 'Private' : rec.published ? 'Published' : 'Draft'}
                    </Badge>
                    {rec.category && <Badge variant="outline">{rec.category}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rec.video_id} &middot; {rec.platform}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" title={rec.is_private ? 'Make public' : 'Make private'}>
                    {rec.is_private ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No recordings found.</p>}
      </div>
    </div>
  );
}
