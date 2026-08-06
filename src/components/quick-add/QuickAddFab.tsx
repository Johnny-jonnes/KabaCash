'use client';

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { useCategories } from '@/hooks/useCategories';
import { createTransaction, InsufficientFundsError } from '@/lib/transactions/createTransaction';
import { getRecentAmounts, sortAccountsByRecency, sortCategoriesByUsage } from '@/lib/insights/suggestions';
import { formatAmount } from '@/lib/finance/format';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { NumericKeypad } from '@/components/quick-add/NumericKeypad';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ArrowUpRight, ArrowDownRight, Repeat, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { TransactionType } from '@/types/enums';

type Step = 'closed' | 'type' | 'amount' | 'category' | 'account' | 'transferAccount';

const TYPE_META: Record<TransactionType, { label: string; icon: typeof ArrowUpRight; color: string }> = {
  expense: { label: 'Dépense', icon: ArrowUpRight, color: 'var(--expense)' },
  income: { label: 'Revenu', icon: ArrowDownRight, color: 'var(--income)' },
  transfer: { label: 'Transfert', icon: Repeat, color: 'var(--transfer)' },
};

export function QuickAddFab() {
  const { user } = useAuthStore();
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const [step, setStep] = useState<Step>('closed');
  const [type, setType] = useState<TransactionType>('expense');
  const [digits, setDigits] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<string | undefined>();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accountsRaw = useLiveQuery(() => db.accounts.toArray());
  // Comptes de l'espace actif uniquement (Personnel si aucun espace actif) : mélanger
  // les comptes de tous les espaces dans une même liste était la cause du "mauvais
  // compte sélectionné" — l'utilisateur tapait dans une liste qui ne correspondait pas
  // à l'espace où il pensait être.
  const activeAccounts = useMemo(
    () => filterBySpace((accountsRaw || []).filter(a => !a.deleted_at), activeSpaceId),
    [accountsRaw, activeSpaceId]
  );
  const recentTxRaw = useLiveQuery(() => db.transactions.orderBy('created_at').reverse().limit(200).toArray());
  const categoriesRaw = useCategories(type === 'transfer' ? undefined : type);

  const categories = useMemo(() => sortCategoriesByUsage(categoriesRaw, recentTxRaw || []), [categoriesRaw, recentTxRaw]);
  const sortedAccounts = useMemo(() => sortAccountsByRecency(activeAccounts, recentTxRaw || []), [activeAccounts, recentTxRaw]);
  const recentAmounts = useMemo(() => getRecentAmounts(recentTxRaw || [], type), [recentTxRaw, type]);
  const amount = digits ? parseInt(digits, 10) : 0;

  const resetState = () => {
    setType('expense');
    setDigits('');
    setCategoryId(undefined);
    setAccountId(undefined);
    setDescription('');
  };

  const close = () => { setStep('closed'); resetState(); };
  const open = () => { resetState(); setStep('type'); };

  const selectType = (t: TransactionType) => { setType(t); setStep('amount'); };

  const appendDigit = (key: string) => {
    if (key === 'backspace') { setDigits(d => d.slice(0, -1)); return; }
    setDigits(d => (d === '0' ? key : d + key).slice(0, 12));
  };

  const confirmAmount = (value?: number) => {
    const finalAmount = value ?? amount;
    if (finalAmount <= 0) return;
    setDigits(String(finalAmount));
    setStep(type === 'transfer' ? 'account' : 'category');
  };

  const selectCategory = (name: string) => { setCategoryId(name); setStep('account'); };

  const submit = async (finalAccountId: string, transferToId?: string) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await createTransaction({
        userId: user.id,
        accountId: finalAccountId,
        type,
        amount,
        currency: 'GNF',
        categoryId: type === 'transfer' ? undefined : categoryId,
        description: description.trim() || undefined,
        date: new Date().toISOString().split('T')[0],
        transferToAccountId: transferToId,
      });
      toast.success('Transaction ajoutée', { duration: 2000 });
      close();
    } catch (error) {
      toast.error(error instanceof InsufficientFundsError ? 'Fonds insuffisants' : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSourceAccount = (id: string) => {
    setAccountId(id);
    if (type === 'transfer') setStep('transferAccount');
    else submit(id);
  };

  const goBack = () => {
    if (step === 'amount') setStep('type');
    else if (step === 'category') setStep('amount');
    else if (step === 'account') setStep(type === 'transfer' ? 'amount' : 'category');
    else if (step === 'transferAccount') setStep('account');
  };

  return (
    <>
      <button
        onClick={open}
        aria-label="Ajouter une transaction"
        className="fixed right-4 z-40 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition-transform active:scale-90 hover:scale-105 duration-150"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Drawer open={step !== 'closed'} onOpenChange={(open) => !open && close()}>
        <DrawerContent>
          <DrawerHeader className="relative">
            {step !== 'type' && (
              <button onClick={goBack} className="absolute left-4 top-4 p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Retour">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <DrawerTitle>
              {step === 'type' && 'Nouvelle transaction'}
              {step === 'amount' && TYPE_META[type].label}
              {step === 'category' && 'Catégorie'}
              {step === 'account' && (type === 'transfer' ? 'Compte source' : 'Compte')}
              {step === 'transferAccount' && 'Compte destinataire'}
            </DrawerTitle>
          </DrawerHeader>

          {step === 'type' && (
            <div className="grid grid-cols-3 gap-3 p-4 pb-8">
              {(Object.keys(TYPE_META) as TransactionType[]).map((t) => {
                const meta = TYPE_META[t];
                const Icon = meta.icon;
                return (
                  <button
                    key={t}
                    onClick={() => selectType(t)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border transition-all active:scale-95 hover:border-primary/40 hover:shadow-sm duration-150 animate-in fade-in zoom-in-95"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 'amount' && (
            <>
              <div className="px-4">
                <div className="text-center py-3">
                  <span className="text-4xl font-bold tabular-nums">{digits ? Number(digits).toLocaleString('fr-GN') : '0'}</span>
                  <span className="text-lg text-muted-foreground ml-1.5">GNF</span>
                </div>
                {recentAmounts.length > 0 && (
                  <div className="flex gap-2 justify-center mb-2 flex-wrap">
                    {recentAmounts.map(a => (
                      <button
                        key={a}
                        onClick={() => confirmAmount(a)}
                        className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium transition-transform active:scale-95 hover:bg-muted/70"
                      >
                        {a.toLocaleString('fr-GN')}
                      </button>
                    ))}
                  </div>
                )}
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Note (optionnel)"
                  className="mb-2 text-center"
                />
              </div>
              <NumericKeypad onKey={appendDigit} />
              <DrawerFooter>
                <Button onClick={() => confirmAmount()} disabled={amount <= 0} className="w-full" size="lg">
                  Continuer
                </Button>
              </DrawerFooter>
            </>
          )}

          {step === 'category' && (
            <div className="grid grid-cols-4 gap-3 p-4 pb-8 max-h-[55vh] overflow-y-auto">
              {categories.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => selectCategory(c.name)}
                  className="flex flex-col items-center gap-1.5 transition-transform active:scale-90 animate-in fade-in"
                  style={{ animationDelay: `${Math.min(i, 8) * 20}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${c.color}1A` }}>
                    <CategoryIcon name={c.icon} color={c.color} size={20} />
                  </div>
                  <span className="text-[10px] text-center leading-tight line-clamp-1 w-full">{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {(step === 'account' || step === 'transferAccount') && (
            <div className="space-y-2 p-4 pb-8 max-h-[55vh] overflow-y-auto">
              {(step === 'transferAccount' ? sortedAccounts.filter(a => a.id !== accountId) : sortedAccounts).map(acc => (
                <button
                  key={acc.id}
                  disabled={isSubmitting}
                  onClick={() => step === 'transferAccount' ? submit(accountId!, acc.id) : selectSourceAccount(acc.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border transition-all active:scale-[0.98] hover:border-primary/40 duration-150 disabled:opacity-50"
                >
                  <span className="text-sm font-medium">{acc.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatAmount(acc.balance, acc.currency)}</span>
                </button>
              ))}
              {sortedAccounts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Créez d&apos;abord un compte dans l&apos;onglet Comptes.</p>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
