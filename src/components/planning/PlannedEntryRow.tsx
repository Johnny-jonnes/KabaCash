'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatAmount } from '@/lib/finance/format';
import { useCategories } from '@/hooks/useCategories';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlannedEntryForm } from '@/components/planning/PlannedEntryForm';
import { deletePlannedEntry, realizePlannedEntry, skipPlannedEntry } from '@/lib/planning/planningActions';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { CheckCircle2, Pencil, Trash2, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { DBPlannedEntry } from '@/types/database';

export function PlannedEntryRow({ entry }: { entry: DBPlannedEntry }) {
  const { user } = useAuthStore();
  const categories = useCategories(entry.type);
  const categoryDef = categories.find(c => c.name === entry.category_id);
  const allAccounts = (useLiveQuery(() => db.accounts.toArray()) || []).filter(a => !a.deleted_at);
  // Comptes de l'espace de CETTE prévision (pas l'espace actif du switcher) : cohérent
  // avec le contexte dans lequel la prévision a été planifiée.
  const accounts = filterBySpace(allAccounts, entry.space_id ?? null);

  const [view, setView] = useState<'closed' | 'menu' | 'realize' | 'edit'>('closed');
  const [realizeAccountId, setRealizeAccountId] = useState(entry.account_id || '');

  const isIncome = entry.type === 'income';
  const isOverdue = entry.status === 'planned' && entry.planned_date < new Date().toISOString().split('T')[0];

  const statusBadge = entry.status === 'realized'
    ? { label: 'Réalisé', className: 'bg-income/10 text-income', Icon: CheckCircle2 }
    : entry.status === 'skipped'
    ? { label: 'Non réalisé', className: 'bg-muted text-muted-foreground', Icon: XCircle }
    : isOverdue
    ? { label: 'En retard', className: 'bg-status-critical/10 text-status-critical', Icon: AlertCircle }
    : { label: 'À venir', className: 'bg-status-warning/10 text-status-warning', Icon: Clock };

  const handleRealize = async () => {
    if (!user || !realizeAccountId) return;
    try {
      await realizePlannedEntry(entry.id, user.id, realizeAccountId);
      toast.success('Prévision réalisée');
      setView('closed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la réalisation');
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    await skipPlannedEntry(entry.id, user.id);
    toast.success('Marquée comme non réalisée');
    setView('closed');
  };

  const handleDelete = async () => {
    if (!user) return;
    await deletePlannedEntry(entry.id, user.id);
    toast.success('Prévision supprimée');
    setView('closed');
  };

  return (
    <>
      <button
        onClick={() => setView('menu')}
        className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl shadow-sm text-left active:scale-[0.99] transition-transform"
      >
        <div
          className="p-2 rounded-full shrink-0"
          style={categoryDef ? { backgroundColor: `${categoryDef.color}1A`, color: categoryDef.color } : undefined}
        >
          <CategoryIcon name={categoryDef?.icon || 'tag'} color={categoryDef?.color} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-sm truncate">{entry.description || entry.category_id}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {entry.category_id} • {format(new Date(entry.planned_date), 'd MMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-semibold text-sm tabular-nums ${isIncome ? 'text-income' : 'text-expense'}`}>
            {isIncome ? '+' : '-'}{formatAmount(entry.amount, entry.currency)}
          </p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${statusBadge.className}`}>
            <statusBadge.Icon className="w-2.5 h-2.5" />
            {statusBadge.label}
          </span>
        </div>
      </button>

      <Drawer open={view === 'menu' || view === 'realize'} onOpenChange={(open) => !open && setView('closed')}>
        <DrawerContent>
          {view === 'menu' && (
            <>
              <DrawerHeader><DrawerTitle>{entry.description || entry.category_id}</DrawerTitle></DrawerHeader>
              <div className="p-2 pb-6 space-y-1">
                {entry.status === 'planned' && (
                  <ActionRow icon={CheckCircle2} label="Réaliser maintenant" onClick={() => setView('realize')} />
                )}
                <ActionRow icon={Pencil} label="Modifier" onClick={() => setView('edit')} />
                {entry.status === 'planned' && (
                  <ActionRow icon={XCircle} label="Marquer non réalisée" onClick={handleSkip} />
                )}
                <ActionRow icon={Trash2} label="Supprimer" onClick={handleDelete} destructive />
              </div>
            </>
          )}
          {view === 'realize' && (
            <>
              <DrawerHeader><DrawerTitle>Réaliser cette prévision</DrawerTitle></DrawerHeader>
              <div className="p-4 pb-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ceci crée une vraie transaction de {formatAmount(entry.amount, entry.currency)} et affecte le solde du compte choisi.
                </p>
                <Select value={realizeAccountId} onValueChange={setRealizeAccountId}>
                  <SelectTrigger><SelectValue placeholder="Choisir le compte" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={handleRealize} disabled={!realizeAccountId} className="w-full">
                  Confirmer
                </Button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <Dialog open={view === 'edit'} onOpenChange={(open) => !open && setView('closed')}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Modifier la prévision</DialogTitle></DialogHeader>
          <PlannedEntryForm editingEntry={entry} onSuccess={() => setView('closed')} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActionRow({ icon: Icon, label, onClick, destructive }: { icon: typeof Pencil; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-muted active:scale-[0.98] transition-all duration-150 ${destructive ? 'text-destructive' : ''}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
