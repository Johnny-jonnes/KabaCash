'use client';

import { TrendingUp, TrendingDown, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { formatAmount } from '@/lib/finance/format';

function TrendPill({ trend, positiveIsGood }: { trend: number; positiveIsGood: boolean }) {
  const isGood = positiveIsGood ? trend > 0 : trend < 0;
  const isBad = positiveIsGood ? trend < 0 : trend > 0;
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {trend > 0 ? <ChevronUp className="w-3 h-3" /> : trend < 0 ? <ChevronDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      <span className={`text-[10px] font-medium ${isGood ? 'text-income' : isBad ? 'text-expense' : 'text-muted-foreground'}`}>
        {trend > 0 ? '+' : ''}{trend}% vs mois dernier
      </span>
    </div>
  );
}

export function TrendsCard({ totalIncome, totalExpense, incomeTrend, expenseTrend }: {
  totalIncome: number; totalExpense: number; incomeTrend: number; expenseTrend: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-income/10">
            <TrendingUp className="w-4 h-4 text-income" />
          </div>
          <h3 className="text-xs font-medium text-muted-foreground">Revenus</h3>
        </div>
        <p className="text-lg font-bold text-income tabular-nums">+{formatAmount(totalIncome, 'GNF')}</p>
        <TrendPill trend={incomeTrend} positiveIsGood={true} />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-expense/10">
            <TrendingDown className="w-4 h-4 text-expense" />
          </div>
          <h3 className="text-xs font-medium text-muted-foreground">Dépenses</h3>
        </div>
        <p className="text-lg font-bold text-expense tabular-nums">-{formatAmount(totalExpense, 'GNF')}</p>
        <TrendPill trend={expenseTrend} positiveIsGood={false} />
      </div>
    </div>
  );
}
