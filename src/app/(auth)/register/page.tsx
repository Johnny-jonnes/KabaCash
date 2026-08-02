'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // N'accepter que les chiffres, espaces et le + au début (même règle que settings/profile)
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^0-9+ ]/g, '');
    const noPlus = cleaned.replace(/\+/g, '');
    const finalValue = cleaned.startsWith('+') ? '+' + noPlus : noPlus;
    if (finalValue.length <= 16) setPhone(finalValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation stricte du nom
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      toast.error('Le nom doit contenir entre 2 et 50 caractères');
      return;
    }

    // Validation stricte de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    // Validation stricte du téléphone
    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      toast.error('Le numéro de téléphone doit contenir entre 9 et 15 chiffres');
      return;
    }

    // Validation stricte du mot de passe
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: trimmedName,
            phone: phone.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Cet email est déjà utilisé. Connectez-vous à la place.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user && data.session) {
        setUser(data.user, data.session.access_token);
        toast.success('Compte créé avec succès, bienvenue');
        router.replace('/dashboard');
      } else if (data.user && !data.session) {
        toast.success('Compte créé. Vérifiez votre email pour confirmer votre inscription.');
        router.replace('/login');
      }
    } catch {
      toast.error('Erreur lors de la création du compte. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
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
            <Input 
              id="fullname" 
              placeholder="Oumar Diallo" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
              minLength={2}
              maxLength={50}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="votre@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+224 620 00 00 00"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              required
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="6 caractères minimum" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Input 
              id="confirm-password" 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              minLength={6}
              autoComplete="new-password"
            />
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
