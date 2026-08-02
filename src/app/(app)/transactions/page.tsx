'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';

export default function TransactionsPage() {
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Optimisation Anti-Crash : On limite le chargement aux 100 dernières transactions
  const allTransactions = useLiveQuery(() =>
    db.transactions
      .orderBy('created_at')
      .reverse()
      .limit(100)
      .toArray()
  ) || [];

  const transactions = filterBySpace(
    allTransactions.filter(t => !t.deleted_at && (filterType === 'all' ? true : t.type === filterType)),
    activeSpaceId
  );

  return (
    <>
      <Header title="Transactions" />
      <div className="p-4 space-y-4">
        
        {/* En-tête + Bouton d'ajout */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Historique</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Nouveau
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvelle Transaction</DialogTitle>
              </DialogHeader>
              <TransactionForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtres simples */}
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <button 
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${filterType === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            onClick={() => setFilterType('all')}
          >
            Toutes
          </button>
          <button 
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${filterType === 'income' ? 'bg-background shadow-sm text-emerald-600' : 'text-muted-foreground'}`}
            onClick={() => setFilterType('income')}
          >
            Entrées
          </button>
          <button 
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${filterType === 'expense' ? 'bg-background shadow-sm text-red-600' : 'text-muted-foreground'}`}
            onClick={() => setFilterType('expense')}
          >
            Sorties
          </button>
        </div>

        {/* Liste */}
        <div className="space-y-3 mt-4">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
              <p className="text-sm">Aucune transaction trouvée.</p>
              <p className="text-xs mt-1">Appuyez sur &quot;Nouveau&quot; pour commencer.</p>
            </div>
          ) : (
            transactions.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                title={t.description || (t.type === 'transfer' ? 'Transfert' : 'Transaction')}
                category={t.type === 'transfer' ? 'Transfert interne' : t.category_id}
                amount={t.amount}
                type={t.type}
                date={t.transaction_date}
              />
            ))
          )}
        </div>
        
        {transactions.length === 100 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            Affichage limité aux 100 dernières transactions.
          </p>
        )}

      </div>
    </>
  );
}
