import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SpaceState {
  /** null = espace Personnel. Préférence locale à l'appareil : chacun peut naviguer un espace différent sur son propre téléphone. */
  activeSpaceId: string | null;
  setActiveSpaceId: (id: string | null) => void;
}

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set) => ({
      activeSpaceId: null,
      setActiveSpaceId: (id) => set({ activeSpaceId: id }),
    }),
    { name: 'kabacash-space-storage' }
  )
);
