'use client';

import { formatAmount } from '@/lib/finance/format';
import { ChevronUp, ChevronDown } from 'lucide-react';

function TrendBadge({ current, previous, positiveIsGood }: { current: number; previous: number; positiveIsGood: boolean }) {
  if (previous <= 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  const isGood = positiveIsGood ? pct > 0 : pct < 0;
  return (
    <span className={`inline-flex items-center text-[10px] font-medium ${isGood ? 'text-income' : 'text-expense'}`}>
      {pct > 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

export function StatsSummary({ totalExpense, totalIncome, transactionCount, prevExpense, prevIncome }: {
  totalExpense: number;
  totalIncome: number;
  transactionCount: number;
  prevExpense: number;
  prevIncome: number;
}) {
  const avgTransaction = transactionCount > 0 ? Math.round((totalExpense + totalIncome) / transactionCount) : 0;

  const tiles = [
    { label: 'Dépenses', value: totalExpense, trend: <TrendBadge current={totalExpense} previous={prevExpense} positiveIsGood={false} />, colorClass: 'text-expense' },
    { label: 'Revenus', value: totalIncome, trend: <TrendBadge current={totalIncome} previous={prevIncome} positiveIsGood={true} />, colorClass: 'text-income' },
    { label: 'Solde net', value: totalIncome - totalExpense, colorClass: totalIncome - totalExpense >= 0 ? 'text-income' : 'text-expense' },
    { label: 'Moy./transaction', value: avgTransaction, colorClass: 'text-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map(tile => (
        <div key={tile.label} className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground font-medium">{tile.label}</p>
            {tile.trend}
          </div>
          <p className={`text-base font-bold tabular-nums mt-1 ${tile.colorClass}`}>{formatAmount(tile.value, 'GNF')}</p>
        </div>
      ))}
    </div>
  );
}
