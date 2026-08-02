'use client';

import { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Brush,
} from 'recharts';
import { aggregateByTime, type TimeGranularity } from '@/lib/analytics/aggregate';
import { previousPeriod, type DateRange } from '@/lib/analytics/period';
import { formatAmount } from '@/lib/finance/format';
import { LineChart as LineIcon, BarChart3, AreaChart as AreaIcon } from 'lucide-react';
import type { DBTransaction } from '@/types/database';

type ChartKind = 'line' | 'bar' | 'area';

const GRANULARITIES: { id: TimeGranularity; label: string }[] = [
  { id: 'day', label: 'Jour' }, { id: 'week', label: 'Semaine' }, { id: 'month', label: 'Mois' },
  { id: 'quarter', label: 'Trimestre' }, { id: 'year', label: 'Année' },
];

export function TrendView({ transactions, range }: { transactions: DBTransaction[]; range: DateRange }) {
  const [granularity, setGranularity] = useState<TimeGranularity>('day');
  const [chartKind, setChartKind] = useState<ChartKind>('area');
  const [compare, setCompare] = useState(false);

  const data = useMemo(() => {
    const current = aggregateByTime(transactions, granularity, range);
    if (!compare) return current.map(b => ({ label: b.label, Dépenses: b.expense, Revenus: b.income }));

    const prevRange = previousPeriod(range);
    const previous = aggregateByTime(transactions, granularity, prevRange);
    return current.map((b, i) => ({
      label: b.label,
      Dépenses: b.expense,
      Revenus: b.income,
      'Dépenses (période précédente)': previous[i]?.expense ?? 0,
    }));
  }, [transactions, granularity, range, compare]);

  const ChartIcon = { line: LineIcon, bar: BarChart3, area: AreaIcon }[chartKind];

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {GRANULARITIES.map(g => (
          <button
            key={g.id}
            onClick={() => setGranularity(g.id)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              granularity === g.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['area', 'line', 'bar'] as ChartKind[]).map(k => {
            const Icon = { line: LineIcon, bar: BarChart3, area: AreaIcon }[k];
            return (
              <button key={k} onClick={() => setChartKind(k)} className={`p-1.5 rounded-lg ${chartKind === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setCompare(v => !v)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
            compare ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
          }`}
        >
          vs période précédente
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartKind === 'bar' ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => formatAmount(Number(v), 'GNF')} contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                {data.length > 1 && <Legend wrapperStyle={{ fontSize: '11px' }} />}
                <Bar dataKey="Dépenses" fill="var(--expense)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Revenus" fill="var(--income)" radius={[3, 3, 0, 0]} />
                {compare && <Bar dataKey="Dépenses (période précédente)" fill="var(--muted-foreground)" radius={[3, 3, 0, 0]} />}
              </BarChart>
            ) : chartKind === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => formatAmount(Number(v), 'GNF')} contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Dépenses" stroke="var(--expense)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Revenus" stroke="var(--income)" strokeWidth={2} dot={false} />
                {compare && <Line type="monotone" dataKey="Dépenses (période précédente)" stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="4 3" dot={false} />}
                {data.length > 10 && <Brush dataKey="label" height={20} stroke="var(--border)" fill="var(--muted)" travellerWidth={8} />}
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--expense)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--expense)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--income)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--income)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => formatAmount(Number(v), 'GNF')} contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="Dépenses" stroke="var(--expense)" fill="url(#fillExpense)" strokeWidth={2} />
                <Area type="monotone" dataKey="Revenus" stroke="var(--income)" fill="url(#fillIncome)" strokeWidth={2} />
                {compare && <Line type="monotone" dataKey="Dépenses (période précédente)" stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="4 3" dot={false} />}
                {data.length > 10 && <Brush dataKey="label" height={20} stroke="var(--border)" fill="var(--muted)" travellerWidth={8} />}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <ChartIcon className="w-3 h-3" /> Glissez pour zoomer sur une période si l&apos;axe est chargé (ligne/aire).
      </p>
    </div>
  );
}
