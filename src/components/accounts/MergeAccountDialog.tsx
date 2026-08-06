'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAmount } from '@/lib/finance/format';
import { mergeAccountInto, previewAccountMerge, type MergePreview } from '@/lib/accounts/mergeAccount';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import type { DBAccount } from '@/types/database';

interface MergeAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceAccount: DBAccount | null;
  targetOptions: DBAccount[];
  onSuccess?: () => void;
}

export function MergeAccountDialog({ open, onOpenChange, sourceAccount, targetOptions, onSuccess }: MergeAccountDialogProps) {
  const { user } = useAuthStore();
  const [targetId, setTargetId] = useState('');
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sourceAccount || !targetId) return;
    let cancelled = false;
    previewAccountMerge(sourceAccount.id, targetId)
      .then((p) => { if (!cancelled) setPreview(p); })
      .catch(() => { if (!cancelled) setPreview(null); });
    return () => { cancelled = true; };
  }, [sourceAccount, targetId]);

  const handleTargetChange = (value: string) => {
    setTargetId(value);
    setPreview(null); // évite d'afficher un instant l'aperçu du choix précédent
  };

  const handleConfirm = async () => {
    if (!sourceAccount || !targetId || !user) return;
    setIsSubmitting(true);
    try {
      await mergeAccountInto(sourceAccount.id, targetId, user.id);
      toast.success(`Compte "${sourceAccount.name}" fusionné avec succès`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la fusion');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sourceAccount) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transférer &quot;{sourceAccount.name}&quot; vers...</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tout l&apos;historique et le solde de <strong>{sourceAccount.name}</strong> seront déplacés vers le compte choisi. <strong>{sourceAccount.name}</strong> sera ensuite fermé.
          </p>

          <Select value={targetId} onValueChange={handleTargetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir le compte de destination" />
            </SelectTrigger>
            <SelectContent>
              {targetOptions.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {preview && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <span className="truncate">{preview.sourceName}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{preview.targetName}</span>
              </div>
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>{preview.transactionCount} transaction{preview.transactionCount !== 1 ? 's' : ''} réassignée{preview.transactionCount !== 1 ? 's' : ''}</p>
                <p className="tabular-nums">Solde transféré : <strong>{formatAmount(preview.balanceToMove, preview.currency)}</strong></p>
              </div>
              <div className="flex items-start gap-2 text-xs text-status-warning bg-status-warning/10 rounded-lg p-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Cette action ferme définitivement &quot;{preview.sourceName}&quot;. Son historique reste consultable via &quot;{preview.targetName}&quot;.</span>
              </div>
            </div>
          )}

          <Button onClick={handleConfirm} disabled={!targetId || isSubmitting} className="w-full">
            {isSubmitting ? 'Fusion en cours...' : 'Confirmer le transfert'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
