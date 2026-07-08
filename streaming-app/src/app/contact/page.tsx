'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">Contact</h1>
        <p className="text-muted-foreground mb-8">Have a question or want to get in touch? Send us a message.</p>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Send a Message</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="font-medium">Message sent!</p>
                <p className="text-sm text-muted-foreground">We will get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name</label>
                  <input type="text" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <input type="email" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Message</label>
                  <textarea required rows={5} className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" />
                </div>
                <Button type="submit" className="w-full"><Send className="mr-2 h-4 w-4" /> Send Message</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
