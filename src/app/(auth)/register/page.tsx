'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simuler une inscription
    setTimeout(() => {
      setIsLoading(false);
      setUser(
        { id: 'simulated-user-id', phone: '+224600000000', user_metadata: { full_name: 'Nouvel Utilisateur' } } as any,
        'fake_token'
      );
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">KC</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Créer un compte</CardTitle>
        <CardDescription>Rejoignez KabaCash en quelques secondes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullname">Nom complet</Label>
            <Input id="fullname" placeholder="Oumar Diallo" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input id="phone" type="tel" placeholder="+224 6XX XX XX XX" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Devise principale</Label>
            <Select defaultValue="GNF">
              <SelectTrigger id="currency">
                <SelectValue placeholder="Sélectionnez une devise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GNF">Franc Guinéen (GNF)</SelectItem>
                <SelectItem value="USD">Dollar US ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Code PIN (4 chiffres)</Label>
              <Input id="pin" type="password" inputMode="numeric" maxLength={4} placeholder="••••" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin-confirm">Confirmer PIN</Label>
              <Input id="pin-confirm" type="password" inputMode="numeric" maxLength={4} placeholder="••••" required />
            </div>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? 'Création en cours...' : 'Créer mon compte'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground w-full">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
