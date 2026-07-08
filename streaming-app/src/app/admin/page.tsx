'use client';

import { motion } from 'framer-motion';
import { Radio, Users, Film, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStream, useRecordings, useSchedule } from '@/hooks/use-data';

export default function AdminDashboard() {
  const { data: stream } = useStream();
  const { data: recordings } = useRecordings();
  const { data: schedule } = useSchedule();
  const isLive = stream?.is_live ?? false;

  const stats = [
    { title: 'Stream Status', value: isLive ? 'Live' : 'Offline', icon: Radio, color: isLive ? 'text-red-500' : 'text-muted-foreground' },
    { title: 'Viewer Count', value: (stream?.viewer_count ?? 0).toLocaleString(), icon: Users, color: 'text-blue-500' },
    { title: 'Recordings', value: recordings?.length ?? 0, icon: Film, color: 'text-purple-500' },
    { title: 'Schedule Days', value: schedule?.length ?? 0, icon: Calendar, color: 'text-green-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-muted ${s.color}`}><s.icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.title}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Current Stream</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span>{stream?.title || 'Not set'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Game</span><span>{stream?.game || 'Not set'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={isLive ? 'live' : 'secondary'}>{isLive ? 'Live' : 'Offline'}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="capitalize">{stream?.platform || 'YouTube'}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <a href="/admin/stream" className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent transition-colors"><Radio className="h-4 w-4" />Manage Stream</a>
            <a href="/admin/schedule" className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent transition-colors"><Calendar className="h-4 w-4" />Edit Schedule</a>
            <a href="/admin/recordings" className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent transition-colors"><Film className="h-4 w-4" />Manage Recordings</a>
            <a href="/admin/analytics" className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent transition-colors"><TrendingUp className="h-4 w-4" />View Analytics</a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
