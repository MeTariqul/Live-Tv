'use client';

import { motion } from 'framer-motion';
import { BarChart3, Eye, Users, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStream, useRecordings } from '@/hooks/use-data';

export default function AdminAnalyticsPage() {
  const { data: stream } = useStream();
  const { data: recordings } = useRecordings();
  const totalViews = recordings?.reduce((a, r) => a + (r.view_count || 0), 0) ?? 0;

  const metrics = [
    { title: 'Current Viewers', value: (stream?.viewer_count ?? 0).toLocaleString(), icon: Users, color: 'text-blue-500', change: '+0%' },
    { title: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-green-500', change: 'All time' },
    { title: 'Recordings', value: (recordings?.length ?? 0).toString(), icon: TrendingUp, color: 'text-purple-500', change: 'Published' },
    { title: 'Avg Duration', value: recordings?.length ? `${Math.round(recordings.reduce((a, r) => a + (r.duration || 0), 0) / recordings.length / 60)}m` : '0m', icon: Clock, color: 'text-orange-500', change: 'Per stream' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {metrics.map((m, i) => (
          <motion.div key={m.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${m.color}`}><m.icon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">{m.title}</p>
                    <p className="text-2xl font-bold">{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Analytics Overview</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Detailed analytics require a database integration (Supabase). Connect your Supabase project and set up the analytics table to see real-time data here.</p>
          <div className="mt-4 rounded-lg border p-4 text-sm">
            <p className="font-medium mb-2">To enable analytics, add to your Supabase database:</p>
            <code className="block bg-muted rounded-lg p-3 text-xs">
{`CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  page TEXT,
  visitor_id TEXT,
  user_agent TEXT,
  ip_country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
