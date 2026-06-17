'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { formatAmount } from '@/lib/finance/format';
import { 
  TrendingUp, TrendingDown, Wallet, AlertTriangle, 
  ArrowRight, ChevronUp, ChevronDown, Minus
} from 'lucide-react';
import { 
  startOfMonth, subMonths, startOfWeek, addDays, format, 
  isSameDay, parseISO, isAfter, isBefore
} from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

// Couleurs pour le graphique camembert
const CHART_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().split('T')[0];
  const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString().split('T')[0];

  // Transactions du mois en cours
  const monthTransactions = useLiveQuery(() => 
    db.transactions
      .where('transaction_date')
      .aboveOrEqual(monthStart)
      .toArray()
  ) || [];

  // Transactions du mois précédent (pour les tendances)
  const prevMonthTransactions = useLiveQuery(() => 
    db.transactions
      .where('transaction_date')
      .between(prevMonthStart, monthStart, true, false)
      .toArray()
  ) || [];

  // 5 dernières transactions
  const recentTransactions = useLiveQuery(() => 
    db.transactions.orderBy('created_at').reverse().limit(5).toArray()
  ) || [];

  // === CALCULS ===
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevIncome = prevMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const prevExpense = prevMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Tendances en pourcentage
  const incomeTrend = prevIncome > 0 ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) : 0;
  const expenseTrend = prevExpense > 0 ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100) : 0;

  const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Nom de l'utilisateur
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const firstName = userName.split(' ')[0];

  // === DÉPENSES PAR CATÉGORIE (camembert) ===
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category_id || 'Autre';
        map.set(cat, (map.get(cat) || 0) + t.amount);
      });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Max 6 catégories
  }, [monthTransactions]);

  // === DÉPENSES PAR JOUR DE LA SEMAINE (barres) ===
  const weeklyData = useMemo(() => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const total = monthTransactions
        .filter(t => t.type === 'expense' && t.transaction_date === dayStr)
        .reduce((sum, t) => sum + t.amount, 0);
      days.push({
        day: format(day, 'EEE', { locale: fr }),
        montant: total,
        isToday: isSameDay(day, now),
      });
    }
    return days;
  }, [monthTransactions, now]);

  // === BUDGETS EN ALERTE ===
  const budgetAlerts = useMemo(() => {
    return budgets
      .map(budget => {
        const spent = monthTransactions
          .filter(t => t.type === 'expense' && t.category_id === budget.category_id)
          .reduce((sum, t) => sum + t.amount, 0);
        const percentage = budget.amount_limit > 0 ? Math.round((spent / budget.amount_limit) * 100) : 0;
        return { ...budget, spent, percentage };
      })
      .filter(b => b.percentage >= 75)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }, [budgets, monthTransactions]);

  // Économies du mois
  const savings = totalIncome - totalExpense;

  // Tooltip personnalisé pour le bar chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
          <p className="font-medium text-foreground">{formatAmount(payload[0].value, 'GNF')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Header title="Tableau de bord" />
      <div className="p-4 space-y-5">

        {/* === MESSAGE D'ACCUEIL PERSONNALISÉ === */}
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {getGreeting()}, {firstName}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Voici le résumé de vos finances pour <span className="capitalize">{monthName}</span>.
          </p>
        </div>

        {/* === SOLDE TOTAL === */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-emerald-600 text-primary-foreground rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 opacity-80" />
              <h2 className="text-sm font-medium opacity-80">Solde Total</h2>
            </div>
            <p className="text-3xl font-bold tracking-tight">{formatAmount(totalBalance, 'GNF')}</p>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs opacity-70">{accounts.length} compte{accounts.length !== 1 ? 's' : ''}</p>
              {savings >= 0 ? (
                <span className="text-xs font-medium bg-white/15 px-2 py-0.5 rounded-full">
                  +{formatAmount(savings, 'GNF')} ce mois
                </span>
              ) : (
                <span className="text-xs font-medium bg-red-500/30 px-2 py-0.5 rounded-full">
                  {formatAmount(savings, 'GNF')} ce mois
                </span>
              )}
            </div>
          </div>
        </div>

        {/* === REVENUS / DÉPENSES AVEC TENDANCE === */}
        <div className="grid grid-cols-2 gap-3">
          {/* Revenus */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-xs font-medium text-muted-foreground">Revenus</h3>
            </div>
            <p className="text-lg font-bold text-emerald-500">+{formatAmount(totalIncome, 'GNF')}</p>
            <div className="flex items-center gap-1 mt-1.5">
              {incomeTrend > 0 ? (
                <ChevronUp className="w-3 h-3 text-emerald-500" />
              ) : incomeTrend < 0 ? (
                <ChevronDown className="w-3 h-3 text-red-500" />
              ) : (
                <Minus className="w-3 h-3 text-muted-foreground" />
              )}
              <span className={`text-[10px] font-medium ${
                incomeTrend > 0 ? 'text-emerald-500' : incomeTrend < 0 ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {incomeTrend > 0 ? '+' : ''}{incomeTrend}% vs mois dernier
              </span>
            </div>
          </div>

          {/* Dépenses */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-red-500/10">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="text-xs font-medium text-muted-foreground">Dépenses</h3>
            </div>
            <p className="text-lg font-bold text-red-500">-{formatAmount(totalExpense, 'GNF')}</p>
            <div className="flex items-center gap-1 mt-1.5">
              {expenseTrend > 0 ? (
                <ChevronUp className="w-3 h-3 text-red-500" />
              ) : expenseTrend < 0 ? (
                <ChevronDown className="w-3 h-3 text-emerald-500" />
              ) : (
                <Minus className="w-3 h-3 text-muted-foreground" />
              )}
              <span className={`text-[10px] font-medium ${
                expenseTrend > 0 ? 'text-red-500' : expenseTrend < 0 ? 'text-emerald-500' : 'text-muted-foreground'
              }`}>
                {expenseTrend > 0 ? '+' : ''}{expenseTrend}% vs mois dernier
              </span>
            </div>
          </div>
        </div>

        {/* === ALERTES BUDGETS === */}
        {budgetAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold">Alertes budgets</h3>
            </div>
            {budgetAlerts.map(b => (
              <Link key={b.id} href="/budgets" className="block">
                <div className={`p-3 rounded-xl border ${
                  b.percentage >= 95 ? 'border-red-500/30 bg-red-500/5' : 'border-orange-500/30 bg-orange-500/5'
                }`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold">{b.category_id}</span>
                    <span className={`text-xs font-bold ${
                      b.percentage >= 95 ? 'text-red-500' : 'text-orange-500'
                    }`}>{b.percentage}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        b.percentage >= 95 ? 'bg-red-500' : 'bg-orange-500'
                      }`} 
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatAmount(b.spent, b.currency)} / {formatAmount(b.amount_limit, b.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* === GRAPHIQUES === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Dépenses par catégorie (camembert) */}
          {categoryData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Dépenses par catégorie</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatAmount(Number(value), 'GNF')}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'hsl(var(--foreground))',
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Légende */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-[10px] text-foreground/70 truncate max-w-[100px]">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dépenses de la semaine (barres) */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Cette semaine</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar 
                    dataKey="montant" 
                    radius={[4, 4, 0, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* === TRANSACTIONS RÉCENTES === */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Transactions récentes</h3>
            <Link href="/transactions" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
              <p className="text-sm">Aucune transaction pour le moment.</p>
              <p className="text-xs mt-1">Ajoutez votre première transaction.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map(t => (
                <TransactionItem 
                  key={t.id}
                  title={t.description || (t.type === 'transfer' ? 'Transfert' : 'Transaction')}
                  category={t.type === 'transfer' ? 'Transfert interne' : t.category_id}
                  amount={t.amount}
                  type={t.type}
                  date={t.transaction_date}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
