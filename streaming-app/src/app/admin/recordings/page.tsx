'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app';
import { generateId } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminRecordingsPage() {
  const recordings = useAppStore((s) => s.recordings);
  const setRecordings = useAppStore((s) => s.setRecordings);
  const [filter, setFilter] = useState<'all' | 'published' | 'private'>('all');

  const filtered = recordings.filter((r) => filter === 'all' ? true : filter === 'published' ? r.published && !r.is_private : r.is_private);

  const addRecording = () => {
    const rec = { id: generateId(), title: 'New Recording', description: '', video_id: '', platform: 'youtube' as const, thumbnail_url: '', duration: 0, view_count: 0, published: false, is_private: false, category: '', created_at: new Date().toISOString() };
    setRecordings([rec, ...recordings]);
    toast.success('Recording added');
  };

  const togglePublished = (id: string) => { setRecordings(recordings.map((r) => r.id === id ? { ...r, published: !r.published } : r)); };
  const togglePrivate = (id: string) => { setRecordings(recordings.map((r) => r.id === id ? { ...r, is_private: !r.is_private } : r)); };
  const removeRecording = (id: string) => { setRecordings(recordings.filter((r) => r.id !== id)); toast.success('Recording removed'); };
  const updateField = (id: string, field: string, value: string) => { setRecordings(recordings.map((r) => r.id === id ? { ...r, [field]: value } : r)); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recordings</h1>
        <div className="flex gap-2">
          {(['all', 'published', 'private'] as const).map((f) => (<Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>))}
          <Button size="sm" onClick={addRecording}><Plus className="mr-2 h-4 w-4" />Add</Button>
        </div>
      </div>
      <div className="space-y-3">
        {filtered.map((rec, i) => (
          <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <input value={rec.title} onChange={(e) => updateField(rec.id, 'title', e.target.value)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm font-medium" />
                <Badge variant={rec.is_private ? 'destructive' : rec.published ? 'default' : 'secondary'}>{rec.is_private ? 'Private' : rec.published ? 'Published' : 'Draft'}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <input value={rec.video_id} onChange={(e) => updateField(rec.id, 'video_id', e.target.value)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm" placeholder="YouTube/Twitch Video ID" />
                <input value={rec.category} onChange={(e) => updateField(rec.id, 'category', e.target.value)} className="w-40 rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Category" />
                <Button variant="ghost" size="icon" onClick={() => togglePrivate(rec.id)} title={rec.is_private ? 'Make public' : 'Make private'}>{rec.is_private ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                <Button variant="ghost" size="icon" onClick={() => togglePublished(rec.id)} title={rec.published ? 'Unpublish' : 'Publish'}><Save className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => removeRecording(rec.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent></Card>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No recordings found.</p>}
      </div>
    </div>
  );
}
