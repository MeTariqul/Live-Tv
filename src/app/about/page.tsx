'use client';

import { motion } from 'framer-motion';
import { Radio, Gamepad2, Heart, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SITE_NAME } from '@/lib/constants';

export default function AboutPage() {
  const values = [
    { icon: Radio, title: 'Quality Streams', description: 'High-quality gameplay content with professional production.' },
    { icon: Gamepad2, title: 'Gaming Passion', description: 'Dedicated to bringing you the best gaming moments.' },
    { icon: Heart, title: 'Community', description: 'Building a welcoming community of gamers and viewers.' },
    { icon: Shield, title: 'Safe Environment', description: 'Maintaining a safe and respectful space for everyone.' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">About {SITE_NAME}</h1>
        <p className="text-muted-foreground mb-8 text-lg">Your destination for live gaming content.</p>
        <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
          <p>Welcome to {SITE_NAME}, a dedicated live streaming platform for gaming content. We focus on delivering high-quality gameplay streams and a vibrant community.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full"><CardContent className="p-6"><v.icon className="h-8 w-8 text-primary mb-3" /><h3 className="font-semibold mb-1">{v.title}</h3><p className="text-sm text-muted-foreground">{v.description}</p></CardContent></Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
