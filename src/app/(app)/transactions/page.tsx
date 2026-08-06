'use client';

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/button';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { useCategories } from '@/hooks/useCategories';

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
const ALL = '__all__';

const SORT_LABELS: Record<SortOption, string> = {
  date_desc: 'Date (récent d’abord)',
  date_asc: 'Date (ancien d’abord)',
  amount_desc: 'Montant (élevé d’abord)',
  amount_asc: 'Montant (faible d’abord)',
};

export default function TransactionsPage() {
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [accountFilter, setAccountFilter] = useState(ALL);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Optimisation Anti-Crash : on limite le chargement aux 100 dernières transactions —
  // le tri/filtre ci-dessous s'applique donc à cette fenêtre, pas à tout l'historique.
  const allTransactionsRaw = useLiveQuery(() =>
    db.transactions.orderBy('created_at').reverse().limit(100).toArray()
  );
  const accountsRaw = useLiveQuery(() => db.accounts.toArray());
  const accounts = useMemo(
    () => filterBySpace((accountsRaw || []).filter(a => !a.deleted_at), activeSpaceId),
    [accountsRaw, activeSpaceId]
  );
  const categories = useCategories();

  const transactions = useMemo(() => {
    let result = filterBySpace(
      (allTransactionsRaw || []).filter(t => !t.deleted_at && (filterType === 'all' ? true : t.type === filterType)),
      activeSpaceId
    );
    if (categoryFilter !== ALL) result = result.filter(t => t.category_id === categoryFilter);
    if (accountFilter !== ALL) result = result.filter(t => t.account_id === accountFilter || t.transfer_to_account_id === accountFilter);
    if (dateFrom) result = result.filter(t => t.transaction_date >= dateFrom);
    if (dateTo) result = result.filter(t => t.transaction_date <= dateTo);

    const sorted = [...result];
    if (sortBy === 'date_desc') sorted.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || b.created_at.localeCompare(a.created_at));
    else if (sortBy === 'date_asc') sorted.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date) || a.created_at.localeCompare(b.created_at));
    else if (sortBy === 'amount_desc') sorted.sort((a, b) => b.amount - a.amount);
    else sorted.sort((a, b) => a.amount - b.amount);
    return sorted;
  }, [allTransactionsRaw, activeSpaceId, filterType, categoryFilter, accountFilter, dateFrom, dateTo, sortBy]);

  const activeFilterCount = [categoryFilter !== ALL, accountFilter !== ALL, !!dateFrom, !!dateTo].filter(Boolean).length;
  const resetFilters = () => { setCategoryFilter(ALL); setAccountFilter(ALL); setDateFrom(''); setDateTo(''); setSortBy('date_desc'); };

  return (
    <>
      <Header title="Transactions" />
      <div className="p-4 space-y-4">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Historique</h2>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1 relative" onClick={() => setIsFilterOpen(true)}>
              <SlidersHorizontal className="w-4 h-4" />
              Trier / Filtrer
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

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
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${filterType === 'income' ? 'bg-background shadow-sm text-income' : 'text-muted-foreground'}`}
            onClick={() => setFilterType('income')}
          >
            Entrées
          </button>
          <button
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${filterType === 'expense' ? 'bg-background shadow-sm text-expense' : 'text-muted-foreground'}`}
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
              <p className="text-xs mt-1">
                {activeFilterCount > 0 ? 'Essayez de modifier vos filtres.' : 'Appuyez sur "Nouveau" pour commencer.'}
              </p>
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

        {(allTransactionsRaw || []).length === 100 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            Recherche limitée aux 100 dernières transactions.
          </p>
        )}

      </div>

      <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Trier et filtrer</DrawerTitle></DrawerHeader>
          <div className="p-4 pb-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trier par</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                    <SelectItem key={opt} value={opt}>{SORT_LABELS[opt]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catégorie</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Toutes les catégories</SelectItem>
                  {categories.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compte</label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous les comptes</SelectItem>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Période</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
                  aria-label="Date de début"
                />
                <input
                  type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
                  aria-label="Date de fin"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetFilters}>Réinitialiser</Button>
              <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>Appliquer</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
