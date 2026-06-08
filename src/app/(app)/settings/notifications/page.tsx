'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const router = useRouter();
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [largeTransfers, setLargeTransfers] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('kabacash_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setBudgetAlerts(parsed.budgetAlerts);
      setWeeklyReports(parsed.weeklyReports);
      setLargeTransfers(parsed.largeTransfers);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('kabacash_notifications', JSON.stringify({
      budgetAlerts,
      weeklyReports,
      largeTransfers
    }));
    toast.success('Préférences de notification enregistrées');
    router.push('/settings');
  };

  return (
    <>
      <Header title="Notifications" showBack />
      <div className="p-4 space-y-6">
        <div className="max-w-sm mx-auto mt-4 space-y-4">
          
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
            <div className="space-y-0.5">
              <Label>Alertes de Budget</Label>
              <p className="text-xs text-muted-foreground">M'avertir si je dépasse 80% du budget</p>
            </div>
            <Switch checked={budgetAlerts} onCheckedChange={setBudgetAlerts} />
          </div>

          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
            <div className="space-y-0.5">
              <Label>Grands Transferts</Label>
              <p className="text-xs text-muted-foreground">M'avertir pour les dépenses inhabituelles</p>
            </div>
            <Switch checked={largeTransfers} onCheckedChange={setLargeTransfers} />
          </div>

          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
            <div className="space-y-0.5">
              <Label>Rapports Hebdomadaires</Label>
              <p className="text-xs text-muted-foreground">Résumé de mes finances chaque lundi</p>
            </div>
            <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
          </div>

          <Button onClick={handleSave} className="w-full mt-8">
            Enregistrer les préférences
          </Button>

        </div>
      </div>
    </>
  );
}
