'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useCategories, type CategoryOption } from '@/hooks/useCategories';
import { Header } from '@/components/layout/Header';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { SortableCategoryGrid } from '@/components/categories/SortableCategoryGrid';
import { Button } from '@/components/ui/button';
import { Plus, Check, GripVertical, Pencil, EyeOff, Eye, Combine, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { toast } from 'sonner';
import { setCategoryActive, mergeCategoriesAction, deleteCategorySafe, reorderCategories } from '@/lib/categories/categoryActions';

type ActionView = 'closed' | 'menu' | 'merge' | 'delete';

export default function CategoriesPage() {
  const { user } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [selected, setSelected] = useState<CategoryOption | null>(null);
  const [actionView, setActionView] = useState<ActionView>('closed');
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  const expenses = useCategories('expense', { includeInactive: true });
  const incomes = useCategories('income', { includeInactive: true });

  const visibleExpenses = showInactive ? expenses : expenses.filter(c => c.is_active);
  const visibleIncomes = showInactive ? incomes : incomes.filter(c => c.is_active);

  const handleSelect = (category: CategoryOption) => {
    setSelected(category);
    setActionView('menu');
  };

  const handleReorder = async (reordered: CategoryOption[]) => {
    // Optimiste : l'ordre visuel change immédiatement, la persistance suit derrière
    const rows = await db.categories.bulkGet(reordered.map(c => c.id).filter((id): id is string => !!id));
    await reorderCategories(rows.filter((r): r is NonNullable<typeof r> => !!r));
  };

  const handleToggleActive = async () => {
    if (!selected?.id || !user) return;
    const row = await db.categories.get(selected.id);
    if (!row) return;
    await setCategoryActive(row, !row.is_active, user.id);
    toast.success(row.is_active ? 'Catégorie désactivée' : 'Catégorie réactivée');
    setActionView('closed');
  };

  const handleMerge = async (targetName: string) => {
    if (!selected?.id || !user) return;
    const row = await db.categories.get(selected.id);
    if (!row) return;
    const result = await mergeCategoriesAction(row, targetName, user.id);
    toast.success(`Fusionnée avec "${targetName}"`, {
      description: `${result.transactionsMoved} transaction(s) et ${result.budgetsMoved} budget(s) réattribués.`,
    });
    setActionView('closed');
  };

  const handleDelete = async () => {
    if (!selected?.id || !user) return;
    const row = await db.categories.get(selected.id);
    if (!row) return;
    const result = await deleteCategorySafe(row, user.id);
    if (result.deleted) {
      toast.success('Catégorie supprimée');
    } else {
      toast.error('Suppression impossible', { description: result.reason });
    }
    setActionView('closed');
  };

  const renderSection = (title: string, categories: CategoryOption[]) => (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      {categories.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune catégorie.</p>
      ) : (
        <SortableCategoryGrid
          categories={categories}
          editMode={editMode}
          onSelect={handleSelect}
          onReorder={handleReorder}
        />
      )}
    </div>
  );

  return (
    <>
      <Header title="Catégories" />
      <div className="p-4 space-y-6 pb-24">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Vos catégories</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                editMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {editMode ? <Check className="w-3.5 h-3.5" /> : <GripVertical className="w-3.5 h-3.5" />}
              {editMode ? 'Terminé' : 'Réorganiser'}
            </button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Nouvelle
            </Button>
          </div>
        </div>

        <button
          onClick={() => setShowInactive(v => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          {showInactive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showInactive ? 'Masquer les désactivées' : 'Afficher les désactivées'}
        </button>

        {renderSection('Dépenses', visibleExpenses)}
        {renderSection('Revenus', visibleIncomes)}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Nouvelle catégorie</DialogTitle></DialogHeader>
          <CategoryForm onSuccess={() => { setIsCreateOpen(false); toast.success('Catégorie créée !'); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Modifier la catégorie</DialogTitle></DialogHeader>
          {selected?.id && (
            <EditCategoryFormLoader
              categoryId={selected.id}
              onSuccess={() => { setIsEditFormOpen(false); setActionView('closed'); toast.success('Catégorie modifiée'); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Drawer open={actionView === 'menu' || actionView === 'merge'} onOpenChange={(open) => !open && setActionView('closed')}>
        <DrawerContent>
          {actionView === 'menu' && selected && (
            <>
              <DrawerHeader><DrawerTitle>{selected.name}</DrawerTitle></DrawerHeader>
              <div className="p-2 pb-6 space-y-1">
                <ActionRow icon={Pencil} label="Modifier" onClick={() => { setActionView('closed'); setIsEditFormOpen(true); }} />
                <ActionRow icon={Combine} label="Fusionner avec..." onClick={() => setActionView('merge')} />
                <ActionRow
                  icon={selected.is_active ? EyeOff : Eye}
                  label={selected.is_active ? 'Désactiver' : 'Réactiver'}
                  onClick={handleToggleActive}
                />
                <ActionRow icon={Trash2} label="Supprimer définitivement" destructive onClick={() => setActionView('delete')} />
              </div>
            </>
          )}
          {actionView === 'merge' && selected && (
            <>
              <DrawerHeader><DrawerTitle>Fusionner &quot;{selected.name}&quot; avec...</DrawerTitle></DrawerHeader>
              <div className="grid grid-cols-4 gap-3 p-3 pb-6 max-h-[50vh] overflow-y-auto">
                {(selected.type === 'expense' ? expenses : incomes)
                  .filter(c => c.name !== selected.name && c.is_active)
                  .map(c => (
                    <button key={c.name} onClick={() => handleMerge(c.name)} className="flex flex-col items-center gap-1.5">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90" style={{ backgroundColor: `${c.color}1A` }}>
                        <CategoryIcon name={c.icon} color={c.color} size={18} />
                      </div>
                      <span className="text-[10px] text-center leading-tight line-clamp-1">{c.name}</span>
                    </button>
                  ))}
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <ConfirmDeleteDialog
        open={actionView === 'delete'}
        onOpenChange={(open) => !open && setActionView('closed')}
        onConfirm={handleDelete}
        title="Supprimer cette catégorie ?"
        description={`"${selected?.name}" sera définitivement supprimée si elle n'est utilisée par aucune transaction ou budget.`}
      />
    </>
  );
}

function ActionRow({ icon: Icon, label, onClick, destructive }: { icon: typeof Pencil; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-muted active:scale-[0.98] transition-all duration-150 ${destructive ? 'text-destructive' : ''}`}
    >
      <Icon className={`w-4 h-4 ${destructive ? 'text-destructive' : 'text-muted-foreground'}`} />
      {label}
    </button>
  );
}

/** Charge la catégorie complète (DBCategory) avant de monter le formulaire d'édition. */
function EditCategoryFormLoader({ categoryId, onSuccess }: { categoryId: string; onSuccess: () => void }) {
  const category = useLiveQuery(() => db.categories.get(categoryId), [categoryId]);

  if (category === undefined) return <p className="text-sm text-muted-foreground py-8 text-center">Chargement...</p>;
  if (!category) return <p className="text-sm text-muted-foreground py-8 text-center">Catégorie introuvable.</p>;

  return <CategoryForm editingCategory={category} onSuccess={onSuccess} />;
}
