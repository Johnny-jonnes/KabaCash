'use client';

import Link from 'next/link';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { formatAmount } from '@/lib/finance/format';
import { ArrowRight } from 'lucide-react';

interface CategorySlice { name: string; value: number; color: string }
interface WeeklyBar { day: string; montant: number; isToday: boolean }

const CustomBarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-medium text-popover-foreground">{formatAmount(payload[0].value, 'GNF')}</p>
      </div>
    );
  }
  return null;
};

export function ChartsCard({ categoryData, weeklyData }: { categoryData: CategorySlice[]; weeklyData: WeeklyBar[] }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categoryData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Dépenses par catégorie</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatAmount(Number(value), 'GNF')}
                  contentStyle={{
                    backgroundColor: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--popover-foreground)',
                  }}
                  itemStyle={{ color: 'var(--popover-foreground)' }}
                  labelStyle={{ color: 'var(--popover-foreground)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[10px] text-foreground/70 truncate max-w-[100px]">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold mb-3">Cette semaine</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
              <YAxis hide />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
              <Bar dataKey="montant" radius={[4, 4, 0, 0]} fill="var(--brand-500)" animationDuration={300} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>

      <Link href="/analytics" className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline py-1">
        Voir l&apos;analyse complète <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
