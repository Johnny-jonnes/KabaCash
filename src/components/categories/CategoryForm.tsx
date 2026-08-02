'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { categorySchema, type CategoryFormData } from '@/schemas/category.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryIcon, AVAILABLE_ICONS } from '@/components/categories/CategoryIcon';
import { SyncEngine } from '@/lib/sync/engine';
import { logActivity } from '@/lib/db/activity-logger';
import { toast } from 'sonner';
import type { DBCategory } from '@/types/database';

interface CategoryFormProps {
  onSuccess?: () => void;
  editingCategory?: DBCategory;
}

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6',
];

export function CategoryForm({ onSuccess, editingCategory }: CategoryFormProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!editingCategory;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: editingCategory
      ? { name: editingCategory.name, type: editingCategory.type, icon: editingCategory.icon, color: editingCategory.color }
      : { name: '', type: 'expense', icon: 'tag', color: '#3B82F6' },
  });

  const type = watch('type');
  const icon = watch('icon');
  const color = watch('color');

  const onSubmit = async (data: CategoryFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      if (isEditing && editingCategory) {
        const updated: DBCategory = {
          ...editingCategory,
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
          updated_at: new Date().toISOString(),
          sync_status: 'pending',
        };
        await db.categories.put(updated);
        await SyncEngine.queueOperation('categories', updated.id, 'update', updated);
        await logActivity({
          user_id: user.id,
          entity_type: 'category',
          entity_id: updated.id,
          action: 'update',
          old_values: { name: editingCategory.name, icon: editingCategory.icon, color: editingCategory.color },
          new_values: { name: updated.name, icon: updated.icon, color: updated.color },
          description: `Catégorie "${editingCategory.name}" modifiée`,
        });
      } else {
        const count = await db.categories.where('user_id').equals(user.id).count();
        const category: DBCategory = {
          id: uuidv4(),
          user_id: user.id,
          name: data.name,
          icon: data.icon,
          color: data.color,
          type: data.type,
          is_default: false,
          is_active: true,
          sort_order: count,
          sync_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await db.categories.add(category);
        await SyncEngine.queueOperation('categories', category.id, 'create', category);
        await logActivity({
          user_id: user.id,
          entity_type: 'category',
          entity_id: category.id,
          action: 'create',
          new_values: { name: category.name, type: category.type },
          description: `Catégorie "${category.name}" créée`,
        });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur catégorie', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={type === 'expense' ? 'default' : 'outline'}
          className={type === 'expense' ? 'bg-expense hover:bg-expense/90' : ''}
          onClick={() => setValue('type', 'expense')}
        >
          Dépense
        </Button>
        <Button
          type="button"
          variant={type === 'income' ? 'default' : 'outline'}
          className={type === 'income' ? 'bg-income hover:bg-income/90' : ''}
          onClick={() => setValue('type', 'income')}
        >
          Revenu
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Nom de la catégorie</Label>
        <Input placeholder="Ex: Courses marché, Salaire..." {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Icône</Label>
        <div className="flex gap-2 flex-wrap">
          {AVAILABLE_ICONS.map(ic => (
            <button
              key={ic}
              type="button"
              onClick={() => setValue('icon', ic)}
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
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
                color === c ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Créer la catégorie'}
      </Button>
    </form>
  );
}
