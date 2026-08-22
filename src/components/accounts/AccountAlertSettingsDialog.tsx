'use client';

import { useState } from 'react';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { SyncEngine } from '@/lib/sync/engine';
import { logActivity } from '@/lib/db/activity-logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { DBAccount } from '@/types/database';

interface AccountAlertSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: DBAccount | null;
}

export function AccountAlertSettingsDialog({ open, onOpenChange, account }: AccountAlertSettingsDialogProps) {
  const { user } = useAuthStore();
  // Le parent remonte ce composant via `key={account.id}` à chaque changement de
  // compte : un état initial dérivé des props suffit, pas besoin de useEffect.
  const [lowBalance, setLowBalance] = useState(account?.low_balance_threshold != null ? String(account.low_balance_threshold) : '');
  const [largeTxn, setLargeTxn] = useState(account?.large_txn_threshold != null ? String(account.large_txn_threshold) : '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!account || !user) return;
    const lowValue = lowBalance.trim() === '' ? null : Math.max(0, Math.round(Number(lowBalance)));
    const largeValue = largeTxn.trim() === '' ? null : Math.max(0, Math.round(Number(largeTxn)));

    if ((lowBalance.trim() !== '' && Number.isNaN(lowValue)) || (largeTxn.trim() !== '' && Number.isNaN(largeValue))) {
      toast.error('Montant invalide');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const updated: DBAccount = {
        ...account,
        low_balance_threshold: lowValue,
        large_txn_threshold: largeValue,
        updated_at: now,
        sync_status: 'pending',
      };
      await db.accounts.put(updated);
      await SyncEngine.queueOperation('accounts', account.id, 'update', updated);
      await logActivity({
        user_id: user.id,
        entity_type: 'account',
        entity_id: account.id,
        action: 'update',
        new_values: { low_balance_threshold: lowValue, large_txn_threshold: largeValue },
        description: `Seuils d'alerte du compte "${account.name}" mis à jour`,
      });
      toast.success('Seuils d’alerte enregistrés');
      onOpenChange(false);
    } catch {
      toast.error('Erreur lors de l’enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Alertes du compte {account ? `"${account.name}"` : ''}</DialogTitle>
          <DialogDescription>
            Personnalisez à quel moment ce compte précis doit vous alerter, en plus des alertes automatiques.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="low-balance-threshold">Alerte si le solde descend sous</Label>
            <div className="relative">
              <Input
                id="low-balance-threshold"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Ex: 100000"
                className="pr-14"
                value={lowBalance}
                onChange={(e) => setLowBalance(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                {account?.currency || 'GNF'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Laissez vide pour garder la détection automatique.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="large-txn-threshold">Alerte pour toute transaction supérieure à</Label>
            <div className="relative">
              <Input
                id="large-txn-threshold"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Ex: 500000"
                className="pr-14"
                value={largeTxn}
                onChange={(e) => setLargeTxn(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                {account?.currency || 'GNF'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Laissez vide pour désactiver cette alerte.</p>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
