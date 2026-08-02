import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UIMode } from '@/types/enums';

// Ordre par défaut des cartes du tableau de bord — préférence 100% locale à l'appareil,
// jamais synchronisée (ce n'est pas une donnée financière).
export const DEFAULT_DASHBOARD_CARD_ORDER = [
  'score', 'balance', 'trends', 'insights', 'favorites', 'goals', 'charts', 'recent',
];

/**
 * Un utilisateur peut avoir un ordre persisté datant d'avant l'ajout d'une nouvelle
 * carte (ex: "goals" en Phase 3) : on l'ajoute à la fin plutôt que de la faire
 * disparaître, sans toucher à l'ordre personnalisé déjà en place.
 */
export function getEffectiveDashboardOrder(persistedOrder: string[]): string[] {
  const missing = DEFAULT_DASHBOARD_CARD_ORDER.filter(id => !persistedOrder.includes(id));
  return [...persistedOrder, ...missing];
}

interface UIState {
  uiMode: UIMode;
  setUIMode: (mode: UIMode) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  dashboardCardOrder: string[];
  setDashboardCardOrder: (order: string[]) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      uiMode: 'simple',
      setUIMode: (mode) => set({ uiMode: mode }),
      sidebarOpen: false,
      setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
      dashboardCardOrder: DEFAULT_DASHBOARD_CARD_ORDER,
      setDashboardCardOrder: (order) => set({ dashboardCardOrder: order }),
    }),
    {
      name: 'kabacash-ui-storage',
    }
  )
);
