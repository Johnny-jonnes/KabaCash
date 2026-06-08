'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { formatAmount } from '@/lib/finance/format';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { startOfMonth } from 'date-fns';

export default function DashboardPage() {
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  
  // Optimisation 1 : Charger uniquement les 5 dernières transactions pour la liste
  const recentTransactions = useLiveQuery(() => 
    db.transactions.orderBy('created_at').reverse().limit(5).toArray()
  ) || [];

  // Optimisation 2 : Charger uniquement les transactions de ce mois-ci pour les totaux
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().split('T')[0];
  
  const monthTransactions = useLiveQuery(() => 
    db.transactions
      .where('transaction_date')
      .aboveOrEqual(monthStart)
      .toArray()
  ) || [];

  // Calcul du solde total
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Nom du mois
  const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <>
      <Header title="Tableau de bord" />
      <div className="p-4 space-y-4">

        {/* Solde total */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 opacity-80" />
            <h2 className="text-sm font-medium opacity-80">Solde Total</h2>
          </div>
          <p className="text-3xl font-bold tracking-tight">{formatAmount(totalBalance, 'GNF')}</p>
          <p className="text-xs opacity-60 mt-1">{accounts.length} compte{accounts.length > 1 ? 's' : ''} actif{accounts.length > 1 ? 's' : ''}</p>
        </div>
        
        {/* Revenus / Dépenses du mois */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-xs font-medium text-muted-foreground">Revenus</h3>
            </div>
            <p className="text-lg font-bold text-emerald-500">+ {formatAmount(totalIncome, 'GNF')}</p>
            <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{monthName}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-red-500/10">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="text-xs font-medium text-muted-foreground">Dépenses</h3>
            </div>
            <p className="text-lg font-bold text-red-500">- {formatAmount(totalExpense, 'GNF')}</p>
            <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{monthName}</p>
          </div>
        </div>

        {/* Transactions récentes */}
        <div>
          <h3 className="font-semibold text-sm mt-4 mb-3">Transactions Récentes</h3>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
              <p className="text-sm">Aucune transaction pour le moment.</p>
              <p className="text-xs mt-1">Ajoutez votre première transaction depuis l'onglet Transactions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map(t => (
                <TransactionItem 
                  key={t.id}
                  title={t.description || (t.type === 'transfer' ? 'Transfert' : 'Transaction')}
                  category={t.type === 'transfer' ? 'Transfert interne' : t.category_id}
                  amount={t.amount}
                  type={t.type}
                  date={t.transaction_date}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
