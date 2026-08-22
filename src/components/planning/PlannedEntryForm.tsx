'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { plannedEntrySchema, type PlannedEntryFormData } from '@/schemas/plannedEntry.schema';
import { createPlannedEntry, updatePlannedEntry } from '@/lib/planning/planningActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { toast } from 'sonner';
import type { DBPlannedEntry } from '@/types/database';

export function PlannedEntryForm({ onSuccess, editingEntry }: { onSuccess?: () => void; editingEntry?: DBPlannedEntry }) {
  const { user } = useAuthStore();
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!editingEntry;

  const allAccounts = (useLiveQuery(() => db.accounts.toArray()) || []).filter(a => !a.deleted_at);
  const accounts = filterBySpace(allAccounts, activeSpaceId);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PlannedEntryFormData>({
    resolver: zodResolver(plannedEntrySchema),
    defaultValues: editingEntry ? {
      type: editingEntry.type,
      category_id: editingEntry.category_id,
      amount: editingEntry.amount,
      description: editingEntry.description,
      planned_date: editingEntry.planned_date,
      account_id: editingEntry.account_id || undefined,
    } : {
      type: 'expense',
      category_id: '',
      amount: 0,
      description: '',
      planned_date: new Date().toISOString().split('T')[0],
      account_id: undefined,
    },
  });

  const selectedType = watch('type');
  const selectedCategory = watch('category_id');
  const selectedAccountId = watch('account_id');
  const categories = useCategories(selectedType);

  const onSubmit = async (data: PlannedEntryFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (isEditing && editingEntry) {
        await updatePlannedEntry(editingEntry.id, user.id, {
          categoryId: data.category_id, type: data.type, amount: data.amount,
          description: data.description, plannedDate: data.planned_date, accountId: data.account_id ?? null,
        });
        toast.success('Prévision modifiée');
      } else {
        await createPlannedEntry({
          userId: user.id, spaceId: activeSpaceId, categoryId: data.category_id, type: data.type,
          amount: data.amount, currency: 'GNF', description: data.description,
          plannedDate: data.planned_date, accountId: data.account_id,
        });
        toast.success('Prévision ajoutée');
      }
      onSuccess?.();
    } catch (error) {
      console.error('Erreur prévision', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={selectedType === 'expense' ? 'default' : 'outline'}
          className={selectedType === 'expense' ? 'bg-destructive hover:bg-destructive/90' : ''}
          onClick={() => setValue('type', 'expense')}
        >
          Dépense
        </Button>
        <Button
          type="button"
          variant={selectedType === 'income' ? 'default' : 'outline'}
          className={selectedType === 'income' ? 'bg-primary hover:bg-primary/90' : ''}
          onClick={() => setValue('type', 'income')}
        >
          Revenu
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Montant prévu (GNF) <span className="text-destructive">*</span></Label>
        <Input type="number" placeholder="Ex: 500000" {...register('amount', { valueAsNumber: true })} />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Date prévue <span className="text-destructive">*</span></Label>
        <input type="date" className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" {...register('planned_date')} />
        {errors.planned_date && <p className="text-sm text-destructive">{errors.planned_date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Catégorie <span className="text-destructive">*</span></Label>
        <Select value={selectedCategory} onValueChange={(val) => setValue('category_id', val, { shouldValidate: true })}>
          <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.name} value={cat.name}>
                <span className="flex items-center gap-2">
                  <CategoryIcon name={cat.icon} color={cat.color} size={16} />
                  {cat.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Compte prévu (optionnel)</Label>
        <Select value={selectedAccountId} onValueChange={(val) => setValue('account_id', val)}>
          <SelectTrigger><SelectValue placeholder="À décider plus tard" /></SelectTrigger>
          <SelectContent>
            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Description (optionnelle)</Label>
        <Input placeholder="Ex: Achat de semences" {...register('description')} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Planifier'}
      </Button>
    </form>
  );
}
