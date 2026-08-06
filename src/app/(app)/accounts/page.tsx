'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { AccountCard } from '@/components/accounts/AccountCard';
import { AccountForm } from '@/components/accounts/AccountForm';
import { MergeAccountDialog } from '@/components/accounts/MergeAccountDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { toast } from 'sonner';
import { SyncEngine } from '@/lib/sync/engine';
import { logActivity } from '@/lib/db/activity-logger';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import type { DBAccount } from '@/types/database';

export default function AccountsPage() {
  const { user } = useAuthStore();
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<DBAccount | null>(null);
  const [accountToMerge, setAccountToMerge] = useState<DBAccount | null>(null);

  const allAccounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const activeAccounts = allAccounts.filter(a => !a.deleted_at);
  const accounts = filterBySpace(activeAccounts, activeSpaceId);
  // Cible de fusion : tous les comptes actifs de l'utilisateur, pas seulement ceux de
  // l'espace affiché — l'exemple type est justement "Personnel -> Compte Entreprise".
  const mergeTargets = activeAccounts.filter(a => a.id !== accountToMerge?.id);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const cashAccounts = accounts.filter(a => a.type === 'cash');
  const mmAccounts = accounts.filter(a => a.type === 'mobile_money');
  const bankAccounts = accounts.filter(a => a.type === 'bank');
  const bizAccounts = accounts.filter(a => a.type === 'business');

  const handleDeleteAccount = async () => {
    if (!accountToDelete || !user) return;
    try {
      // Suppression douce : l'historique des transactions liées à ce compte
      // reste intact et consultable (deleted_at, jamais de delete physique).
      const now = new Date().toISOString();
      const deletedAccount = { ...accountToDelete, deleted_at: now, updated_at: now, sync_status: 'pending' as const };
      await db.accounts.put(deletedAccount);
      await SyncEngine.queueOperation('accounts', accountToDelete.id, 'delete', deletedAccount);
      await logActivity({
        user_id: user.id,
        entity_type: 'account',
        entity_id: accountToDelete.id,
        action: 'delete',
        old_values: { name: accountToDelete.name, balance: accountToDelete.balance },
        description: `Compte "${accountToDelete.name}" supprimé`,
      });
      toast.success('Compte supprimé avec succès');
    } catch {
      toast.error('Erreur lors de la suppression du compte');
    }
  };

  const renderGrid = (sectionAccounts: typeof accounts) => {
    if (sectionAccounts.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed mt-4">
          <p className="text-sm">Aucun compte dans cette catégorie.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3 mt-4">
        {sectionAccounts.map(account => (
          <AccountCard 
            key={account.id}
            name={account.name}
            type={account.type}
            balance={account.balance}
            currency={account.currency}
            color={account.color}
            operator={account.operator}
            phone_number={account.phone_number}
            bank_name={account.bank_name}
            onDelete={() => setAccountToDelete(account)}
            onMerge={() => setAccountToMerge(account)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Header title="Mes Comptes" />
      <div className="p-4 space-y-4 pb-24">
        
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold tracking-tight">Liste des comptes</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" />
                Nouveau
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un compte</DialogTitle>
              </DialogHeader>
              <AccountForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Solde Total Global toujours visible en haut */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-muted-foreground">Solde Global</span>
          <span className="font-bold text-xl text-primary">{new Intl.NumberFormat('fr-FR').format(totalBalance)} GNF</span>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
            <p className="text-sm">Vous n&apos;avez pas encore de compte.</p>
            <p className="text-xs mt-1">Cliquez sur Nouveau pour commencer.</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="flex w-full overflow-x-auto no-scrollbar justify-start">
              <TabsTrigger value="all" className="text-xs shrink-0 flex-1">Tous</TabsTrigger>
              <TabsTrigger value="mm" className="text-xs shrink-0 flex-1">Mobile</TabsTrigger>
              <TabsTrigger value="bank" className="text-xs shrink-0 flex-1">Banque</TabsTrigger>
              <TabsTrigger value="cash" className="text-xs shrink-0 flex-1">Espèces</TabsTrigger>
              <TabsTrigger value="biz" className="text-xs shrink-0 flex-1">Pro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {renderGrid(accounts)}
            </TabsContent>
            
            <TabsContent value="mm">
              {renderGrid(mmAccounts)}
            </TabsContent>
            
            <TabsContent value="bank">
              {renderGrid(bankAccounts)}
            </TabsContent>
            
            <TabsContent value="cash">
              {renderGrid(cashAccounts)}
            </TabsContent>

            <TabsContent value="biz">
              {renderGrid(bizAccounts)}
            </TabsContent>
          </Tabs>
        )}

      </div>

      <ConfirmDeleteDialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
        onConfirm={handleDeleteAccount}
        title="Supprimer ce compte ?"
        description={`Êtes-vous sûr de vouloir supprimer le compte "${accountToDelete?.name}" ? L'historique de ses transactions passées restera consultable.`}
      />

      <MergeAccountDialog
        key={accountToMerge?.id ?? 'none'}
        open={!!accountToMerge}
        onOpenChange={(open) => !open && setAccountToMerge(null)}
        sourceAccount={accountToMerge}
        targetOptions={mergeTargets}
      />
    </>
  );
}
