'use client';

import { useState } from 'react';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useCategories } from '@/hooks/useCategories';
import { SyncEngine } from '@/lib/sync/engine';
import { logActivity } from '@/lib/db/activity-logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { DBSpaceMember } from '@/types/database';

interface MemberPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: DBSpaceMember | null;
}

export function MemberPermissionsDialog({ open, onOpenChange, member }: MemberPermissionsDialogProps) {
  const { user } = useAuthStore();
  const expenseCategories = useCategories('expense');

  const [canAddTransaction, setCanAddTransaction] = useState(member?.can_add_transaction ?? true);
  const [canManageBudgets, setCanManageBudgets] = useState(member?.can_manage_budgets ?? false);
  const [canInviteMembers, setCanInviteMembers] = useState(member?.can_invite_members ?? false);
  const [canViewAllAccounts, setCanViewAllAccounts] = useState(member?.can_view_all_accounts ?? true);
  const [spendingLimit, setSpendingLimit] = useState(member?.spending_limit_per_txn != null ? String(member.spending_limit_per_txn) : '');
  const [forbiddenCategories, setForbiddenCategories] = useState<string[]>(member?.forbidden_categories ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const toggleForbidden = (name: string) => {
    setForbiddenCategories(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };

  const handleSave = async () => {
    if (!member || !user) return;
    const limitValue = spendingLimit.trim() === '' ? null : Math.max(0, Math.round(Number(spendingLimit)));
    if (spendingLimit.trim() !== '' && Number.isNaN(limitValue)) {
      toast.error('Montant invalide');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const updated: DBSpaceMember = {
        ...member,
        can_add_transaction: canAddTransaction,
        can_manage_budgets: canManageBudgets,
        can_invite_members: canInviteMembers,
        can_view_all_accounts: canViewAllAccounts,
        spending_limit_per_txn: limitValue,
        forbidden_categories: forbiddenCategories,
        updated_at: now,
        sync_status: 'pending',
      };
      await db.spaceMembers.put(updated);
      await SyncEngine.queueOperation('space_members', member.id, 'update', updated);
      await logActivity({
        user_id: user.id,
        entity_type: 'space',
        entity_id: member.space_id,
        action: 'update',
        description: `Permissions de "${member.full_name}" mises à jour`,
      });
      toast.success('Permissions enregistrées');
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissions de {member?.full_name}</DialogTitle>
          <DialogDescription>Ces règles sont réellement appliquées, pas seulement affichées : un membre restreint ne peut pas les contourner.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Label className="text-sm">Ajouter des transactions</Label>
              <p className="text-[11px] text-muted-foreground">Autoriser ce membre à enregistrer dépenses/revenus dans l&apos;espace.</p>
            </div>
            <Switch checked={canAddTransaction} onCheckedChange={setCanAddTransaction} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Label className="text-sm">Gérer les budgets</Label>
              <p className="text-[11px] text-muted-foreground">Créer, modifier ou supprimer des budgets de l&apos;espace.</p>
            </div>
            <Switch checked={canManageBudgets} onCheckedChange={setCanManageBudgets} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Label className="text-sm">Voir le code d&apos;invitation</Label>
              <p className="text-[11px] text-muted-foreground">Peut consulter et partager le code pour faire entrer de nouveaux membres.</p>
            </div>
            <Switch checked={canInviteMembers} onCheckedChange={setCanInviteMembers} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Label className="text-sm">Voir tous les comptes</Label>
              <p className="text-[11px] text-muted-foreground">Désactivé : ce membre ne voit que les comptes qu&apos;il a lui-même créés.</p>
            </div>
            <Switch checked={canViewAllAccounts} onCheckedChange={setCanViewAllAccounts} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-spending-limit">Limite par transaction (dépenses)</Label>
            <Input
              id="member-spending-limit"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Aucune limite"
              value={spendingLimit}
              onChange={(e) => setSpendingLimit(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Laissez vide pour ne fixer aucune limite.</p>
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

          <Button className="w-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
