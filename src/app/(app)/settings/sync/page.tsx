'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { SyncEngine } from '@/lib/sync/engine';
import { useSyncStore } from '@/stores/syncStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SyncPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncTime = useSyncStore((s) => s.lastSyncTime);

  // Compter le nombre d'éléments en attente de synchronisation
  const pendingItems = useLiveQuery(() => db.syncQueue.toArray()) || [];
  const pendingCount = pendingItems.length;
  const itemsWithErrors = pendingItems.filter(i => i.retry_count > 0 && i.last_error);

  const handleForceSync = async () => {
    if (!navigator.onLine) {
      toast.warning('Pas de connexion', { description: 'La synchronisation reprendra automatiquement au retour du réseau.' });
      return;
    }
    setIsSyncing(true);
    try {
      await SyncEngine.processQueue(true);
      const error = useSyncStore.getState().syncError;
      if (error) {
        toast.error('Synchronisation incomplète', { description: error });
      } else {
        toast.success('Données synchronisées');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <Header title="Sauvegarde & Synchro" showBack />
      <div className="p-4 space-y-6">
        <div className="max-w-sm mx-auto mt-4 space-y-6">

          <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-sm">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              {pendingCount > 0 ? <CloudOff className="w-8 h-8" /> : <Cloud className="w-8 h-8" />}
            </div>
            <h2 className="text-xl font-bold mb-2">Cloud</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sauvegarde automatique de vos données sécurisée dans le cloud.
            </p>

            <div className="bg-muted p-3 rounded-lg mb-3 flex justify-between items-center text-sm">
              <span className="font-medium text-muted-foreground">État actuel</span>
              {pendingCount > 0 ? (
                <span className="font-bold text-status-warning">{pendingCount} modif(s) en attente</span>
              ) : (
                <span className="font-bold text-income">À jour</span>
              )}
            </div>

            {lastSyncTime && (
              <p className="text-xs text-muted-foreground mb-6">
                Dernière synchronisation : {formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true, locale: fr })}
              </p>
            )}

            <Button 
              onClick={handleForceSync} 
              disabled={isSyncing || pendingCount === 0} 
              className="w-full gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
            </Button>
          </div>

          {itemsWithErrors.length > 0 && (
            <div className="bg-status-critical/5 border border-status-critical/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-critical shrink-0" />
                <h3 className="text-sm font-semibold text-status-critical">
                  {itemsWithErrors.length} élément(s) bloqué(s)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Ces données restent en sécurité sur cet appareil, mais n&apos;ont pas pu atteindre le serveur. Message technique le plus récent :
              </p>
              <p className="text-xs font-mono bg-muted rounded-lg p-2 break-words text-foreground/80">
                {itemsWithErrors[0].last_error}
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
