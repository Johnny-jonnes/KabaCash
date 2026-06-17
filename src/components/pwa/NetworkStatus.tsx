'use client';

import { useEffect, useRef } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';
import { SyncEngine } from '@/lib/sync/engine';
import { WifiOff, Wifi } from 'lucide-react';

export function NetworkStatus() {
  const isOnline = useOnlineStatus();
  const prevOnline = useRef<boolean | null>(null);

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
          console.error('[KabaCash] Erreur de synchronisation automatique:', err);
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
