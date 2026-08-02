'use client';

import { formatAmount } from '@/lib/finance/format';
import { predictGoalCompletion } from '@/lib/finance/goalPrediction';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DBSavingsGoal } from '@/types/database';

const STATUS_LABEL: Record<string, string> = {
  reached: 'Atteint !',
  on_track: 'En bonne voie',
  behind: 'En retard',
  no_progress: "Pas encore commencé",
  overdue: 'Date dépassée',
};

const STATUS_COLOR: Record<string, string> = {
  reached: 'var(--status-good)',
  on_track: 'var(--status-good)',
  behind: 'var(--status-warning)',
  no_progress: 'var(--muted-foreground)',
  overdue: 'var(--status-critical)',
};

export function GoalCard({ goal, onContribute, onOpen }: { goal: DBSavingsGoal; onContribute: () => void; onOpen: () => void }) {
  const prediction = predictGoalCompletion(goal);
  const color = STATUS_COLOR[prediction.status];
  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - prediction.progressPercent / 100);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
      <button onClick={onOpen} className="w-full flex items-center gap-3 text-left">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="28" fill="none" stroke={goal.color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 500ms var(--ease-spring, ease-out)' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <CategoryIcon name={goal.icon} color={goal.color} size={22} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold truncate">{goal.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatAmount(goal.current_amount, 'GNF')} / {formatAmount(goal.target_amount, 'GNF')}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-medium" style={{ color }}>{STATUS_LABEL[prediction.status]}</span>
            <span className="text-[10px] text-muted-foreground">
              · {prediction.status === 'reached' ? format(new Date(goal.reached_at || goal.updated_at), 'd MMM yyyy', { locale: fr }) : `échéance ${format(new Date(goal.target_date), 'd MMM yyyy', { locale: fr })}`}
            </span>
          </div>
        </div>
      </button>

      {prediction.status !== 'reached' && (
        <>
          {prediction.status === 'behind' && (
            <p className="text-[11px] text-status-warning mt-2 bg-status-warning/10 rounded-lg px-2.5 py-1.5">
              Il faudrait mettre {formatAmount(Math.round(prediction.requiredDailyRate * 30), 'GNF')}/mois pour atteindre l&apos;objectif à temps.
            </p>
          )}
          <Button size="sm" className="w-full mt-3" onClick={onContribute}>
            Contribuer
          </Button>
        </>
      )}
    </div>
  );
}
