'use client';

import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';
import { SyncEngine } from '@/lib/sync/engine';
import { useSyncStore } from '@/stores/syncStore';
import { WifiOff, Wifi } from 'lucide-react';

export function NetworkStatus() {
  const isOnline = useOnlineStatus();
  const prevOnline = useRef<boolean | null>(null);
  const pendingCount = useLiveQuery(() => db.syncQueue.count()) ?? 0;
  const setPendingCount = useSyncStore((s) => s.setPendingCount);

  // Garde le compteur global à jour pour tout composant qui lit useSyncStore
  // (ex: settings/sync) sans avoir à ré-écouter Dexie lui-même.
  useEffect(() => {
    setPendingCount(pendingCount);
  }, [pendingCount, setPendingCount]);

  // Flush au démarrage de l'app si des opérations attendaient déjà une connexion
  // (avant ce correctif, seul un basculement offline→online déclenchait une synchro :
  // rouvrir l'app en étant déjà en ligne laissait la file bloquée jusqu'au prochain toggle).
  useEffect(() => {
    if (navigator.onLine) {
      SyncEngine.processQueue().catch((err) => {
        console.error('[FinaX] Erreur de synchronisation au démarrage:', err);
      });
    }
  }, []);

  useEffect(() => {
    // Ne pas afficher de toast au premier rendu
    if (prevOnline.current === null) {
      prevOnline.current = isOnline;
      return;
    }

    // Changement de statut détecté
    if (prevOnline.current !== isOnline) {
      if (isOnline) {
        // Retour en ligne → notification + sync automatique
        toast.success('Connexion rétablie', {
          description: 'Synchronisation des données en cours...',
          icon: <Wifi className="w-4 h-4" />,
          duration: 4000,
        });

        // Lancer la synchronisation automatique
        SyncEngine.processQueue().catch((err) => {
          console.error('[FinaX] Erreur de synchronisation automatique:', err);
        });
      } else {
        // Passage hors-ligne → avertir l'utilisateur
        toast.warning('Mode hors-ligne', {
          description: 'Vos données sont sauvegardées localement. La synchronisation reprendra automatiquement.',
          icon: <WifiOff className="w-4 h-4" />,
          duration: 6000,
        });
      }

      prevOnline.current = isOnline;
    }
  }, [isOnline]);

  return null;
}
