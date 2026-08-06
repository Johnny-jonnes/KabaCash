'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { goalSchema, type GoalFormData } from '@/schemas/goal.schema';
import { createGoal, updateGoal } from '@/lib/goals/goalActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { toast } from 'sonner';
import type { DBSavingsGoal } from '@/types/database';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';

const GOAL_ICONS = ['bike', 'car', 'home', 'smartphone', 'plane', 'graduation-cap', 'target', 'piggy-bank', 'gift', 'briefcase'];
const GOAL_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'];

export function GoalForm({ onSuccess, editingGoal }: { onSuccess?: () => void; editingGoal?: DBSavingsGoal }) {
  const { user } = useAuthStore();
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!editingGoal;
  const allAccountsRaw = useLiveQuery(() => db.accounts.toArray());
  const accounts = useMemo(() => {
    const allAccounts = allAccountsRaw || [];
    const filtered = filterBySpace(allAccounts, activeSpaceId);
    if (editingGoal?.account_id && !filtered.some(a => a.id === editingGoal.account_id)) {
      const current = allAccounts.find(a => a.id === editingGoal.account_id);
      if (current) return [current, ...filtered];
    }
    return filtered;
  }, [allAccountsRaw, activeSpaceId, editingGoal]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: editingGoal ? {
      name: editingGoal.name, icon: editingGoal.icon, color: editingGoal.color,
      target_amount: editingGoal.target_amount, target_date: editingGoal.target_date, account_id: editingGoal.account_id,
    } : {
      name: '', icon: 'target', color: '#3B82F6', target_amount: 0, target_date: '',
    },
  });

  const icon = watch('icon');
  const color = watch('color');
  const accountId = watch('account_id');

  const onSubmit = async (data: GoalFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (isEditing && editingGoal) {
        await updateGoal(editingGoal.id, user.id, {
          name: data.name, icon: data.icon, color: data.color,
          targetAmount: data.target_amount, targetDate: data.target_date, accountId: data.account_id,
        });
        toast.success('Objectif modifié');
      } else {
        await createGoal({
          userId: user.id, name: data.name, icon: data.icon, color: data.color,
          targetAmount: data.target_amount, targetDate: data.target_date, accountId: data.account_id,
          spaceId: activeSpaceId,
        });
        toast.success('Objectif créé !');
      }
      onSuccess?.();
    } catch (error) {
      console.error('Erreur objectif', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-2">
        <Label>Nom de l&apos;objectif <span className="text-destructive">*</span></Label>
        <Input placeholder="Ex: Moto, Voyage, Études..." {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Icône</Label>
        <div className="flex gap-2 flex-wrap">
          {GOAL_ICONS.map(ic => (
            <button
              key={ic} type="button" onClick={() => setValue('icon', ic)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all duration-150 ${
                icon === ic ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:border-primary/40'
              }`}
            >
              <CategoryIcon name={ic} color={icon === ic ? color : undefined} size={18} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Couleur</Label>
        <div className="flex gap-2 flex-wrap">
          {GOAL_COLORS.map(c => (
            <button
              key={c} type="button" onClick={() => setValue('color', c)}
              className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${color === c ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Montant cible (GNF) <span className="text-destructive">*</span></Label>
        <Input type="number" placeholder="Ex: 5000000" {...register('target_amount', { valueAsNumber: true })} />
        {errors.target_amount && <p className="text-sm text-destructive">{errors.target_amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Date cible <span className="text-destructive">*</span></Label>
        <input type="date" min={minDate} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" {...register('target_date')} />
        {errors.target_date && <p className="text-sm text-destructive">{errors.target_date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Compte source habituel (optionnel)</Label>
        <Select value={accountId} onValueChange={(val) => setValue('account_id', val)}>
          <SelectTrigger><SelectValue placeholder="Choisir un compte" /></SelectTrigger>
          <SelectContent>
            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer' : "Créer l'objectif"}
      </Button>
    </form>
  );
}
