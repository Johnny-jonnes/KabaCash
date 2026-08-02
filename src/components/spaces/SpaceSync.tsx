'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { pullAllMyData, subscribeToSpace, subscribeToUserData } from '@/lib/sync/pull';

/**
 * Récupère les données (personnelles + espaces) une fois par session au
 * démarrage, puis maintient deux abonnements Realtime : un sur les données
 * personnelles du compte (synchro multi-appareils du même utilisateur — sans
 * ça, un second appareil déjà ouvert ne voyait jamais les changements faits sur
 * le premier) et un sur l'espace actif (changements des autres membres). Un
 * retour de connexion déclenche aussi un re-pull, au cas où le canal Realtime
 * ait été coupé pendant la période hors-ligne. Aucun rendu — composant
 * purement fonctionnel, monté dans (app)/layout.tsx.
 */
export function SpaceSync() {
  const userId = useAuthStore((s) => s.user?.id);
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const hasPulled = useRef(false);

  useEffect(() => {
    if (!userId || hasPulled.current || typeof navigator === 'undefined' || !navigator.onLine) return;
    hasPulled.current = true;
    pullAllMyData(userId).catch((err) => {
      console.error('[FinaX] Erreur de récupération des données distantes:', err);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId || typeof navigator === 'undefined') return;
    const unsubscribe = subscribeToUserData(userId, () => {});

    const handleOnline = () => {
      pullAllMyData(userId).catch((err) => {
        console.error('[FinaX] Erreur de récupération des données distantes:', err);
      });
    };
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, [userId]);

  useEffect(() => {
    if (!activeSpaceId || typeof navigator === 'undefined' || !navigator.onLine) return;
    const unsubscribe = subscribeToSpace(activeSpaceId, () => {});
    return unsubscribe;
  }, [activeSpaceId]);

  return null;
}
