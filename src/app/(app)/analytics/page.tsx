'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { subYears } from 'date-fns';
import { db } from '@/lib/db/dexie';
import { useCategories } from '@/hooks/useCategories';
import { Header } from '@/components/layout/Header';
import { PeriodFilter } from '@/components/analytics/PeriodFilter';
import { StatsSummary } from '@/components/analytics/StatsSummary';
import { DistributionView } from '@/components/analytics/DistributionView';
import { TrendView } from '@/components/analytics/TrendView';
import { HabitsHeatmap } from '@/components/analytics/HabitsHeatmap';
import { CategoryRadar } from '@/components/analytics/CategoryRadar';
import { ForecastPanel } from '@/components/analytics/ForecastPanel';
import { resolvePeriod, previousPeriod, isInRange, type PeriodPreset, type DateRange } from '@/lib/analytics/period';
import { forecastFinances } from '@/lib/finance/forecast';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { PieChart as PieIcon, TrendingUp, Grid3x3, Radar as RadarIcon, Telescope, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type ViewTab = 'distribution' | 'trend' | 'habits' | 'radar' | 'forecast';

const TABS: { id: ViewTab; label: string; icon: typeof PieIcon }[] = [
  { id: 'distribution', label: 'Répartition', icon: PieIcon },
  { id: 'trend', label: 'Évolution', icon: TrendingUp },
  { id: 'habits', label: 'Habitudes', icon: Grid3x3 },
  { id: 'radar', label: 'Comparer', icon: RadarIcon },
  { id: 'forecast', label: 'Prévisions', icon: Telescope },
];

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<PeriodPreset>('30d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState<ViewTab>('distribution');
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);

  const now = new Date();
  const range = useMemo(() => resolvePeriod(preset, now, customRange), [preset, customRange]); // eslint-disable-line react-hooks/exhaustive-deps
  const prevRange = useMemo(() => previousPeriod(range), [range]);

  const categories = useCategories();
  const accountsRaw = useLiveQuery(() => db.accounts.toArray());
  // Sans ce filtre, Analytics mélangeait les comptes/transactions de tous les espaces
  // (et du personnel) quel que soit l'espace sélectionné dans l'en-tête — même bug de
  // fond que corrigé sur les autres pages (voir dashboard/accounts/transactions).
  const accounts = useMemo(
    () => filterBySpace((accountsRaw || []).filter(a => !a.deleted_at), activeSpaceId),
    [accountsRaw, activeSpaceId]
  );

  const twoYearsAgo = useMemo(() => subYears(now, 2).toISOString().split('T')[0], []); // eslint-disable-line react-hooks/exhaustive-deps
  const transactionsRaw = useLiveQuery(() => db.transactions.where('transaction_date').aboveOrEqual(twoYearsAgo).toArray(), [twoYearsAgo]);
  const allTransactions = useMemo(
    () => filterBySpace((transactionsRaw || []).filter(t => !t.deleted_at), activeSpaceId),
    [transactionsRaw, activeSpaceId]
  );

  const currentTx = useMemo(() => allTransactions.filter(t => isInRange(t.transaction_date, range)), [allTransactions, range]);
  const prevTx = useMemo(() => allTransactions.filter(t => isInRange(t.transaction_date, prevRange)), [allTransactions, prevRange]);

  const totalExpense = currentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = currentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevIncome = prevTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const forecast = useMemo(() => forecastFinances({ accounts, transactions: allTransactions, now }), [accounts, allTransactions]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Header title="Analytics" showBack />
      <div className="p-4 space-y-4 pb-24">
        <PeriodFilter preset={preset} onChange={setPreset} customRange={customRange} onCustomRangeChange={setCustomRange} />

        <Link
          href="/report"
          className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Rapport détaillé</p>
            <p className="text-xs text-muted-foreground">Conseils personnalisés, triables par compte et par période</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </Link>

        <StatsSummary
          totalExpense={totalExpense}
          totalIncome={totalIncome}
          transactionCount={currentTx.length}
          prevExpense={prevExpense}
          prevIncome={prevIncome}
        />

        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-md text-[11px] font-medium transition-all duration-150 ${
                  activeTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'forecast' ? (
          <ForecastPanel forecast={forecast} />
        ) : currentTx.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
            <p className="text-sm">Aucune transaction sur cette période.</p>
          </div>
        ) : (
          <>
            {activeTab === 'distribution' && (
              <DistributionView transactions={currentTx} accounts={accounts} categories={categories} />
            )}
            {activeTab === 'trend' && (
              <TrendView transactions={allTransactions} range={range} />
            )}
            {activeTab === 'habits' && (
              <HabitsHeatmap transactions={currentTx} />
            )}
            {activeTab === 'radar' && (
              <CategoryRadar currentTx={currentTx} prevTx={prevTx} />
            )}
          </>
        )}
      </div>
    </>
  );
}
