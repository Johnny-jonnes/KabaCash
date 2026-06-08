'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
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
  const [phone, setPhone] = useState(user?.phone || user?.user_metadata?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simuler un appel API
    setTimeout(() => {
      if (user) {
        const updatedUser = {
          ...user,
          phone: phone,
          user_metadata: {
            ...user.user_metadata,
            full_name: fullName,
            phone: phone,
          },
        };
        setUser(updatedUser as any, sessionToken || undefined);
        toast.success('Profil mis à jour');
        router.push('/settings');
      }
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <>
      <Header title="Profil personnel" showBack />
      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto mt-4">
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ex: John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Numéro de téléphone</Label>
            <Input 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ex: +224 620 00 00 00"
              required
            />
          </div>
          <Button type="submit" className="w-full mt-8" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </div>
    </>
  );
}
