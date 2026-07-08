import { NextResponse } from 'next/server';

const CHANNELS_API = 'https://iptv-org.github.io/api/channels.json';
const STREAMS_API = 'https://iptv-org.github.io/api/streams.json';

let channelsCache: any[] | null = null;
let streamsCache: Map<string, string> | null = null;
let lastFetch = 0;
const CACHE_TTL = 3600000;

async function fetchChannels() {
  if (channelsCache && Date.now() - lastFetch < CACHE_TTL) return channelsCache;
  const res = await fetch(CHANNELS_API, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Channels API error: ${res.status}`);
  channelsCache = await res.json();
  lastFetch = Date.now();
  return channelsCache!;
}

async function fetchStreams() {
  if (streamsCache) return streamsCache;
  const res = await fetch(STREAMS_API, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Streams API error: ${res.status}`);
  const data: any[] = await res.json();
  streamsCache = new Map();
  for (const s of data) {
    if (s.url) streamsCache.set(s.channel, s.url);
  }
  return streamsCache;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search')?.toLowerCase() || '';
    const country = searchParams.get('country') || '';
    const category = searchParams.get('category') || '';

    const [channels, streams] = await Promise.all([fetchChannels(), fetchStreams()]);

    let filtered = channels;
    if (search) {
      filtered = filtered.filter((c: any) =>
        c.name?.toLowerCase().includes(search) ||
        c.country?.toLowerCase().includes(search) ||
        c.category?.toLowerCase().includes(search)
      );
    }
    if (country) {
      filtered = filtered.filter((c: any) => c.country === country);
    }
    if (category) {
      filtered = filtered.filter((c: any) => c.category === category);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const result = paginated.map((c: any) => ({
      id: c.id,
      name: c.name,
      country: c.country,
      category: c.category,
      logo: c.logo,
      website: c.website,
      streamUrl: streams.get(c.id) || null,
    }));

    const countries = [...new Set(channels.map((c: any) => c.country).filter(Boolean))].sort();
    const categories = [...new Set(channels.map((c: any) => c.category).filter(Boolean))].sort();

    return NextResponse.json({
      channels: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: { countries, categories },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
