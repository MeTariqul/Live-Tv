-- Supabase Database Schema for Streaming Platform
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Live Stream',
  description TEXT DEFAULT '',
  game TEXT DEFAULT '',
  is_live BOOLEAN DEFAULT FALSE,
  viewer_count INTEGER DEFAULT 0,
  thumbnail_url TEXT DEFAULT '',
  platform TEXT DEFAULT 'youtube',
  embed_id TEXT DEFAULT '',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Stream',
  game TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_id TEXT NOT NULL,
  platform TEXT DEFAULT 'youtube',
  thumbnail_url TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  is_private BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  site_name TEXT DEFAULT 'StreamHub',
  site_description TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}',
  embed_enabled BOOLEAN DEFAULT TRUE,
  schedule_visible BOOLEAN DEFAULT TRUE,
  recordings_hidden BOOLEAN DEFAULT FALSE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  page TEXT,
  visitor_id TEXT,
  user_agent TEXT,
  ip_country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (site_name, site_description) VALUES ('StreamHub', 'Live Streaming Platform') ON CONFLICT DO NOTHING;

-- Insert default stream
INSERT INTO streams (title, platform) VALUES ('Live Stream', 'youtube') ON CONFLICT DO NOTHING;

-- RLS policies (Row Level Security)
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read access for non-sensitive tables
CREATE POLICY "Public can read streams" ON streams FOR SELECT USING (true);
CREATE POLICY "Public can read schedule" ON schedule FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read recordings" ON recordings FOR SELECT USING (published = true AND is_private = false);
CREATE POLICY "Public can read announcements" ON announcements FOR SELECT USING (published = true);
CREATE POLICY "Public can read settings" ON settings FOR SELECT USING (true);

-- Service role full access (for admin operations)
CREATE POLICY "Service role full access streams" ON streams FOR ALL USING (true);
CREATE POLICY "Service role full access schedule" ON schedule FOR ALL USING (true);
CREATE POLICY "Service role full access recordings" ON recordings FOR ALL USING (true);
CREATE POLICY "Service role full access announcements" ON announcements FOR ALL USING (true);
CREATE POLICY "Service role full access settings" ON settings FOR ALL USING (true);
CREATE POLICY "Service role full access analytics" ON analytics_events FOR ALL USING (true);
