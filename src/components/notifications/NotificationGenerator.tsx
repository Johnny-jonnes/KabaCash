'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { generateNotifications } from '@/lib/notifications/generateNotifications';

/**
 * Fait tourner une fois par session les moteurs déterministes (score, prévisions,
 * intelligence, recommandations) pour alimenter le centre de notifications. Aucun
 * rendu — composant purement fonctionnel, monté une fois dans (app)/layout.tsx.
 */
export function NotificationGenerator() {
  const userId = useAuthStore((s) => s.user?.id);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!userId || hasRun.current) return;
    hasRun.current = true;
    generateNotifications(userId).catch((err) => {
      console.error('[KabaCash] Erreur génération des notifications:', err);
    });
  }, [userId]);

  return null;
}
