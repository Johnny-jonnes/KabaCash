import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UIMode } from '@/types/enums';

interface UIState {
  uiMode: UIMode;
  setUIMode: (mode: UIMode) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      uiMode: 'simple',
      setUIMode: (mode) => set({ uiMode: mode }),
      sidebarOpen: false,
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
    }),
    {
      name: 'kabacash-ui-storage',
    }
  )
);
