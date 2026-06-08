'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, sessionToken } = useAuthStore();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // N'accepter que les chiffres, espaces et le + au début
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^0-9+ ]/g, '');
    // Le + ne peut être qu'au début
    const noPlus = cleaned.replace(/\+/g, '');
    const finalValue = cleaned.startsWith('+') ? '+' + noPlus : noPlus;
    // Limiter à 15 caractères (norme E.164 max)
    if (finalValue.length <= 16) {
      setPhone(finalValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation stricte du nom
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      toast.error('Le nom doit contenir entre 2 et 50 caractères');
      return;
    }

    // Validation stricte du téléphone guinéen
    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      toast.error('Le numéro de téléphone doit contenir entre 9 et 15 chiffres');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          phone: phone.trim(),
        },
      });

      if (error) {
        toast.error('Erreur lors de la mise à jour : ' + error.message);
        return;
      }

      if (data.user) {
        setUser(data.user, sessionToken || undefined);
        toast.success('Profil mis à jour');
        router.push('/settings');
      }
    } catch {
      toast.error('Erreur de connexion. Vérifiez votre internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header title="Profil personnel" showBack />
      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto mt-4">
          
          <div className="space-y-2">
            <Label>Adresse email</Label>
            <Input 
              value={user?.email || ''}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
          </div>

          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ex: Oumar Diallo"
              required
              minLength={2}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label>Numéro de téléphone</Label>
            <Input 
              value={phone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="+224 620 00 00 00"
              type="tel"
              required
            />
            <p className="text-xs text-muted-foreground">Format : +224 suivi de 9 chiffres</p>
          </div>
          <Button type="submit" className="w-full mt-8" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </div>
    </>
  );
}
