import { subDays } from 'date-fns';
import type { DBAccount, DBTransaction } from '@/types/database';

export const FORECAST_HORIZONS_DAYS = [7, 30, 90, 180, 365] as const;
export type ForecastHorizonDays = typeof FORECAST_HORIZONS_DAYS[number];

export interface ForecastPoint {
  daysAhead: ForecastHorizonDays;
  projectedIncome: number;
  projectedExpense: number;
  projectedSavings: number;
  projectedBalance: number;
}

export interface FinancialForecast {
  dailyAvgIncome: number;
  dailyAvgExpense: number;
  currentBalance: number;
  points: ForecastPoint[];
}

const LOOKBACK_DAYS = 30;

/**
 * Prévisions déterministes (aucun LLM — voir AI_RULES.md "IA") : extrapolation linéaire
 * du rythme moyen quotidien de revenus/dépenses sur les LOOKBACK_DAYS derniers jours,
 * projetée sur chaque horizon. Volontairement simple et explicable plutôt qu'un modèle
 * opaque — l'utilisateur doit pouvoir comprendre d'où vient le chiffre.
 */
export function forecastFinances(params: {
  accounts: DBAccount[];
  transactions: DBTransaction[];
  now?: Date;
}): FinancialForecast {
  const now = params.now ?? new Date();
  const windowStart = subDays(now, LOOKBACK_DAYS);

  const recent = params.transactions.filter(t => !t.deleted_at && new Date(t.transaction_date) >= windowStart);
  const totalIncome = recent.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = recent.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const dailyAvgIncome = totalIncome / LOOKBACK_DAYS;
  const dailyAvgExpense = totalExpense / LOOKBACK_DAYS;
  const currentBalance = params.accounts.filter(a => !a.deleted_at).reduce((s, a) => s + a.balance, 0);

  const points: ForecastPoint[] = FORECAST_HORIZONS_DAYS.map(daysAhead => {
    const projectedIncome = Math.round(dailyAvgIncome * daysAhead);
    const projectedExpense = Math.round(dailyAvgExpense * daysAhead);
    const projectedSavings = projectedIncome - projectedExpense;
    return {
      daysAhead,
      projectedIncome,
      projectedExpense,
      projectedSavings,
      projectedBalance: currentBalance + projectedSavings,
    };
  });

  return { dailyAvgIncome, dailyAvgExpense, currentBalance, points };
}
