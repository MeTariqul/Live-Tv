import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Stream, ScheduleEntry, Recording, Announcement, SiteSettings } from '@/types';

export function useStream() {
  return useQuery({
    queryKey: ['stream'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data as Stream;
    },
    refetchInterval: 15000,
  });
}

export function useSchedule() {
  return useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('is_active', true)
        .order('day');
      if (error) throw error;
      return data as ScheduleEntry[];
    },
  });
}

export function useRecordings() {
  return useQuery({
    queryKey: ['recordings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('published', true)
        .eq('is_private', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Recording[];
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as SiteSettings;
    },
  });
}

export function useUpdateStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Stream>) => {
      const { data, error } = await supabase
        .from('streams')
        .upsert(updates)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stream'] }),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<SiteSettings>) => {
      const { data, error } = await supabase
        .from('settings')
        .upsert(updates)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
