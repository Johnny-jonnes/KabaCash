'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { formatAmount } from '@/lib/finance/format';
import { startOfMonth } from 'date-fns';
import type { DBSpaceMember } from '@/types/database';

/** Réservé au chef — brief : "le chef de famille voit les dépenses de chacun". */
export function MemberSpendingReport({ spaceId, members }: { spaceId: string; members: DBSpaceMember[] }) {
  const monthStart = startOfMonth(new Date()).toISOString().split('T')[0];
  const transactionsRaw = useLiveQuery(() =>
    db.transactions.where('space_id').equals(spaceId).filter(t => !t.deleted_at && t.transaction_date >= monthStart).toArray()
  , [spaceId]);

  const byMember = useMemo(() => {
    const transactions = transactionsRaw || [];
    const totals = new Map<string, { expense: number; income: number; count: number }>();
    for (const t of transactions) {
      const entry = totals.get(t.user_id) || { expense: 0, income: 0, count: 0 };
      if (t.type === 'expense') entry.expense += t.amount;
      if (t.type === 'income') entry.income += t.amount;
      entry.count += 1;
      totals.set(t.user_id, entry);
    }
    return members
      .map(m => ({ member: m, ...(totals.get(m.user_id) || { expense: 0, income: 0, count: 0 }) }))
      .sort((a, b) => b.expense - a.expense);
  }, [transactionsRaw, members]);

  const totalExpense = byMember.reduce((s, m) => s + m.expense, 0);

  if (!transactionsRaw || transactionsRaw.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">Aucune dépense enregistrée ce mois-ci dans cet espace.</p>;
  }

  return (
    <div className="space-y-2">
      {byMember.map(({ member, expense, income, count }) => (
        <div key={member.id} className="p-2.5 rounded-lg bg-muted/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium truncate">{member.full_name}</span>
            <span className="text-xs text-muted-foreground">{count} tx</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-expense font-semibold tabular-nums">-{formatAmount(expense, 'GNF')}</span>
            {income > 0 && <span className="text-income tabular-nums">+{formatAmount(income, 'GNF')}</span>}
          </div>
          {totalExpense > 0 && (
            <div className="w-full bg-secondary rounded-full h-1 mt-1.5">
              <div className="h-1 rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.round((expense / totalExpense) * 100)}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
