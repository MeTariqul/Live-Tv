'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pin, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAnnouncements } from '@/hooks/use-data';
import toast from 'react-hot-toast';

export default function AdminAnnouncementsPage() {
  const { data: announcements } = useAnnouncements();
  const [items, setItems] = useState<any[]>(announcements || []);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), title: '', content: '', is_pinned: false, published: true, created_at: new Date().toISOString() }]);
  };

  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));
  const updateItem = (id: string, field: string, value: any) => setItems(items.map((i) => i.id === id ? { ...i, [field]: value } : i));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4" />New</Button>
          <Button size="sm" onClick={() => toast.success('Announcements saved')}><Save className="mr-2 h-4 w-4" />Save</Button>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input value={item.title} onChange={(e) => updateItem(item.id, 'title', e.target.value)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm font-medium" placeholder="Announcement title" />
                  <Button variant="ghost" size="icon" onClick={() => updateItem(item.id, 'is_pinned', !item.is_pinned)}>
                    <Pin className={`h-4 w-4 ${item.is_pinned ? 'text-yellow-500' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <textarea value={item.content} onChange={(e) => updateItem(item.id, 'content', e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" placeholder="Announcement content" />
                <div className="flex gap-2">
                  <Badge variant={item.published ? 'default' : 'secondary'}>{item.published ? 'Published' : 'Draft'}</Badge>
                  {item.is_pinned && <Badge variant="outline">Pinned</Badge>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {items.length === 0 && <p className="text-center text-muted-foreground py-8">No announcements. Click "New" to create one.</p>}
      </div>
    </div>
  );
}
