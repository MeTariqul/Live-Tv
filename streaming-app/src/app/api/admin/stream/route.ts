import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('streams').select('*').order('created_at', { ascending: false }).limit(1).single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ is_live: false, title: 'Live Stream', viewer_count: 0, game: '', description: '', platform: 'youtube', embed_id: '' });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('streams').upsert({ ...body, updated_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update stream' }, { status: 500 });
  }
}
