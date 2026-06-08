'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryIcon, AVAILABLE_ICONS } from '@/components/categories/CategoryIcon';

interface CategoryFormProps {
  onSuccess?: () => void;
}

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6',
];

export function CategoryForm({ onSuccess }: CategoryFormProps) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState('#3B82F6');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setIsSubmitting(true);

    try {
      await db.categories.add({
        id: uuidv4(),
        user_id: user.id,
        name: name.trim(),
        icon,
        color,
        type,
        is_default: false,
        sort_order: 0,
        sync_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur création catégorie', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Type */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          type="button" 
          variant={type === 'expense' ? 'default' : 'outline'}
          className={type === 'expense' ? 'bg-red-500 hover:bg-red-600' : ''}
          onClick={() => setType('expense')}
        >
          Dépense
        </Button>
        <Button 
          type="button" 
          variant={type === 'income' ? 'default' : 'outline'}
          className={type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
          onClick={() => setType('income')}
        >
          Revenu
        </Button>
      </div>

      {/* Nom */}
      <div className="space-y-2">
        <Label>Nom de la catégorie</Label>
        <Input 
          placeholder="Ex: Courses marché, Salaire..." 
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Icône */}
      <div className="space-y-2">
        <Label>Icône</Label>
        <div className="flex gap-2 flex-wrap">
          {AVAILABLE_ICONS.map(ic => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all ${
                icon === ic ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:border-primary/40'
              }`}
            >
              <CategoryIcon name={ic} color={icon === ic ? color : undefined} size={18} />
            </button>
          ))}
        </div>
      </div>

      {/* Couleur */}
      <div className="space-y-2">
        <Label>Couleur</Label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === c ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !name.trim()}>
        {isSubmitting ? 'Création...' : 'Créer la catégorie'}
      </Button>
    </form>
  );
}
