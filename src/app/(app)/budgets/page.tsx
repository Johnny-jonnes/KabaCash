'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { toast } from 'sonner';
import { 
  isSameDay, isSameWeek, isSameMonth, isSameYear, 
  parseISO, startOfYear, subHours, subDays, subWeeks, subMonths, subYears, isAfter
} from 'date-fns';
import { DBBudget } from '@/types/database';

// Labels lisibles pour les périodes personnalisées
const UNIT_LABELS_SHORT: Record<string, string> = {
  hours: 'h',
  days: 'j',
  weeks: 'sem',
  months: 'mois',
  years: 'ans',
};

function formatPeriodLabel(budget: DBBudget): string {
  if (budget.period_type === 'custom' && budget.custom_duration_value && budget.custom_duration_unit) {
    return `${budget.custom_duration_value} ${UNIT_LABELS_SHORT[budget.custom_duration_unit] || budget.custom_duration_unit}`;
  }
  const labels: Record<string, string> = {
    daily: 'Jour',
    weekly: 'Semaine',
    monthly: 'Mois',
    annual: 'Année',
  };
  return labels[budget.period_type] || budget.period_type;
}

export default function BudgetsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [payBudget, setPayBudget] = useState<{ categoryId: string, limit: number } | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<DBBudget | null>(null);

  const now = new Date();
  const yearStart = startOfYear(now).toISOString();

  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  
  // Optimisation : ne charger que les dépenses de l'année en cours
  const transactions = useLiveQuery(() => 
    db.transactions
      .where('transaction_date')
      .aboveOrEqual(yearStart)
      .filter(t => t.type === 'expense')
      .toArray()
  ) || [];

  // Calculer les dépenses par catégorie selon la période du budget
  const getSpentForCategory = (categoryId: string, budget: DBBudget) => {
    return transactions
      .filter(t => {
        if (t.category_id !== categoryId) return false;
        
        const txDate = parseISO(t.transaction_date);
        
        if (budget.period_type === 'custom' && budget.custom_duration_value && budget.custom_duration_unit) {
          // Période personnalisée : calculer la date de début
          const val = budget.custom_duration_value;
          let startDate: Date;
          switch (budget.custom_duration_unit) {
            case 'hours': startDate = subHours(now, val); break;
            case 'days': startDate = subDays(now, val); break;
            case 'weeks': startDate = subWeeks(now, val); break;
            case 'months': startDate = subMonths(now, val); break;
            case 'years': startDate = subYears(now, val); break;
            default: startDate = subMonths(now, val); break;
          }
          return isAfter(txDate, startDate);
        }
        
        switch (budget.period_type) {
          case 'daily': return isSameDay(txDate, now);
          case 'weekly': return isSameWeek(txDate, now, { weekStartsOn: 1 });
          case 'monthly': return isSameMonth(txDate, now);
          case 'annual': return isSameYear(txDate, now);
          default: return isSameMonth(txDate, now);
        }
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    try {
      await db.budgets.delete(budgetToDelete.id);
      toast.success('Budget supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const dailyBudgets = budgets.filter(b => b.period_type === 'daily');
  const weeklyBudgets = budgets.filter(b => b.period_type === 'weekly');
  const monthlyBudgets = budgets.filter(b => b.period_type === 'monthly');
  const annualBudgets = budgets.filter(b => b.period_type === 'annual');
  const customBudgets = budgets.filter(b => b.period_type === 'custom');

  const renderBudgetGrid = (periodBudgets: typeof budgets) => {
    if (periodBudgets.length === 0) {
      return (
        <div className="text-center py-10 mt-4 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
          <p className="text-sm">Aucun budget dans cette catégorie.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 mt-4">
        {periodBudgets.map(budget => {
          const spent = getSpentForCategory(budget.category_id, budget);
          return (
            <BudgetCard 
              key={budget.id}
              categoryName={budget.category_id}
              spent={spent}
              limit={budget.amount_limit}
              currency={budget.currency}
              periodLabel={formatPeriodLabel(budget)}
              onPay={() => setPayBudget({ categoryId: budget.category_id, limit: budget.amount_limit })}
              onDelete={() => setBudgetToDelete(budget)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Header title="Mes Budgets" />
      <div className="p-4 space-y-4">
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Vue d'ensemble</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" />
                Nouveau
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau budget</DialogTitle>
              </DialogHeader>
              <BudgetForm onSuccess={() => {
                setIsDialogOpen(false);
                toast.success('Budget créé');
              }} />
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={!!payBudget} onOpenChange={(open) => !open && setPayBudget(null)}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Paiement du budget: {payBudget?.categoryId}</DialogTitle>
            </DialogHeader>
            {payBudget && (
              <TransactionForm 
                defaultType="expense"
                defaultCategory={payBudget.categoryId}
                defaultAmount={payBudget.limit}
                defaultDescription={`Paiement budget ${payBudget.categoryId}`}
                onSuccess={() => {
                  setPayBudget(null);
                  toast.success('Paiement enregistré');
                }} 
              />
            )}
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
            <TabsTrigger value="daily" className="text-xs">Jour</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Sem</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Mois</TabsTrigger>
            <TabsTrigger value="annual" className="text-xs">An</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Perso.</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderBudgetGrid(budgets)}
          </TabsContent>
          
          <TabsContent value="daily">
            {renderBudgetGrid(dailyBudgets)}
          </TabsContent>
          
          <TabsContent value="weekly">
            {renderBudgetGrid(weeklyBudgets)}
          </TabsContent>
          
          <TabsContent value="monthly">
            {renderBudgetGrid(monthlyBudgets)}
          </TabsContent>
          
          <TabsContent value="annual">
            {renderBudgetGrid(annualBudgets)}
          </TabsContent>

          <TabsContent value="custom">
            {renderBudgetGrid(customBudgets)}
          </TabsContent>
        </Tabs>

      </div>

      <ConfirmDeleteDialog
        open={!!budgetToDelete}
        onOpenChange={(open) => !open && setBudgetToDelete(null)}
        onConfirm={handleDeleteBudget}
        title="Supprimer ce budget ?"
        description={`Etes-vous sur de vouloir supprimer le budget "${budgetToDelete?.category_id}" ? Vos transactions ne seront pas supprimées.`}
      />
    </>
  );
}
