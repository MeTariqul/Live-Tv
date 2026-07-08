'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import { SCHEDULE_DAYS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminSchedulePage() {
  const schedule = useAppStore((s) => s.schedule);
  const setSchedule = useAppStore((s) => s.setSchedule);
  const [entries, setEntries] = useState(schedule);

  const addEntry = () => setEntries([...entries, { id: generateId(), day: 'Monday', start_time: '18:00', end_time: '22:00', title: 'Gaming Session', game: '', is_active: true }]);
  const removeEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id));
  const updateEntry = (id: string, field: string, value: string) => setEntries(entries.map((e) => e.id === id ? { ...e, [field]: value } : e));
  const save = () => { setSchedule(entries); toast.success('Schedule saved'); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addEntry}><Plus className="mr-2 h-4 w-4" />Add Day</Button>
          <Button size="sm" onClick={save}><Save className="mr-2 h-4 w-4" />Save</Button>
        </div>
      </div>
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 flex flex-wrap items-center gap-3">
              <select value={entry.day} onChange={(e) => updateEntry(entry.id, 'day', e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">{SCHEDULE_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}</select>
              <input type="time" value={entry.start_time} onChange={(e) => updateEntry(entry.id, 'start_time', e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
              <span className="text-muted-foreground">to</span>
              <input type="time" value={entry.end_time} onChange={(e) => updateEntry(entry.id, 'end_time', e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
              <input value={entry.title} onChange={(e) => updateEntry(entry.id, 'title', e.target.value)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm min-w-[150px]" placeholder="Stream title" />
              <input value={entry.game} onChange={(e) => updateEntry(entry.id, 'game', e.target.value)} className="w-40 rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Game" />
              <Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent></Card>
          </motion.div>
        ))}
        {entries.length === 0 && <p className="text-center text-muted-foreground py-8">No schedule entries. Click "Add Day" to create one.</p>}
      </div>
    </div>
  );
}
