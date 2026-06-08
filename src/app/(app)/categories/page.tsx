'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const customCategories = useLiveQuery(() => db.categories.toArray()) || [];

  const allExpenses = [
    ...DEFAULT_CATEGORIES.filter(c => c.type === 'expense'),
    ...customCategories.filter(c => c.type === 'expense').map(c => ({ name: c.name, icon: c.icon, color: c.color, type: c.type, id: c.id })),
  ];
  const allIncomes = [
    ...DEFAULT_CATEGORIES.filter(c => c.type === 'income'),
    ...customCategories.filter(c => c.type === 'income').map(c => ({ name: c.name, icon: c.icon, color: c.color, type: c.type, id: c.id })),
  ];

  const handleDelete = async (id: string, name: string) => {
    try {
      await db.categories.delete(id);
      toast.success(`Catégorie "${name}" supprimée`);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <>
      <Header title="Catégories" />
      <div className="p-4 space-y-6">
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Vos catégories</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" />
                Nouvelle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nouvelle catégorie</DialogTitle>
              </DialogHeader>
              <CategoryForm onSuccess={() => {
                setIsDialogOpen(false);
                toast.success('Catégorie créée !');
              }} />
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dépenses</h3>
          <div className="grid grid-cols-4 gap-3">
            {allExpenses.map(cat => (
              <div key={cat.name} className="flex flex-col items-center gap-2 relative group">
                {'id' in cat && (
                  <button 
                    onClick={() => handleDelete((cat as any).id, cat.name)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full items-center justify-center text-[10px] hidden group-hover:flex z-10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <CategoryIcon name={cat.icon} color={cat.color} size={22} />
                </div>
                <span className="text-[10px] text-center font-medium leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-6">Revenus</h3>
          <div className="grid grid-cols-4 gap-3">
            {allIncomes.map(cat => (
              <div key={cat.name} className="flex flex-col items-center gap-2 relative group">
                {'id' in cat && (
                  <button 
                    onClick={() => handleDelete((cat as any).id, cat.name)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full items-center justify-center text-[10px] hidden group-hover:flex z-10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <CategoryIcon name={cat.icon} color={cat.color} size={22} />
                </div>
                <span className="text-[10px] text-center font-medium leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
