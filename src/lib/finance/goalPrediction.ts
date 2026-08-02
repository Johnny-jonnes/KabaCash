import { differenceInCalendarDays, addDays } from 'date-fns';
import type { DBSavingsGoal } from '@/types/database';

export type GoalPredictionStatus = 'reached' | 'on_track' | 'behind' | 'no_progress' | 'overdue';

export interface GoalPrediction {
  status: GoalPredictionStatus;
  progressPercent: number;
  remainingAmount: number;
  daysRemaining: number;
  currentDailyRate: number;
  requiredDailyRate: number;
  projectedCompletionDate: string | null;
}

/**
 * Prédiction déterministe (aucun LLM — voir AI_RULES.md "IA") : extrapole le rythme
 * de contribution observé depuis la création de l'objectif pour estimer s'il sera
 * atteint à temps, et sinon, ce qu'il faudrait mettre de côté par jour pour y arriver.
 */
export function predictGoalCompletion(goal: DBSavingsGoal, now: Date = new Date()): GoalPrediction {
  const progressPercent = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
  const remainingAmount = Math.max(0, goal.target_amount - goal.current_amount);
  const daysRemaining = differenceInCalendarDays(new Date(goal.target_date), now);
  const daysSinceCreation = Math.max(1, differenceInCalendarDays(now, new Date(goal.created_at)));
  const currentDailyRate = goal.current_amount / daysSinceCreation;
  const requiredDailyRate = remainingAmount / Math.max(1, daysRemaining);

  if (goal.current_amount >= goal.target_amount) {
    return { status: 'reached', progressPercent: 100, remainingAmount: 0, daysRemaining, currentDailyRate, requiredDailyRate: 0, projectedCompletionDate: null };
  }

  if (daysRemaining < 0) {
    return { status: 'overdue', progressPercent, remainingAmount, daysRemaining, currentDailyRate, requiredDailyRate, projectedCompletionDate: null };
  }

  if (currentDailyRate <= 0) {
    return { status: 'no_progress', progressPercent, remainingAmount, daysRemaining, currentDailyRate: 0, requiredDailyRate, projectedCompletionDate: null };
  }

  const daysNeededAtCurrentRate = remainingAmount / currentDailyRate;
  const projectedCompletionDate = addDays(now, Math.ceil(daysNeededAtCurrentRate)).toISOString().split('T')[0];
  const onTrack = daysNeededAtCurrentRate <= daysRemaining;

  return {
    status: onTrack ? 'on_track' : 'behind',
    progressPercent, remainingAmount, daysRemaining, currentDailyRate, requiredDailyRate, projectedCompletionDate,
  };
}
