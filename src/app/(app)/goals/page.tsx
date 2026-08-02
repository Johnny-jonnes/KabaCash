'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalForm } from '@/components/goals/GoalForm';
import { ContributeForm } from '@/components/goals/ContributeForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Plus, Target, Pencil, Trash2 } from 'lucide-react';
import { deleteGoal } from '@/lib/goals/goalActions';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { toast } from 'sonner';
import type { DBSavingsGoal } from '@/types/database';

export default function GoalsPage() {
  const { user } = useAuthStore();
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<DBSavingsGoal | null>(null);
  const [managingGoal, setManagingGoal] = useState<DBSavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<DBSavingsGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<DBSavingsGoal | null>(null);

  const allGoals = useLiveQuery(() => db.savingsGoals.toArray()) || [];
  const goals = filterBySpace(allGoals.filter(g => !g.deleted_at), activeSpaceId).sort((a, b) => a.sort_order - b.sort_order);
  const active = goals.filter(g => g.current_amount < g.target_amount);
  const reached = goals.filter(g => g.current_amount >= g.target_amount);

  const handleDelete = async () => {
    if (!deletingGoal || !user) return;
    await deleteGoal(deletingGoal.id, user.id);
    toast.success('Objectif supprimé');
    setDeletingGoal(null);
  };

  return (
    <>
      <Header title="Objectifs" showBack />
      <div className="p-4 space-y-5 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Vos objectifs</h2>
          <Button size="sm" className="gap-1" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Nouveau
          </Button>
        </div>

        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Target className="w-12 h-12 mb-4 opacity-40" />
            <p className="font-semibold text-foreground">Aucun objectif pour le moment</p>
            <p className="text-sm mt-1 text-center max-w-xs">Moto, maison, voyage, études... Créez votre premier objectif d&apos;épargne.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(goal => (
              <GoalCard key={goal.id} goal={goal} onContribute={() => setContributingGoal(goal)} onOpen={() => setManagingGoal(goal)} />
            ))}
          </div>
        )}

        {reached.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Atteints</h3>
            {reached.map(goal => (
              <GoalCard key={goal.id} goal={goal} onContribute={() => setContributingGoal(goal)} onOpen={() => setManagingGoal(goal)} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Nouvel objectif</DialogTitle></DialogHeader>
          <GoalForm onSuccess={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Modifier l&apos;objectif</DialogTitle></DialogHeader>
          {editingGoal && <GoalForm editingGoal={editingGoal} onSuccess={() => setEditingGoal(null)} />}
        </DialogContent>
      </Dialog>

      <Drawer open={!!contributingGoal} onOpenChange={(open) => !open && setContributingGoal(null)}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Contribuer à &quot;{contributingGoal?.name}&quot;</DrawerTitle></DrawerHeader>
          {contributingGoal && <ContributeForm goal={contributingGoal} onSuccess={() => setContributingGoal(null)} />}
        </DrawerContent>
      </Drawer>

      <Drawer open={!!managingGoal} onOpenChange={(open) => !open && setManagingGoal(null)}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>{managingGoal?.name}</DrawerTitle></DrawerHeader>
          <div className="p-2 pb-6 space-y-1">
            <button
              onClick={() => { setEditingGoal(managingGoal); setManagingGoal(null); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-muted active:scale-[0.98] transition-all duration-150"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" /> Modifier
            </button>
            <button
              onClick={() => { setDeletingGoal(managingGoal); setManagingGoal(null); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-muted active:scale-[0.98] transition-all duration-150"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmDeleteDialog
        open={!!deletingGoal}
        onOpenChange={(open) => !open && setDeletingGoal(null)}
        onConfirm={handleDelete}
        title="Supprimer cet objectif ?"
        description={`"${deletingGoal?.name}" sera supprimé. Les contributions déjà effectuées restent dans votre historique de transactions.`}
      />
    </>
  );
}
