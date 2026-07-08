import { NextResponse } from 'next/server';

const M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';

interface M3UChannel {
  id: string;
  name: string;
  logo: string;
  category: string;
  country: string;
  streamUrl: string;
}

let channelsCache: M3UChannel[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 3600000;

function parseM3U(m3u: string): M3UChannel[] {
  const lines = m3u.split('\n');
  const channels: M3UChannel[] = [];
  let idx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF:')) continue;

    const url = lines[i + 1]?.trim();
    if (!url || url.startsWith('#')) continue;
    i++;

    const nameMatch = line.match(/,(.+)$/);
    const name = nameMatch ? nameMatch[1].trim() : `Channel ${idx}`;
    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    const logo = logoMatch ? logoMatch[1] : '';
    const groupMatch = line.match(/group-title="([^"]*)"/);
    const category = groupMatch ? groupMatch[1] : '';
    const idMatch = line.match(/tvg-id="([^"]*)"/);
    const id = idMatch ? idMatch[1] : `ch_${idx}`;

    let country = '';
    if (id.includes('.')) {
      const parts = id.split('.');
      const code = parts[parts.length - 1]?.split('@')[0]?.toUpperCase() || '';
      if (code.length === 2) country = code;
    }

    channels.push({ id: `${id}_${idx}`, name, logo, category, country, streamUrl: url });
    idx++;
  }
  return channels;
}

async function fetchChannels(): Promise<M3UChannel[]> {
  if (channelsCache && Date.now() - cacheTime < CACHE_TTL) return channelsCache;

  const res = await fetch(M3U_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`M3U fetch error: ${res.status}`);
  const m3u = await res.text();
  channelsCache = parseM3U(m3u);
  cacheTime = Date.now();
  return channelsCache!;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search')?.toLowerCase() || '';
    const country = searchParams.get('country') || '';
    const category = searchParams.get('category') || '';

    const all = await fetchChannels();

    let filtered = all;
    if (search) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(search) ||
        c.country.toLowerCase().includes(search) ||
        c.category.toLowerCase().includes(search)
      );
    }
    if (country) filtered = filtered.filter((c) => c.country === country);
    if (category) filtered = filtered.filter((c) => c.category === category);

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const countries = [...new Set(all.map((c) => c.country).filter(Boolean))].sort();
    const categories = [...new Set(all.map((c) => c.category).filter(Boolean))].sort();

    return NextResponse.json({
      channels: paginated,
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
