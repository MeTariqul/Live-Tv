'use client';

import { create } from 'zustand';
import type { Theme } from '@/types';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: (typeof window !== 'undefined' ? localStorage.getItem('theme') as Theme : null) || 'system',
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(isDark ? 'dark' : 'light');
      } else {
        root.classList.add(theme);
      }
    }
  },
}));
