import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('settings').select('*').limit(1).single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ site_name: 'StreamHub', site_description: '', social_links: {}, embed_enabled: true, schedule_visible: true, recordings_hidden: false, maintenance_mode: false });
  }
}
