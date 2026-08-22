'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { createAccessLevel } from '@/lib/spaces/spaceActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AccessLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
}

export function AccessLevelDialog({ open, onOpenChange, spaceId }: AccessLevelDialogProps) {
  const expenseCategories = useCategories('expense');

  const [label, setLabel] = useState('');
  const [canAddTransaction, setCanAddTransaction] = useState(true);
  const [canManageBudgets, setCanManageBudgets] = useState(false);
  const [canInviteMembers, setCanInviteMembers] = useState(false);
  const [canViewAllAccounts, setCanViewAllAccounts] = useState(true);
  const [spendingLimit, setSpendingLimit] = useState('');
  const [forbiddenCategories, setForbiddenCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setLabel('');
    setCanAddTransaction(true);
    setCanManageBudgets(false);
    setCanInviteMembers(false);
    setCanViewAllAccounts(true);
    setSpendingLimit('');
    setForbiddenCategories([]);
  };

  const toggleForbidden = (name: string) => {
    setForbiddenCategories(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };

  const handleCreate = async () => {
    if (!label.trim()) {
      toast.error('Donnez un nom à ce niveau d\'accès (ex: Vendeur, Comptable...)');
      return;
    }
    const limitValue = spendingLimit.trim() === '' ? null : Math.max(0, Math.round(Number(spendingLimit)));
    if (spendingLimit.trim() !== '' && Number.isNaN(limitValue)) {
      toast.error('Montant invalide');
      return;
    }

    setIsSaving(true);
    try {
      const level = await createAccessLevel(spaceId, {
        label: label.trim(),
        canAddTransaction,
        canManageBudgets,
        canInviteMembers,
        canViewAllAccounts,
        spendingLimitPerTxn: limitValue,
        forbiddenCategories,
      });
      toast.success(`Niveau "${level.label}" créé — code ${level.invite_code}`);
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[420px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau niveau d&apos;accès</DialogTitle>
          <DialogDescription>Un code d&apos;invitation dédié : quiconque l&apos;utilise pour rejoindre reçoit automatiquement ces permissions, sans réglage manuel après coup.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="level-label">Nom du niveau <span className="text-destructive">*</span></Label>
            <Input id="level-label" placeholder="Ex: Vendeur, Comptable, Stagiaire..." value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm">Ajouter des transactions</Label>
            <Switch checked={canAddTransaction} onCheckedChange={setCanAddTransaction} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm">Gérer les budgets</Label>
            <Switch checked={canManageBudgets} onCheckedChange={setCanManageBudgets} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm">Voir le code d&apos;invitation</Label>
            <Switch checked={canInviteMembers} onCheckedChange={setCanInviteMembers} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm">Voir tous les comptes</Label>
            <Switch checked={canViewAllAccounts} onCheckedChange={setCanViewAllAccounts} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level-limit">Limite par transaction (dépenses)</Label>
            <Input id="level-limit" type="number" inputMode="numeric" min={0} placeholder="Aucune limite" value={spendingLimit} onChange={(e) => setSpendingLimit(e.target.value)} />
          </div>

          {expenseCategories.length > 0 && (
            <div className="space-y-2">
              <Label>Catégories interdites</Label>
              <div className="flex flex-wrap gap-1.5">
                {expenseCategories.map(cat => {
                  const isForbidden = forbiddenCategories.includes(cat.name);
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => toggleForbidden(cat.name)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        isForbidden ? 'border-status-critical/40 bg-status-critical/10 text-status-critical' : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Button className="w-full" onClick={handleCreate} disabled={isSaving}>
            {isSaving ? 'Création...' : 'Créer le niveau et générer le code'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
