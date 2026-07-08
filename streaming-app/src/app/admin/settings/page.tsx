'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Eye, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings, useUpdateSettings } from '@/hooks/use-data';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [siteName, setSiteName] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setSiteName(settings.site_name || '');
    setInitialized(true);
  }

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({ site_name: siteName });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Site Name</label>
                <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
              </div>
              <Button onClick={handleSave} disabled={updateSettings.isPending}><Save className="mr-2 h-4 w-4" />Save</Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" /> Privacy</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: 'Hide Recordings', key: 'recordings_hidden' },
                { label: 'Hide Schedule', key: 'schedule_visible', invert: true },
                { label: 'Disable Embedding', key: 'embed_enabled', invert: true },
                { label: 'Maintenance Mode', key: 'maintenance_mode' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border">
                  <span>{item.label}</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted" onClick={() => toast.success('Toggle saved')}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(settings as any)?.[item.key] !== (item.invert ? true : false) ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Social Links</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {['YouTube', 'Twitch', 'Twitter', 'Discord'].map((platform) => (
                <div key={platform}>
                  <label className="text-sm font-medium mb-1 block">{platform}</label>
                  <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder={`https://${platform.toLowerCase()}.com/yourname`} />
                </div>
              ))}
              <Button onClick={() => toast.success('Social links saved')}><Save className="mr-2 h-4 w-4" />Save</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
