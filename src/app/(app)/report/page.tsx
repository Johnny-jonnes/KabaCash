'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { subYears, subMonths, startOfMonth } from 'date-fns';
import { db } from '@/lib/db/dexie';
import { useCategories } from '@/hooks/useCategories';
import { Header } from '@/components/layout/Header';
import { PeriodFilter } from '@/components/analytics/PeriodFilter';
import { StatsSummary } from '@/components/analytics/StatsSummary';
import { ForecastPanel } from '@/components/analytics/ForecastPanel';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resolvePeriod, previousPeriod, isInRange, type PeriodPreset, type DateRange } from '@/lib/analytics/period';
import { forecastFinances } from '@/lib/finance/forecast';
import { analyzeFinances } from '@/lib/insights/intelligence';
import { calculateFinancialScore } from '@/lib/finance/score';
import { generateRecommendations } from '@/lib/insights/recommendations';
import { calculateBudgetPercentage } from '@/lib/finance/calculations';
import { formatAmount } from '@/lib/finance/format';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { Repeat, AlertTriangle, Sparkles, ShieldAlert, Copy } from 'lucide-react';

const TONE_STYLES: Record<string, string> = {
  critical: 'border-status-critical/30 bg-status-critical/5 text-status-critical',
  warning: 'border-status-warning/30 bg-status-warning/5 text-status-warning',
  positive: 'border-income/30 bg-income/5 text-income',
  info: 'border-border bg-muted/20 text-foreground',
};

