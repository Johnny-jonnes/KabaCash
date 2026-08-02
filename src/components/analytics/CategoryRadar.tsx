'use client';

import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { formatAmount } from '@/lib/finance/format';
import type { DBTransaction } from '@/types/database';

const MAX_CATEGORIES = 8;

export function CategoryRadar({ currentTx, prevTx }: {
  currentTx: DBTransaction[];
  prevTx: DBTransaction[];
}) {
  const data = useMemo(() => {
    const current = new Map<string, number>();
    const previous = new Map<string, number>();
    for (const t of currentTx) if (t.type === 'expense' && !t.deleted_at) current.set(t.category_id, (current.get(t.category_id) || 0) + t.amount);
    for (const t of prevTx) if (t.type === 'expense' && !t.deleted_at) previous.set(t.category_id, (previous.get(t.category_id) || 0) + t.amount);

    const topCategories = Array.from(current.entries()).sort((a, b) => b[1] - a[1]).slice(0, MAX_CATEGORIES).map(([id]) => id);

    return topCategories.map(categoryId => ({
      category: categoryId,
      'Période actuelle': current.get(categoryId) || 0,
      'Période précédente': previous.get(categoryId) || 0,
    }));
  }, [currentTx, prevTx]);

  if (data.length < 3) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
        <p className="text-sm">Au moins 3 catégories de dépense sont nécessaires pour ce comparatif.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Vos {data.length} plus grosses catégories de dépenses, période actuelle vs précédente.</p>
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} />
              <Radar name="Période actuelle" dataKey="Période actuelle" stroke="var(--brand-600)" fill="var(--brand-600)" fillOpacity={0.35} />
              <Radar name="Période précédente" dataKey="Période précédente" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.15} />
              <Tooltip formatter={(v) => formatAmount(Number(v), 'GNF')} contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
