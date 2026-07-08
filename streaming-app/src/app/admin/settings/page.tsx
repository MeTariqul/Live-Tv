'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Eye, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const siteSettings = useAppStore((s) => s.siteSettings);
  const setSiteSettings = useAppStore((s) => s.setSiteSettings);
  const [name, setName] = useState(siteSettings.site_name);

  const save = () => { setSiteSettings({ site_name: name }); toast.success('Settings saved'); };
  const toggle = (key: string) => { setSiteSettings({ [key]: !(siteSettings as any)[key] }); };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><label className="text-sm font-medium mb-1 block">Site Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /></div>
              <Button onClick={save}><Save className="mr-2 h-4 w-4" />Save</Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" /> Privacy</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: 'Hide Recordings', key: 'recordings_hidden' },
                { label: 'Show Schedule', key: 'schedule_visible' },
                { label: 'Enable Embedding', key: 'embed_enabled' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border">
                  <span>{item.label}</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors" onClick={() => toggle(item.key)}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(siteSettings as any)[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Share2 className="h-4 w-4" /> Social Links</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'YouTube', key: 'social_youtube' },
                { label: 'Twitch', key: 'social_twitch' },
                { label: 'Twitter', key: 'social_twitter' },
                { label: 'Discord', key: 'social_discord' },
              ].map((s) => (
                <div key={s.key}><label className="text-sm font-medium mb-1 block">{s.label}</label>
                <input value={(siteSettings as any)[s.key] || ''} onChange={(e) => setSiteSettings({ [s.key]: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder={`https://${s.label.toLowerCase()}.com/...`} /></div>
              ))}
              <Button onClick={save}><Save className="mr-2 h-4 w-4" />Save</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
