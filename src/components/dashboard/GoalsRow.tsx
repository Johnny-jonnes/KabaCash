'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { formatAmount } from '@/lib/finance/format';
import { Target, ArrowRight } from 'lucide-react';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';

export function GoalsRow() {
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const allGoals = useLiveQuery(() => db.savingsGoals.toArray()) || [];
  const active = filterBySpace(allGoals, activeSpaceId)
    .filter(g => !g.deleted_at && g.current_amount < g.target_amount)
    .sort((a, b) => (b.current_amount / b.target_amount) - (a.current_amount / a.target_amount))
    .slice(0, 3);

  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Objectifs</h3>
        </div>
        <Link href="/goals" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
          Voir tout <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {active.map(goal => {
          const percent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
          return (
            <Link key={goal.id} href="/goals" className="block bg-card border border-border rounded-xl p-3 transition-shadow hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${goal.color}20` }}>
                  <CategoryIcon name={goal.icon} color={goal.color} size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{goal.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{percent}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: goal.color }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
                {formatAmount(goal.current_amount, 'GNF')} / {formatAmount(goal.target_amount, 'GNF')}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
