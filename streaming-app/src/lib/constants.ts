export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'StreamHub';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const STREAM_PLATFORM = (process.env.NEXT_PUBLIC_STREAM_PLATFORM || 'youtube') as 'youtube' | 'twitch';
export const YOUTUBE_VIDEO_ID = process.env.NEXT_PUBLIC_STREAM_EMBED_ID || '';
export const TWITCH_CHANNEL = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || '';

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/live', label: 'Live' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/streams', label: 'Past Streams' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/stream', label: 'Stream', icon: 'Radio' },
  { href: '/admin/schedule', label: 'Schedule', icon: 'Calendar' },
  { href: '/admin/recordings', label: 'Recordings', icon: 'Film' },
  { href: '/admin/announcements', label: 'Announcements', icon: 'Megaphone' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'BarChart3' },
  { href: '/admin/settings', label: 'Settings', icon: 'Settings' },
] as const;

export const DEFAULT_STREAM = {
  title: 'Live Stream',
  description: '',
  game: '',
  isLive: false,
  viewerCount: 0,
  thumbnailUrl: '',
};

export const SCHEDULE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
