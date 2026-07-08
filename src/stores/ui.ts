'use client';

import { create } from 'zustand';

interface UIStore {
  theaterMode: boolean;
  chatOpen: boolean;
  mobileMenuOpen: boolean;
  setTheaterMode: (m: boolean) => void;
  toggleTheaterMode: () => void;
  setChatOpen: (o: boolean) => void;
  toggleChatOpen: () => void;
  setMobileMenuOpen: (o: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theaterMode: false,
  chatOpen: true,
  mobileMenuOpen: false,
  setTheaterMode: (m) => set({ theaterMode: m }),
  toggleTheaterMode: () => set((s) => ({ theaterMode: !s.theaterMode })),
  setChatOpen: (o) => set({ chatOpen: o }),
  toggleChatOpen: () => set((s) => ({ chatOpen: !s.chatOpen })),
  setMobileMenuOpen: (o) => set({ mobileMenuOpen: o }),
}));
