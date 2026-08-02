'use client';

import { useMemo, useState } from 'react';
import { aggregateDayHourMatrix } from '@/lib/analytics/aggregate';
import { formatAmount } from '@/lib/finance/format';
import type { DBTransaction } from '@/types/database';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
// Rampe séquentielle une seule teinte (vert de marque), du plus clair (peu/pas de dépense) au plus foncé
const INTENSITY_STEPS = ['var(--brand-50)', 'var(--brand-100)', 'var(--brand-200)', 'var(--brand-400)', 'var(--brand-600)', 'var(--brand-800)'];

export function HabitsHeatmap({ transactions }: { transactions: DBTransaction[] }) {
  const [hovered, setHovered] = useState<{ day: number; hour: number } | null>(null);

  const matrix = useMemo(() => aggregateDayHourMatrix(transactions), [transactions]);
  const max = useMemo(() => Math.max(1, ...matrix.flat()), [matrix]);

  const colorFor = (value: number) => {
    if (value === 0) return 'var(--muted)';
    const ratio = value / max;
    const step = Math.min(INTENSITY_STEPS.length - 1, Math.floor(ratio * INTENSITY_STEPS.length));
    return INTENSITY_STEPS[step];
  };

  const hoveredValue = hovered ? matrix[hovered.day][hovered.hour] : null;

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Jour × heure de dépense</h3>
          {hovered && hoveredValue !== null && (
            <span className="text-xs font-medium text-primary">
              {DAY_LABELS[hovered.day]} {hovered.hour}h : {formatAmount(hoveredValue, 'GNF')}
            </span>
          )}
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[600px]">
            <div className="flex gap-[3px] mb-1 pl-8">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex-1 text-center text-[8px] text-muted-foreground">{h % 3 === 0 ? h : ''}</div>
              ))}
            </div>
            {DAY_LABELS.map((label, day) => (
              <div key={day} className="flex items-center gap-[3px] mb-[3px]">
                <div className="w-8 text-[10px] text-muted-foreground shrink-0">{label}</div>
                {matrix[day].map((value, hour) => (
                  <button
                    key={hour}
                    onMouseEnter={() => setHovered({ day, hour })}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setHovered({ day, hour })}
                    className="flex-1 aspect-square rounded-[3px] transition-transform hover:scale-125 hover:z-10 relative"
                    style={{ backgroundColor: colorFor(value) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-muted-foreground">Moins</span>
          {INTENSITY_STEPS.map((color, i) => (
            <div key={i} className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: color }} />
          ))}
          <span className="text-[10px] text-muted-foreground">Plus</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        L&apos;heure est estimée à partir du moment de saisie de la transaction.
      </p>
    </div>
  );
}
