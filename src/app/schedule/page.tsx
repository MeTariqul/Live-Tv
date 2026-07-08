'use client';

import { motion } from 'framer-motion';
import { Clock, Gamepad2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app';
import { SCHEDULE_DAYS } from '@/lib/constants';

export default function SchedulePage() {
  const schedule = useAppStore((s) => s.schedule);
  const grouped = SCHEDULE_DAYS.map((day) => ({ day, entries: schedule.filter((s) => s.day === day) }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Stream Schedule</h1>
        <p className="text-muted-foreground mb-8">Weekly streaming schedule. All times are in your local timezone.</p>
        <div className="space-y-3">
          {grouped.map(({ day, entries }) => (
            <Card key={day} className={entries.length === 0 ? 'opacity-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 font-bold text-sm">{day}</div>
                  <div className="flex-1">
                    {entries.length > 0 ? entries.map((e) => (
                      <div key={e.id} className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{e.start_time} - {e.end_time}</span>
                        <span className="text-sm text-muted-foreground">{e.title}</span>
                        {e.game && <Badge variant="secondary"><Gamepad2 className="mr-1 h-3 w-3" />{e.game}</Badge>}
                      </div>
                    )) : <span className="text-sm text-muted-foreground">No stream scheduled</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
