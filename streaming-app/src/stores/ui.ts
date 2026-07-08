import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  theaterMode: boolean;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setTheaterMode: (mode: boolean) => void;
  toggleTheaterMode: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  theaterMode: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setTheaterMode: (mode) => set({ theaterMode: mode }),
  toggleTheaterMode: () => set((s) => ({ theaterMode: !s.theaterMode })),
}));
