'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { pullAllMyData, subscribeToSpace } from '@/lib/sync/pull';

/**
 * Récupère les données (personnelles + espaces) une fois par session au
 * démarrage, puis maintient un abonnement Realtime sur l'espace actif pour que
 * les changements des autres membres apparaissent sans recharger la page.
 * Aucun rendu — composant purement fonctionnel, monté dans (app)/layout.tsx.
 */
export function SpaceSync() {
  const userId = useAuthStore((s) => s.user?.id);
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const hasPulled = useRef(false);

  useEffect(() => {
    if (!userId || hasPulled.current || typeof navigator === 'undefined' || !navigator.onLine) return;
    hasPulled.current = true;
    pullAllMyData(userId).catch((err) => {
      console.error('[KabaCash] Erreur de récupération des données distantes:', err);
    });
  }, [userId]);

  useEffect(() => {
    if (!activeSpaceId || typeof navigator === 'undefined' || !navigator.onLine) return;
    const unsubscribe = subscribeToSpace(activeSpaceId, () => {});
    return unsubscribe;
  }, [activeSpaceId]);

  return null;
}
