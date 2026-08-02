'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import { aggregateByCategoricalDimension, DIMENSION_LABELS, type CategoricalDimension } from '@/lib/analytics/aggregate';
import { formatAmount } from '@/lib/finance/format';
import { PieChart as PieIcon, LayoutGrid } from 'lucide-react';
import type { DBAccount, DBTransaction } from '@/types/database';
import type { CategoryOption } from '@/hooks/useCategories';

const FALLBACK_PALETTE = ['var(--chart-cat-1)', 'var(--chart-cat-2)', 'var(--chart-cat-3)', 'var(--chart-cat-4)', 'var(--chart-cat-5)', 'var(--chart-cat-6)', 'var(--chart-cat-7)', 'var(--chart-cat-8)'];
const MAX_SLICES = 7;

const DIMENSIONS: CategoricalDimension[] = ['category', 'account', 'merchant', 'paymentMethod'];

export function DistributionView({ transactions, accounts, categories }: {
  transactions: DBTransaction[];
  accounts: DBAccount[];
  categories: CategoryOption[];
}) {
  const [dimension, setDimension] = useState<CategoricalDimension>('category');
  const [chartType, setChartType] = useState<'pie' | 'treemap'>('pie');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');

  const buckets = useMemo(() => {
    const raw = aggregateByCategoricalDimension(transactions, accounts, categories, dimension, txType);
    if (raw.length <= MAX_SLICES) return raw;
    const top = raw.slice(0, MAX_SLICES);
    const rest = raw.slice(MAX_SLICES);
    const otherValue = rest.reduce((s, b) => s + b.value, 0);
    const otherCount = rest.reduce((s, b) => s + b.count, 0);
    return [...top, { key: '__other__', label: 'Autres', value: otherValue, count: otherCount }];
  }, [transactions, accounts, categories, dimension, txType]);

  const chartData = buckets.map((b, i) => ({ name: b.label, value: b.value, count: b.count, color: b.color || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length] }));
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {DIMENSIONS.map(d => (
            <button
              key={d}
              onClick={() => setDimension(d)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                dimension === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {DIMENSION_LABELS[d]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setChartType('pie')} className={`p-1.5 rounded-lg ${chartType === 'pie' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <PieIcon className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setChartType('treemap')} className={`p-1.5 rounded-lg ${chartType === 'treemap' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['expense', 'income'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTxType(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              txType === t ? (t === 'expense' ? 'bg-expense/15 text-expense' : 'bg-income/15 text-income') : 'text-muted-foreground'
            }`}
          >
            {t === 'expense' ? 'Dépenses' : 'Revenus'}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Aucune donnée pour cette sélection.</p>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="var(--card)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => {
                      const payload = props?.payload as { count?: number; name?: string } | undefined;
                      return [`${formatAmount(Number(value), 'GNF')} (${payload?.count ?? 0} tx)`, payload?.name ?? ''];
                    }}
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              ) : (
                <Treemap data={chartData} dataKey="value" nameKey="name" stroke="var(--card)" fill="var(--chart-cat-1)">
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  <Tooltip
                    formatter={(value, _name, props) => {
                      const payload = props?.payload as { count?: number; name?: string } | undefined;
                      return [`${formatAmount(Number(value), 'GNF')} (${payload?.count ?? 0} tx)`, payload?.name ?? ''];
                    }}
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                </Treemap>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {chartData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="truncate text-foreground/80">{d.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground tabular-nums">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
                  <span className="font-medium tabular-nums">{formatAmount(d.value, 'GNF')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
