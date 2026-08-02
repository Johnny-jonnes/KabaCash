'use client';

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore, getEffectiveDashboardOrder } from '@/stores/uiStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { useCategories } from '@/hooks/useCategories';
import { Header } from '@/components/layout/Header';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { SortableCardList } from '@/components/dashboard/SortableCardList';
import { ScoreCard } from '@/components/dashboard/ScoreCard';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { TrendsCard } from '@/components/dashboard/TrendsCard';
import { InsightsCard } from '@/components/dashboard/InsightsCard';
import { ChartsCard } from '@/components/dashboard/ChartsCard';
import { FavoritesRow } from '@/components/dashboard/FavoritesRow';
import { GoalsRow } from '@/components/dashboard/GoalsRow';
import { calculateFinancialScore } from '@/lib/finance/score';
import { generateInsights } from '@/lib/insights/generate';
import { ArrowRight, GripVertical, Check } from 'lucide-react';
import {
  startOfMonth, subMonths, startOfWeek, addDays, format, isSameDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const { dashboardCardOrder, setDashboardCardOrder } = useUIStore();
  const [editMode, setEditMode] = useState(false);

  const accountsRaw = useLiveQuery(() => db.accounts.toArray());
  const budgetsRaw = useLiveQuery(() => db.budgets.toArray());
  const budgets = useMemo(() => filterBySpace(budgetsRaw || [], activeSpaceId), [budgetsRaw, activeSpaceId]);
  const recurringTransactions = useLiveQuery(() => db.recurringTransactions.toArray()) || [];
  const categories = useCategories();

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().split('T')[0];
  const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString().split('T')[0];
  const threeMonthsStart = startOfMonth(subMonths(now, 2)).toISOString().split('T')[0];

  const monthTransactionsRaw = useLiveQuery(() =>
    db.transactions.where('transaction_date').aboveOrEqual(monthStart).toArray()
  );
  const monthTransactions = useMemo(() => filterBySpace(monthTransactionsRaw || [], activeSpaceId), [monthTransactionsRaw, activeSpaceId]);

  const prevMonthTransactionsRaw = useLiveQuery(() =>
    db.transactions.where('transaction_date').between(prevMonthStart, monthStart, true, false).toArray()
  );
  const prevMonthTransactions = useMemo(() => filterBySpace(prevMonthTransactionsRaw || [], activeSpaceId), [prevMonthTransactionsRaw, activeSpaceId]);

  const threeMonthsTransactionsRaw = useLiveQuery(() =>
    db.transactions.where('transaction_date').aboveOrEqual(threeMonthsStart).toArray()
  );
  const threeMonthsTransactions = useMemo(() => filterBySpace(threeMonthsTransactionsRaw || [], activeSpaceId), [threeMonthsTransactionsRaw, activeSpaceId]);

  const recentTransactionsRaw = useLiveQuery(() =>
    db.transactions.orderBy('created_at').reverse().limit(10).toArray()
  );
  const recentTransactions = useMemo(
    () => filterBySpace((recentTransactionsRaw || []).filter(t => !t.deleted_at), activeSpaceId).slice(0, 5),
    [recentTransactionsRaw, activeSpaceId]
  );

  const activeAccounts = useMemo(() => filterBySpace((accountsRaw || []).filter(a => !a.deleted_at), activeSpaceId), [accountsRaw, activeSpaceId]);
  const totalBalance = activeAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const totalIncome = monthTransactions.filter(t => t.type === 'income' && !t.deleted_at).reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTransactions.filter(t => t.type === 'expense' && !t.deleted_at).reduce((s, t) => s + t.amount, 0);
  const prevIncome = prevMonthTransactions.filter(t => t.type === 'income' && !t.deleted_at).reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevMonthTransactions.filter(t => t.type === 'expense' && !t.deleted_at).reduce((s, t) => s + t.amount, 0);

  const incomeTrend = prevIncome > 0 ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) : 0;
  const expenseTrend = prevExpense > 0 ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100) : 0;
  const savings = totalIncome - totalExpense;

  const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const firstName = userName.split(' ')[0];

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
      .filter(t => t.type === 'expense' && !t.deleted_at)
      .forEach(t => map.set(t.category_id || 'Autre', (map.get(t.category_id || 'Autre') || 0) + t.amount));
    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: categories.find(c => c.name === name)?.color || '#6B7280',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [monthTransactions, categories]);

  const weeklyData = useMemo(() => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const total = monthTransactions
        .filter(t => t.type === 'expense' && !t.deleted_at && t.transaction_date === dayStr)
        .reduce((sum, t) => sum + t.amount, 0);
      return { day: format(day, 'EEE', { locale: fr }), montant: total, isToday: isSameDay(day, now) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthTransactions]);

  const scoreResult = useMemo(() => calculateFinancialScore({
    accounts: activeAccounts, transactions: threeMonthsTransactions, budgets, recurringTransactions, now,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [activeAccounts, threeMonthsTransactions, budgets, recurringTransactions]);

  const insights = useMemo(() => generateInsights({
    accounts: activeAccounts, monthTransactions, prevMonthTransactions, threeMonthsTransactions, budgets, now,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [activeAccounts, monthTransactions, prevMonthTransactions, threeMonthsTransactions, budgets]);

  const renderCard = (id: string) => {
    switch (id) {
      case 'score':
        return <ScoreCard result={scoreResult} />;
      case 'balance':
        return <BalanceCard totalBalance={totalBalance} accountCount={activeAccounts.length} savings={savings} />;
      case 'trends':
        return <TrendsCard totalIncome={totalIncome} totalExpense={totalExpense} incomeTrend={incomeTrend} expenseTrend={expenseTrend} />;
      case 'insights':
        return <InsightsCard insights={insights} />;
      case 'favorites':
        return <FavoritesRow />;
      case 'goals':
        return <GoalsRow />;
      case 'charts':
        return categoryData.length > 0 || weeklyData.some(d => d.montant > 0)
          ? <ChartsCard categoryData={categoryData} weeklyData={weeklyData} />
          : null;
      case 'recent':
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Transactions récentes</h3>
              <Link href="/transactions" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
                <p className="text-sm">Aucune transaction pour le moment.</p>
                <p className="text-xs mt-1">Ajoutez votre première transaction.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map(t => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
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
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header title="Tableau de bord" />
      <div className="p-4 space-y-5 pb-24">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{getGreeting()}, {firstName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Voici le résumé de vos finances pour <span className="capitalize">{monthName}</span>.
            </p>
          </div>
          <button
            onClick={() => setEditMode(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors duration-150 ${
              editMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {editMode ? <Check className="w-3.5 h-3.5" /> : <GripVertical className="w-3.5 h-3.5" />}
            {editMode ? 'Terminé' : 'Réorganiser'}
          </button>
        </div>

        <SortableCardList order={getEffectiveDashboardOrder(dashboardCardOrder)} onOrderChange={setDashboardCardOrder} renderCard={renderCard} editMode={editMode} />
      </div>
    </>
  );
}
