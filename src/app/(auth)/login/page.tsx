'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simuler une connexion
    setTimeout(() => {
      setIsLoading(false);
      setUser(
        { id: 'simulated-user-id', phone: '+224600000000', user_metadata: { full_name: 'Utilisateur de Test' } } as any,
        'fake_token'
      );
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <Card className="border-border shadow-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-2xl">KC</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Bon retour !</CardTitle>
        <CardDescription>Entrez votre numéro et code PIN</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input id="phone" type="tel" placeholder="+224 6XX XX XX XX" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pin">Code PIN</Label>
              <Link href="#" className="text-sm font-medium text-primary hover:underline">
                Oublié ?
              </Link>
            </div>
            <Input id="pin" type="password" inputMode="numeric" maxLength={4} placeholder="••••" required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground w-full">
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            S'inscrire
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
