import { create } from 'zustand';
import type { Stream, ScheduleEntry, Recording, Announcement } from '@/types';

interface StreamStore {
  stream: Stream | null;
  schedule: ScheduleEntry[];
  recordings: Recording[];
  announcements: Announcement[];
  isLive: boolean;
  setStream: (stream: Stream | null) => void;
  setSchedule: (schedule: ScheduleEntry[]) => void;
  setRecordings: (recordings: Recording[]) => void;
  setAnnouncements: (announcements: Announcement[]) => void;
  setIsLive: (isLive: boolean) => void;
}

export const useStreamStore = create<StreamStore>((set) => ({
  stream: null,
  schedule: [],
  recordings: [],
  announcements: [],
  isLive: false,
  setStream: (stream) => set({ stream }),
  setSchedule: (schedule) => set({ schedule }),
  setRecordings: (recordings) => set({ recordings }),
  setAnnouncements: (announcements) => set({ announcements }),
  setIsLive: (isLive) => set({ isLive }),
}));