export default function ReportPage() {
  const [preset, setPreset] = useState<PeriodPreset>('30d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);

  const now = new Date();
  const range = useMemo(() => resolvePeriod(preset, now, customRange), [preset, customRange]); // eslint-disable-line react-hooks/exhaustive-deps
  const prevRange = useMemo(() => previousPeriod(range), [range]);

  const categories = useCategories();
  const accountsRaw = useLiveQuery(() => db.accounts.toArray());
  const accounts = useMemo(
    () => filterBySpace((accountsRaw || []).filter(a => !a.deleted_at), activeSpaceId),
    [accountsRaw, activeSpaceId]
  );

  const twoYearsAgo = useMemo(() => subYears(now, 2).toISOString().split('T')[0], []); // eslint-disable-line react-hooks/exhaustive-deps
  const transactionsRaw = useLiveQuery(() => db.transactions.where('transaction_date').aboveOrEqual(twoYearsAgo).toArray(), [twoYearsAgo]);
  const budgetsRaw = useLiveQuery(() => db.budgets.toArray());

  const allTransactions = useMemo(
    () => filterBySpace((transactionsRaw || []).filter(t => !t.deleted_at), activeSpaceId),
    [transactionsRaw, activeSpaceId]
  );
  const budgets = useMemo(
    () => filterBySpace((budgetsRaw || []).filter(b => !b.deleted_at), activeSpaceId),
    [budgetsRaw, activeSpaceId]
  );

  // Périmètre du rapport : "tous les comptes" ou un compte précis. Les budgets sont
  // définis par catégorie (pas par compte) — ils ne s'affichent que sur "tous les comptes".
  const scopedAccounts = useMemo(
    () => accountFilter === 'all' ? accounts : accounts.filter(a => a.id === accountFilter),
    [accounts, accountFilter]
  );
  const scopedTransactions = useMemo(
    () => accountFilter === 'all' ? allTransactions : allTransactions.filter(t => t.account_id === accountFilter),
    [allTransactions, accountFilter]
  );
  const scopedBudgets = useMemo(
    () => accountFilter === 'all' ? budgets : [],
    [budgets, accountFilter]
  );

  const currentTx = useMemo(() => scopedTransactions.filter(t => isInRange(t.transaction_date, range)), [scopedTransactions, range]);
  const prevTx = useMemo(() => scopedTransactions.filter(t => isInRange(t.transaction_date, prevRange)), [scopedTransactions, prevRange]);

  const totalExpense = currentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = currentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevIncome = prevTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : null;

  const topCategories = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of currentTx) if (t.type === 'expense') totals.set(t.category_id, (totals.get(t.category_id) || 0) + t.amount);
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([categoryId, amount]) => ({
        categoryId,
        amount,
        percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        def: categories.find(c => c.name === categoryId),
      }));
  }, [currentTx, totalExpense, categories]);

  const budgetAdherence = useMemo(() => scopedBudgets
    .map(b => {
      const spent = currentTx.filter(t => t.type === 'expense' && t.category_id === b.category_id).reduce((s, t) => s + t.amount, 0);
      return { budget: b, spent, percent: calculateBudgetPercentage(spent, b.amount_limit) };
    })
    .sort((a, b) => b.percent - a.percent), [scopedBudgets, currentTx]);

  // Moteurs déterministes (aucun LLM — AI_RULES.md) sur l'historique complet du
  // périmètre choisi, pas limités à la période affichée : récurrences et prévisions
  // ont besoin de plus de recul que la fenêtre du rapport.
  const intelligence = useMemo(
    () => analyzeFinances({ accounts: scopedAccounts, allTransactions: scopedTransactions, now }),
    [scopedAccounts, scopedTransactions] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const forecast = useMemo(
    () => forecastFinances({ accounts: scopedAccounts, transactions: scopedTransactions, now }),
    [scopedAccounts, scopedTransactions] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const score = useMemo(
    () => calculateFinancialScore({ accounts: scopedAccounts, transactions: scopedTransactions, budgets: scopedBudgets, recurringTransactions: [], now }),
    [scopedAccounts, scopedTransactions, scopedBudgets] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const categorySpends = useMemo(() => {
    const monthStart = startOfMonth(now).toISOString().split('T')[0];
    const threeMonthsStart = startOfMonth(subMonths(now, 2)).toISOString().split('T')[0];
    const byCategoryCurrent = new Map<string, number>();
    const byCategoryAvg = new Map<string, number>();
    for (const t of scopedTransactions) {
      if (t.type !== 'expense') continue;
      if (t.transaction_date >= monthStart) byCategoryCurrent.set(t.category_id, (byCategoryCurrent.get(t.category_id) || 0) + t.amount);
      else if (t.transaction_date >= threeMonthsStart) byCategoryAvg.set(t.category_id, (byCategoryAvg.get(t.category_id) || 0) + t.amount);
    }
    return Array.from(byCategoryCurrent.keys()).map(categoryId => ({
      categoryId,
      current: byCategoryCurrent.get(categoryId) || 0,
      average: (byCategoryAvg.get(categoryId) || 0) / 2,
    }));
  }, [scopedTransactions]); // eslint-disable-line react-hooks/exhaustive-deps

  const recommendations = useMemo(
    () => generateRecommendations({ intelligence, forecast, score, categorySpends }),
    [intelligence, forecast, score, categorySpends]
  );

  const recurring = [...intelligence.recurringExpenses, ...intelligence.recurringIncomes];

  return (
    <>
      <Header title="Rapport" showBack />
      <div className="p-4 space-y-5 pb-24">

        {/* === FILTRES === */}
        <div className="space-y-2">
          <PeriodFilter preset={preset} onChange={setPreset} customRange={customRange} onCustomRangeChange={setCustomRange} />
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous les comptes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les comptes</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* === RÉSUMÉ CHIFFRÉ === */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold tracking-tight">Résumé de la période</h2>
          <StatsSummary
            totalExpense={totalExpense}
            totalIncome={totalIncome}
            transactionCount={currentTx.length}
            prevExpense={prevExpense}
            prevIncome={prevIncome}
          />
          {savingsRate !== null && (
            <p className="text-xs text-muted-foreground px-1">
              Taux d&apos;épargne sur la période : <span className={`font-semibold ${savingsRate >= 0 ? 'text-income' : 'text-expense'}`}>{savingsRate}%</span>
            </p>
          )}
        </section>

        {/* === TOP CATÉGORIES === */}
        {topCategories.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-tight">Où part l&apos;argent</h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
              {topCategories.map(c => (
                <div key={c.categoryId} className="flex items-center gap-3 p-3">
                  <div
                    className="p-1.5 rounded-lg shrink-0"
                    style={c.def ? { backgroundColor: `${c.def.color}1A`, color: c.def.color } : undefined}
                  >
                    <CategoryIcon name={c.def?.icon || 'tag'} color={c.def?.color} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.categoryId}</p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, c.percent)}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{formatAmount(c.amount, 'GNF')}</p>
                    <p className="text-[10px] text-muted-foreground">{c.percent}%</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === BUDGETS (tous comptes uniquement) === */}
        {budgetAdherence.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-tight">Respect des budgets</h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
              {budgetAdherence.map(({ budget, spent, percent }) => (
                <div key={budget.id} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{budget.category_id}</p>
                    <p className={`text-xs font-semibold ${percent >= 100 ? 'text-status-critical' : percent >= 80 ? 'text-status-warning' : 'text-muted-foreground'}`}>{percent}%</p>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${percent >= 100 ? 'bg-status-critical' : percent >= 80 ? 'bg-status-warning' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatAmount(spent, 'GNF')} / {formatAmount(budget.amount_limit, 'GNF')}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === RÉCURRENCES DÉTECTÉES === */}
        {recurring.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-tight flex items-center gap-1.5"><Repeat className="w-4 h-4" /> Paiements récurrents détectés</h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
              {recurring.map(r => (
                <div key={`${r.accountId}-${r.categoryId}-${r.type}`} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    <p className="text-[11px] text-muted-foreground">Tous les ~{r.intervalDays} jours • {r.occurrences} occurrences</p>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums shrink-0 ${r.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {r.type === 'income' ? '+' : '-'}{formatAmount(r.averageAmount, 'GNF')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === ANOMALIES === */}
        {(intelligence.duplicates.length > 0 || intelligence.unusualBalances.length > 0) && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-tight flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> Points à vérifier</h2>
            <div className="space-y-2">
              {intelligence.duplicates.map((d, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-status-warning/30 bg-status-warning/5 text-sm">
                  <Copy className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                  <p>{d.transactions.length} transactions identiques de {formatAmount(d.amount, 'GNF')} en &quot;{d.categoryId}&quot; le même jour — possible double saisie.</p>
                </div>
              ))}
              {intelligence.unusualBalances.map(u => (
                <div key={u.accountId} className="flex items-start gap-2 p-3 rounded-xl border border-status-critical/30 bg-status-critical/5 text-sm">
                  <AlertTriangle className="w-4 h-4 text-status-critical shrink-0 mt-0.5" />
                  <p>Compte &quot;{u.accountName}&quot; : solde affiché {formatAmount(u.storedBalance, 'GNF')}, recalculé {formatAmount(u.recalculatedBalance, 'GNF')} à partir de l&apos;historique.</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === PRÉVISION === */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold tracking-tight">Prévision</h2>
          <ForecastPanel forecast={forecast} />
        </section>

        {/* === CONSEILS === */}
        {recommendations.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold tracking-tight flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Conseils</h2>
            <div className="space-y-2">
              {recommendations.map(rec => (
                <div key={rec.id} className={`p-3 rounded-xl border text-sm ${TONE_STYLES[rec.tone]}`}>
                  <p className="font-semibold mb-0.5">{rec.title}</p>
                  <p className="text-muted-foreground text-xs leading-snug">{rec.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </>
  );
}
