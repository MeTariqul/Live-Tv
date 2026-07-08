'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Tv, Globe, Grid3X3, ChevronLeft, ChevronRight, X, Radio } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HLSPlayer } from '@/components/tv/hls-player';
import { cn } from '@/lib/utils';

interface TVChannel {
  id: string;
  name: string;
  logo: string;
  category: string;
  country: string;
  streamUrl: string;
}

interface TVResponse {
  channels: TVChannel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: { countries: string[]; categories: string[] };
}

const CATEGORY_ICONS: Record<string, string> = {
  News: '📰', Sports: '⚽', Movies: '🎬', Music: '🎵', Kids: '👶',
  Entertainment: '🎭', Education: '📚', Documentary: '🎞️', Religious: '🙏',
  Travel: '✈️', Cooking: '🍳', Weather: '🌤️', Lifestyle: '🏠', Business: '💼',
};

export default function TVPage() {
  const [channels, setChannels] = useState<TVChannel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [playingChannel, setPlayingChannel] = useState<TVChannel | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchChannels = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '100' });
      if (search) params.set('search', search);
      if (selectedCountry) params.set('country', selectedCountry);
      if (selectedCategory) params.set('category', selectedCategory);
      const res = await fetch(`/api/tv/channels?${params}`);
      const data: TVResponse = await res.json();
      setChannels(data.channels);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.filters) {
        setCountries(data.filters.countries);
        setCategories(data.filters.categories);
      }
    } catch { setChannels([]); }
    setLoading(false);
  }, [search, selectedCountry, selectedCategory]);

  useEffect(() => { fetchChannels(page); }, [page, fetchChannels]);

  useEffect(() => { setPage(1); }, [search, selectedCountry, selectedCategory]);

  const clearFilters = () => { setSearch(''); setSelectedCountry(''); setSelectedCategory(''); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Tv className="h-8 w-8" /> TV Channels</h1>
            <p className="text-muted-foreground mt-1">{total.toLocaleString()} channels from around the world</p>
          </div>
        </div>

        {playingChannel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
            <Card className="overflow-hidden">
              <div className="relative">
                <HLSPlayer src={playingChannel.streamUrl!} className="aspect-video" channelName={playingChannel.name} />
                <button onClick={() => setPlayingChannel(null)} className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {playingChannel.logo && <img src={playingChannel.logo} alt="" className="h-10 w-10 rounded object-contain bg-muted" />}
                  <div>
                    <h2 className="font-bold text-lg">{playingChannel.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {playingChannel.country && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{playingChannel.country}</span>}
                      {playingChannel.category && <Badge variant="secondary" className="text-xs">{playingChannel.category}</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search channels..." className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={cn(showFilters && 'bg-accent')}>
            <Filter className="mr-2 h-4 w-4" />Filters
            {(selectedCountry || selectedCategory) && <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">{(selectedCountry ? 1 : 0) + (selectedCategory ? 1 : 0)}</Badge>}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <Card>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Country</label>
                    <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                      <option value="">All Countries ({total.toLocaleString()})</option>
                      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-1.5"><Grid3X3 className="h-3.5 w-3.5" />Category</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                      <option value="">All Categories</option>
                      {categories.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c] || '📺'} {c}</option>)}
                    </select>
                  </div>
                </CardContent>
              </Card>
              {(selectedCountry || selectedCategory) && (
                <div className="flex gap-2 mt-3">
                  {selectedCountry && <Badge variant="secondary" className="gap-1">{selectedCountry}<button onClick={() => setSelectedCountry('')}><X className="h-3 w-3" /></button></Badge>}
                  {selectedCategory && <Badge variant="secondary" className="gap-1">{selectedCategory}<button onClick={() => setSelectedCategory('')}><X className="h-3 w-3" /></button></Badge>}
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-6">Clear all</Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-16">
            <Radio className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No channels found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
            {(search || selectedCountry || selectedCategory) && <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">Clear Filters</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {channels.map((ch) => (
              <motion.div key={ch.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.03 }}>
                <button onClick={() => setPlayingChannel(ch)} className="w-full text-left rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
                  <div className="aspect-video bg-muted relative flex items-center justify-center">
                    {ch.logo ? (
                      <img src={ch.logo} alt={ch.name} className="h-full w-full object-contain p-2" />
                    ) : (
                      <Tv className="h-8 w-8 text-muted-foreground/30" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-all shadow-lg">
                        <Radio className="h-5 w-5 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="live" className="text-[10px] px-1.5 py-0 h-4"><span className="h-1 w-1 rounded-full bg-white mr-1 animate-pulse" />LIVE</Badge>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="font-medium text-sm truncate">{ch.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {ch.country && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" />{ch.country}</span>}
                      {ch.category && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 truncate max-w-[100px]">{ch.category}</Badge>}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
