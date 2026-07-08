export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'StreamHub';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const STREAM_PLATFORM = (process.env.NEXT_PUBLIC_STREAM_PLATFORM || 'youtube') as 'youtube' | 'twitch';
export const YOUTUBE_VIDEO_ID = process.env.NEXT_PUBLIC_STREAM_EMBED_ID || '';
export const TWITCH_CHANNEL = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || '';

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/live', label: 'Live' },
  { href: '/tv', label: 'TV Channels' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/streams', label: 'Past Streams' },
  { href: '/about', label: 'About' },
] as const;

export const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/stream', label: 'Stream', icon: 'Radio' },
  { href: '/admin/schedule', label: 'Schedule', icon: 'Calendar' },
  { href: '/admin/recordings', label: 'Recordings', icon: 'Film' },
  { href: '/admin/announcements', label: 'Announcements', icon: 'Megaphone' },
  { href: '/admin/settings', label: 'Settings', icon: 'Settings' },
] as const;

export const SCHEDULE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const DEFAULT_SCHEDULE = [
  { id: '1', day: 'Monday', start_time: '18:00', end_time: '22:00', title: 'Ranked Grind', game: 'Valorant', is_active: true },
  { id: '2', day: 'Wednesday', start_time: '19:00', end_time: '23:00', title: 'Chill Streams', game: 'Minecraft', is_active: true },
  { id: '3', day: 'Friday', start_time: '20:00', end_time: '00:00', title: 'Weekend Kickoff', game: '', is_active: true },
  { id: '4', day: 'Saturday', start_time: '14:00', end_time: '18:00', title: 'Afternoon Session', game: '', is_active: true },
];

export const DEFAULT_RECORDINGS = [
  { id: '1', title: 'Epic Valorant Clutch - Ace in Ranked', description: 'Insane 1v5 clutch in Diamond rank', video_id: 'dQw4w9WgXcQ', platform: 'youtube' as const, thumbnail_url: '', duration: 7200, view_count: 1542, published: true, is_private: false, category: 'Highlights', created_at: '2025-07-01T18:00:00Z' },
  { id: '2', title: 'Minecraft Survival Ep. 1', description: 'Starting a new survival world', video_id: 'dQw4w9WgXcQ', platform: 'youtube' as const, thumbnail_url: '', duration: 5400, view_count: 893, published: true, is_private: false, category: 'Full Stream', created_at: '2025-06-28T19:00:00Z' },
  { id: '3', title: 'Late Night Chill Gaming', description: 'Relaxed gaming with viewers', video_id: 'dQw4w9WgXcQ', platform: 'youtube' as const, thumbnail_url: '', duration: 10800, view_count: 2100, published: true, is_private: false, category: 'Full Stream', created_at: '2025-06-25T20:00:00Z' },
];

export const DEFAULT_ANNOUNCEMENTS = [
  { id: '1', title: 'New Schedule Starting Next Week!', content: 'Hey everyone! Starting next week, streams will move to 7PM on weekdays. See you there!', is_pinned: true, published: true, created_at: '2025-07-05T12:00:00Z' },
  { id: '2', title: 'Subscriber Special This Friday', content: 'This Friday we are doing a subscriber-only gaming session. Thanks for the support!', is_pinned: false, published: true, created_at: '2025-07-03T10:00:00Z' },
];
