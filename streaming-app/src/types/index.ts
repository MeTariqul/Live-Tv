export interface Stream {
  id: string;
  title: string;
  description: string;
  game: string;
  is_live: boolean;
  viewer_count: number;
  thumbnail_url: string;
  platform: 'youtube' | 'twitch' | 'custom';
  embed_id: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleEntry {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  title: string;
  game: string;
  is_active: boolean;
  created_at: string;
}

export interface Recording {
  id: string;
  title: string;
  description: string;
  video_id: string;
  platform: 'youtube' | 'twitch';
  thumbnail_url: string;
  duration: number;
  view_count: number;
  published: boolean;
  is_private: boolean;
  category: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  site_description: string;
  social_links: Record<string, string>;
  embed_enabled: boolean;
  schedule_visible: boolean;
  recordings_hidden: boolean;
  maintenance_mode: boolean;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  page: string;
  visitor_id: string;
  user_agent: string;
  ip_country: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer';
}

export type Theme = 'light' | 'dark' | 'system';
