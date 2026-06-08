'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function SyncPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Compter le nombre d'éléments en attente de synchronisation
  const pendingItems = useLiveQuery(() => db.syncQueue.toArray()) || [];
  const pendingCount = pendingItems.length;

  const handleForceSync = async () => {
    setIsSyncing(true);
    // Simuler la tentative de synchronisation vers Supabase
    setTimeout(() => {
      toast.info('Synchronisation en cours de configuration', {
        description: 'Veuillez configurer vos clés API Supabase pour finaliser la synchronisation cloud.'
      });
      setIsSyncing(false);
    }, 1500);
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
            <h2 className="text-xl font-bold mb-2">Supabase Cloud</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sauvegarde automatique de vos données sécurisée dans le cloud.
            </p>

            <div className="bg-muted p-3 rounded-lg mb-6 flex justify-between items-center text-sm">
              <span className="font-medium text-muted-foreground">État actuel</span>
              {pendingCount > 0 ? (
                <span className="font-bold text-orange-500">{pendingCount} modif(s) en attente</span>
              ) : (
                <span className="font-bold text-emerald-500">À jour</span>
              )}
            </div>

            <Button 
              onClick={handleForceSync} 
              disabled={isSyncing || pendingCount === 0} 
              className="w-full gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}
