'use client';

import Link from 'next/link';
import type { FinancialScoreResult } from '@/lib/finance/score';

const BAND_COLOR: Record<FinancialScoreResult['band'], string> = {
  excellent: 'var(--status-good)',
  very_good: 'var(--brand-500)',
  correct: 'var(--status-warning)',
  needs_improvement: 'var(--status-serious)',
  critical: 'var(--status-critical)',
};

const BAND_MESSAGE: Record<FinancialScoreResult['band'], string> = {
  excellent: 'Vos finances sont sous contrôle. Continuez ainsi.',
  very_good: 'Une belle dynamique — quelques ajustements et ce sera parfait.',
  correct: 'Des bases correctes, encore un peu de marge de progression.',
  needs_improvement: 'Quelques points méritent votre attention ce mois-ci.',
  critical: 'Vos finances ont besoin d\'attention dès maintenant.',
};

export function ScoreCard({ result }: { result: FinancialScoreResult }) {
  const color = BAND_COLOR[result.band];
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - result.score / 100);

  return (
    <Link href="/budgets" className="block">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center gap-4 transition-transform active:scale-[0.98] duration-150">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
            <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border)" strokeWidth="7" />
            <circle
              cx="40" cy="40" r="36" fill="none"
              stroke={color}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 500ms var(--ease-spring, ease-out)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold tabular-nums">{result.score}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Score financier</p>
          <p className="text-sm font-bold mb-1" style={{ color }}>{result.bandLabel}</p>
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{BAND_MESSAGE[result.band]}</p>
        </div>
      </div>
    </Link>
  );
}
