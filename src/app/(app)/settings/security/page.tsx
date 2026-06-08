'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { hashPin } from '@/lib/security/pin';

export default function SecurityPage() {
  const router = useRouter();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    const savedHash = localStorage.getItem('kabacash_pin_hash');
    if (savedHash) {
      setPinEnabled(true);
    }
  }, []);

  const handleSave = async () => {
    if (pinEnabled) {
      if (pin.length !== 4) {
        toast.error('Le code PIN doit contenir exactement 4 chiffres');
        return;
      }
      if (pin !== confirmPin) {
        toast.error('Les codes PIN ne correspondent pas');
        return;
      }
      const hashed = await hashPin(pin);
      localStorage.setItem('kabacash_pin_hash', hashed);
      // Nettoyer l'ancien format s'il existe
      localStorage.removeItem('kabacash_pin');
      toast.success('Code PIN activé avec succès');
    } else {
      localStorage.removeItem('kabacash_pin_hash');
      localStorage.removeItem('kabacash_pin');
      setPin('');
      setConfirmPin('');
      toast.success('Code PIN désactivé');
    }
    router.push('/settings');
  };

  return (
    <>
      <Header title="Sécurité et PIN" showBack />
      <div className="p-4 space-y-6">
        <div className="max-w-sm mx-auto mt-4 space-y-6">
          
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
            <div className="space-y-0.5">
              <Label>Verrouillage par PIN</Label>
              <p className="text-xs text-muted-foreground">Exiger un code à l'ouverture de l'app</p>
            </div>
            <Switch 
              checked={pinEnabled}
              onCheckedChange={setPinEnabled}
            />
          </div>

          {pinEnabled && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="space-y-2">
                <Label>Nouveau code PIN (4 chiffres)</Label>
                <Input 
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••"
                  className="text-center text-xl tracking-widest"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmer le code PIN</Label>
                <Input 
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••"
                  className="text-center text-xl tracking-widest"
                />
              </div>
            </div>
          )}

          <Button onClick={handleSave} className="w-full mt-8">
            Enregistrer les préférences
          </Button>

        </div>
      </div>
    </>
  );
}
