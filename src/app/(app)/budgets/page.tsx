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
import { isSameDay, isSameWeek, isSameMonth, isSameYear, parseISO, startOfYear } from 'date-fns';

export default function BudgetsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [payBudget, setPayBudget] = useState<{ categoryId: string, limit: number } | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<any | null>(null);

  const now = new Date();
  const yearStart = startOfYear(now).toISOString();

  // Optimisation: On ne récupère que les budgets
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  
  // Optimisation Anti-Crash: on ne récupère que les dépenses de cette année pour éviter de tout charger
  const transactions = useLiveQuery(() => 
    db.transactions
      .where('transaction_date')
      .aboveOrEqual(yearStart)
      .filter(t => t.type === 'expense')
      .toArray()
  ) || [];

  // Calculer les dépenses par catégorie selon la période du budget
  const getSpentForCategory = (categoryId: string, periodType: string) => {
    return transactions
      .filter(t => {
        if (t.category_id !== categoryId) return false;
        
        const txDate = parseISO(t.transaction_date);
        switch(periodType) {
          case 'daily': return isSameDay(txDate, now);
          case 'weekly': return isSameWeek(txDate, now, { weekStartsOn: 1 }); // Lundi
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
          const spent = getSpentForCategory(budget.category_id, budget.period_type);
          return (
            <BudgetCard 
              key={budget.id}
              categoryName={budget.category_id}
              spent={spent}
              limit={budget.amount_limit}
              currency={budget.currency}
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
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nouveau budget</DialogTitle>
              </DialogHeader>
              <BudgetForm onSuccess={() => {
                setIsDialogOpen(false);
                toast.success('Budget créé !');
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
                  toast.success('Paiement enregistré !');
                }} 
              />
            )}
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily" className="text-xs">Jour</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Sem</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Mois</TabsTrigger>
            <TabsTrigger value="annual" className="text-xs">An</TabsTrigger>
          </TabsList>
          
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
        </Tabs>

      </div>

      <ConfirmDeleteDialog
        open={!!budgetToDelete}
        onOpenChange={(open) => !open && setBudgetToDelete(null)}
        onConfirm={handleDeleteBudget}
        title="Supprimer ce budget ?"
        description={`Êtes-vous sûr de vouloir supprimer le budget "${budgetToDelete?.category_id}" ? Vos transactions ne seront pas supprimées.`}
      />
    </>
  );
}
