'use client';

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlannedEntryForm } from '@/components/planning/PlannedEntryForm';
import { PlannedEntryRow } from '@/components/planning/PlannedEntryRow';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { formatAmount } from '@/lib/finance/format';
import { CalendarClock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PlanningPage() {
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const allEntriesRaw = useLiveQuery(() => db.plannedEntries.toArray());
  const entries = useMemo(
    () => filterBySpace((allEntriesRaw || []).filter(e => !e.deleted_at), activeSpaceId),
    [allEntriesRaw, activeSpaceId]
  );

  const groups = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.planned_date.localeCompare(b.planned_date));
    const byMonth = new Map<string, typeof sorted>();
    for (const entry of sorted) {
      const key = entry.planned_date.slice(0, 7); // yyyy-MM
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(entry);
    }
    return Array.from(byMonth.entries()).map(([month, items]) => ({
      month,
      label: format(new Date(`${month}-01`), 'MMMM yyyy', { locale: fr }),
      items,
      plannedIncome: items.filter(e => e.type === 'income' && e.status !== 'skipped').reduce((s, e) => s + e.amount, 0),
      plannedExpense: items.filter(e => e.type === 'expense' && e.status !== 'skipped').reduce((s, e) => s + e.amount, 0),
    }));
  }, [entries]);

  return (
    <>
      <Header title="Planification" showBack />
      <div className="p-4 space-y-5 pb-24">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground max-w-[70%]">
            Anticipez vos dépenses et revenus futurs — utile pour les cycles saisonniers (récoltes, campagnes, échéances).
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 shrink-0">
                <Plus className="w-4 h-4" /> Planifier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nouvelle prévision</DialogTitle></DialogHeader>
              <PlannedEntryForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <CalendarClock className="w-12 h-12 mb-4 opacity-40" />
            <p className="font-semibold text-foreground">Aucune prévision</p>
            <p className="text-sm mt-1 text-center max-w-xs">
              Planifiez une dépense ou un revenu à venir pour mieux anticiper votre trésorerie.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.month}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-sm font-semibold capitalize">{group.label}</h3>
                  <div className="flex items-center gap-2 text-xs tabular-nums">
                    {group.plannedIncome > 0 && <span className="text-income">+{formatAmount(group.plannedIncome, 'GNF')}</span>}
                    {group.plannedExpense > 0 && <span className="text-expense">-{formatAmount(group.plannedExpense, 'GNF')}</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  {group.items.map(entry => <PlannedEntryRow key={entry.id} entry={entry} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
