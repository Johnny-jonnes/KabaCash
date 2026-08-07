'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { seedDatabase } from '@/lib/db/seed';

/**
 * S'assure que les catégories par défaut existent réellement en base locale (et
 * pas seulement comme filet de secours en mémoire dans useCategories.ts) — sans
 * ça, la première catégorie personnalisée créée par l'utilisateur faisait
 * disparaître les catégories par défaut de la liste (voir seed.ts). Aucun rendu —
 * composant purement fonctionnel, monté une fois dans (app)/layout.tsx.
 */
export function CategorySeeder() {
  const userId = useAuthStore((s) => s.user?.id);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!userId || hasRun.current) return;
    hasRun.current = true;
    seedDatabase(userId).catch((err) => {
      console.error('[FinaX] Erreur d\'initialisation des catégories:', err);
    });
  }, [userId]);

  return null;
}
