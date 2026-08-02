'use client';

import { useState } from 'react';
import { PERIOD_PRESET_LABELS, type PeriodPreset, type DateRange } from '@/lib/analytics/period';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const PRESETS: PeriodPreset[] = ['today', 'yesterday', '7d', '30d', '90d', 'this_year', 'last_year', 'custom'];

export function PeriodFilter({ preset, onChange, customRange, onCustomRangeChange }: {
  preset: PeriodPreset;
  onChange: (preset: PeriodPreset) => void;
  customRange?: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(customRange ? format(customRange.start, 'yyyy-MM-dd') : '');
  const [draftEnd, setDraftEnd] = useState(customRange ? format(customRange.end, 'yyyy-MM-dd') : '');

  const handleSelect = (p: PeriodPreset) => {
    if (p === 'custom') { setCustomOpen(true); return; }
    onChange(p);
  };

  const applyCustom = () => {
    if (!draftStart || !draftEnd) return;
    onCustomRangeChange({ start: new Date(draftStart), end: new Date(draftEnd) });
    onChange('custom');
    setCustomOpen(false);
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {PRESETS.map(p => (
          <button
            key={p}
            onClick={() => handleSelect(p)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
              preset === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {PERIOD_PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      <Drawer open={customOpen} onOpenChange={setCustomOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Période personnalisée</DrawerTitle></DrawerHeader>
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Du</label>
              <input
                type="date"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Au</label>
              <input
                type="date"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={applyCustom} disabled={!draftStart || !draftEnd} className="w-full">Appliquer</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
