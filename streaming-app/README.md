# StreamHub - Live Streaming Platform

A production-ready, Vercel-compatible live streaming platform built with Next.js, TypeScript, and Supabase.

## Features

- **Embedded Live Player** - YouTube/Twitch integration with theater mode, fullscreen, and PiP
- **Stream Schedule** - Weekly schedule with automatic day grouping
- **Past Streams** - Recording archive with categories and search
- **Admin Dashboard** - Full control over stream settings, schedule, recordings, and announcements
- **Analytics** - Privacy-respecting visitor tracking
- **Dark/Light Mode** - System-aware theme switching
- **Responsive Design** - Works on desktop, tablet, and mobile
- **SEO Optimized** - Meta tags, OpenGraph, and structured content
- **Security** - CSP headers, JWT auth, rate limiting, XSS protection

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| State | Zustand |
| Data Fetching | TanStack Query |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth.js |
| Icons | Lucide React |
| Deployment | Vercel (free tier) |

## Getting Started

### 1. Clone and Install

```bash
cd streaming-app
npm install
```

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the contents of `supabase-schema.sql`
4. Copy your project URL and keys

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials and admin details.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Project Structure

```
streaming-app/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Home page
│   │   ├── live/         # Live stream page
│   │   ├── schedule/     # Stream schedule
│   │   ├── streams/      # Past streams
│   │   ├── about/        # About page
│   │   ├── contact/      # Contact form
│   │   ├── privacy/      # Privacy policy
│   │   └── admin/        # Admin dashboard
│   ├── components/       # Reusable UI components
│   ├── hooks/            # React Query hooks
│   ├── lib/              # Utilities, constants, Supabase
│   ├── stores/           # Zustand state stores
│   └── types/            # TypeScript type definitions
├── supabase-schema.sql   # Database schema
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind configuration
└── package.json          # Dependencies
```

## Admin Access

Navigate to `/admin/login` and sign in with the credentials defined in `.env.local`:

```
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password
```

## Database Schema

The platform uses 6 Supabase tables:

- `streams` - Current stream state (title, game, live status, viewer count)
- `schedule` - Weekly streaming schedule
- `recordings` - Past stream recordings
- `announcements` - Admin announcements
- `settings` - Site configuration
- `analytics_events` - Visitor analytics

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NEXTAUTH_SECRET` | Yes | NextAuth.js secret (64+ chars) |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `NEXT_PUBLIC_STREAM_PLATFORM` | No | `youtube` or `twitch` (default: youtube) |
| `NEXT_PUBLIC_STREAM_EMBED_ID` | No | YouTube video ID for live stream |
| `NEXT_PUBLIC_TWITCH_CHANNEL` | No | Twitch channel name |

## License

MIT
