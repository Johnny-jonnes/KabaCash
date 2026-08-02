'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useCategories } from '@/hooks/useCategories';
import { applyTemplate } from '@/lib/transactions/templates';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TemplateForm } from '@/components/transactions/TemplateForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { DBTransactionTemplate } from '@/types/database';

export function FavoritesRow() {
  const { user } = useAuthStore();
  const templates = useLiveQuery(() => db.transactionTemplates.toArray()) || [];
  const categories = useCategories();
  const [pendingTemplate, setPendingTemplate] = useState<DBTransactionTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  const active = templates
    .filter(t => !t.deleted_at)
    .sort((a, b) => b.use_count - a.use_count || a.sort_order - b.sort_order);

  const handleTap = async (template: DBTransactionTemplate) => {
    if (!user) return;
    if (template.amount === undefined || template.amount === null) {
      setPendingTemplate(template);
      return;
    }
    try {
      await applyTemplate(template, user.id);
      toast.success(`"${template.label}" ajouté`, { duration: 2000 });
    } catch {
      toast.error('Fonds insuffisants ou erreur');
    }
  };

  if (active.length === 0 && !creating) {
    return (
      <button
        onClick={() => setCreating(true)}
        className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-border text-muted-foreground text-xs hover:border-primary/40 hover:text-primary transition-colors"
      >
        <Star className="w-3.5 h-3.5" />
        Créez vos premiers favoris pour ajouter vos transactions habituelles en un tap
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Favoris</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
        {active.map(template => {
          const category = categories.find(c => c.name === template.category_id);
          const color = template.color || category?.color || '#6B7280';
          const icon = template.icon || category?.icon || 'tag';
          return (
            <button
              key={template.id}
              onClick={() => handleTap(template)}
              className="flex flex-col items-center gap-1.5 shrink-0 w-16 group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-transform group-active:scale-90 duration-150"
                style={{ backgroundColor: `${color}20` }}
              >
                <CategoryIcon name={icon} color={color} size={20} />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight line-clamp-1 w-full">{template.label}</span>
            </button>
          );
        })}
        <button onClick={() => setCreating(true)} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
          <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">Ajouter</span>
        </button>
      </div>

      <Dialog open={!!pendingTemplate} onOpenChange={(open) => !open && setPendingTemplate(null)}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{pendingTemplate?.label}</DialogTitle></DialogHeader>
          {pendingTemplate && (
            <TransactionForm
              defaultType={pendingTemplate.type}
              defaultCategory={pendingTemplate.category_id}
              defaultAccountId={pendingTemplate.account_id}
              defaultDescription={pendingTemplate.description}
              onSuccess={() => { setPendingTemplate(null); toast.success('Transaction ajoutée'); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouveau favori</DialogTitle></DialogHeader>
          <TemplateForm onSuccess={() => setCreating(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
