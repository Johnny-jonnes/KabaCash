'use client';

import { useRef, useState } from 'react';
import { formatAmount } from '@/lib/finance/format';
import { ArrowDownRight, ArrowUpRight, Repeat, Trash2, Pencil, Copy, Star, Share2, Tags } from 'lucide-react';
import { useItemGestures } from '@/hooks/useItemGestures';
import { useCategories } from '@/hooks/useCategories';
import { useAuthStore } from '@/stores/authStore';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { createTransaction, deleteTransaction, updateTransaction } from '@/lib/transactions/createTransaction';
import { createTemplate } from '@/lib/transactions/templates';
import { toast } from 'sonner';
import type { DBTransaction } from '@/types/database';

interface TransactionItemProps {
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  /** Objet complet : nécessaire pour activer les gestes (swipe/appui long). Sans lui, l'item reste en lecture seule. */
  transaction?: DBTransaction;
}

const UNDO_DELAY_MS = 4000;

export function TransactionItem({ title, category, amount, type, date, transaction }: TransactionItemProps) {
  const { user } = useAuthStore();
  const categories = useCategories();
  const isIncome = type === 'income';
  const isTransfer = type === 'transfer';

  const [isPendingDelete, setIsPendingDelete] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionView, setActionView] = useState<'closed' | 'menu' | 'category'>('closed');
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryDef = categories.find(c => c.name === category);

  const confirmDelete = () => {
    if (!transaction || !user) return;
    deleteTimer.current = setTimeout(() => {
      deleteTransaction(transaction.id, user.id).catch(() => toast.error('Erreur lors de la suppression'));
    }, UNDO_DELAY_MS);
    setIsPendingDelete(true);
    toast('Transaction supprimée', {
      action: { label: 'Annuler', onClick: cancelDelete },
      duration: UNDO_DELAY_MS,
    });
  };

  const cancelDelete = () => {
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    setIsPendingDelete(false);
  };

  const { translateX, handlers } = useItemGestures({
    disabled: !transaction || isPendingDelete,
    onSwipeLeft: confirmDelete,
    onSwipeRight: () => setIsEditOpen(true),
    onLongPress: () => setActionView('menu'),
  });

  const handleDuplicate = async () => {
    if (!transaction || !user) return;
    try {
      await createTransaction({
        userId: user.id,
        accountId: transaction.account_id,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        categoryId: transaction.category_id,
        description: transaction.description,
        date: new Date().toISOString().split('T')[0],
        transferToAccountId: transaction.transfer_to_account_id,
      });
      toast.success('Transaction dupliquée');
    } catch {
      toast.error('Fonds insuffisants ou erreur');
    }
    setActionView('closed');
  };

  const handleAddFavorite = async () => {
    if (!transaction || !user) return;
    await createTemplate({
      userId: user.id,
      label: transaction.description || category,
      type: transaction.type,
      accountId: transaction.account_id,
      categoryId: transaction.category_id,
      transferToAccountId: transaction.transfer_to_account_id,
      amount: transaction.amount,
      description: transaction.description,
    });
    toast.success('Ajouté aux favoris');
    setActionView('closed');
  };

  const handleShare = async () => {
    const text = `${title} — ${isIncome ? '+' : isTransfer ? '' : '-'}${formatAmount(amount, 'GNF')} (${date})`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text }); } catch { /* annulé par l'utilisateur */ }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      toast.success('Copié dans le presse-papiers');
    }
    setActionView('closed');
  };

  const handleChangeCategory = async (newCategory: string) => {
    if (!transaction || !user) return;
    await updateTransaction(transaction.id, user.id, { categoryId: newCategory });
    toast.success('Catégorie modifiée');
    setActionView('closed');
  };

  if (isPendingDelete) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/30 border border-dashed border-border rounded-xl text-xs text-muted-foreground animate-in fade-in duration-150">
        <span>Transaction supprimée</span>
        <button onClick={cancelDelete} className="text-primary font-medium">Annuler</button>
      </div>
    );
  }

  const swipingLeft = translateX < 0;
  const swipingRight = translateX > 0;

  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        {transaction && (
          <div className="absolute inset-0 flex items-center justify-between px-4 rounded-xl">
            <div className={`flex items-center gap-1.5 text-transfer transition-opacity duration-150 ${swipingRight ? 'opacity-100' : 'opacity-0'}`}>
              <Pencil className="w-4 h-4" /><span className="text-xs font-medium">Modifier</span>
            </div>
            <div className={`flex items-center gap-1.5 text-destructive transition-opacity duration-150 ${swipingLeft ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-xs font-medium">Supprimer</span><Trash2 className="w-4 h-4" />
            </div>
          </div>
        )}
        <div
          {...(transaction ? handlers : {})}
          style={{ transform: `translateX(${translateX}px)`, transition: translateX === 0 ? 'transform 200ms var(--ease-spring, ease-out)' : 'none' }}
          className="relative flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-sm touch-pan-y select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2 rounded-full shrink-0 ${!categoryDef ? (isIncome ? 'bg-income/10 text-income' : isTransfer ? 'bg-transfer/10 text-transfer' : 'bg-expense/10 text-expense') : ''}`}
              style={categoryDef ? { backgroundColor: `${categoryDef.color}1A`, color: categoryDef.color } : undefined}
            >
              {categoryDef ? <CategoryIcon name={categoryDef.icon} color={categoryDef.color} size={18} /> :
                isIncome ? <ArrowDownRight className="w-5 h-5" /> :
                isTransfer ? <Repeat className="w-5 h-5" /> :
                <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm leading-none mb-1 truncate">{title}</h4>
              <p className="text-xs text-muted-foreground truncate">{category} • {date}</p>
            </div>
          </div>
          <div className={`font-semibold text-sm shrink-0 tabular-nums ${isIncome ? 'text-income' : isTransfer ? 'text-transfer' : 'text-foreground'}`}>
            {isIncome ? '+' : isTransfer ? '' : '-'}{formatAmount(amount, 'GNF')}
          </div>
        </div>
      </div>

      {transaction && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Modifier la transaction</DialogTitle></DialogHeader>
            <TransactionForm editingTransaction={transaction} onSuccess={() => setIsEditOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      {transaction && (
        <Drawer open={actionView !== 'closed'} onOpenChange={(open) => !open && setActionView('closed')}>
          <DrawerContent>
            {actionView === 'menu' && (
              <>
                <DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
                <div className="p-2 pb-6 space-y-1">
                  <ActionRow icon={Copy} label="Dupliquer" onClick={handleDuplicate} />
                  <ActionRow icon={Star} label="Ajouter aux favoris" onClick={handleAddFavorite} />
                  <ActionRow icon={Share2} label="Partager" onClick={handleShare} />
                  {!isTransfer && <ActionRow icon={Tags} label="Changer de catégorie" onClick={() => setActionView('category')} />}
                </div>
              </>
            )}
            {actionView === 'category' && (
              <>
                <DrawerHeader><DrawerTitle>Changer de catégorie</DrawerTitle></DrawerHeader>
                <div className="p-3 pb-6 grid grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto">
                  {categories.filter(c => c.type === type).map(c => (
                    <button key={c.name} onClick={() => handleChangeCategory(c.name)} className="flex flex-col items-center gap-1.5">
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
      )}
    </>
  );
}

function ActionRow({ icon: Icon, label, onClick }: { icon: typeof Copy; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-muted active:scale-[0.98] transition-all duration-150"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      {label}
    </button>
  );
}
