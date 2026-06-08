'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { BottomNav } from '@/components/layout/BottomNav';
import { PinLock } from '@/components/auth/PinLock';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Vérifier la session Supabase au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user, session.access_token);
        setIsLoading(false);
      } else {
        // Pas de session Supabase → nettoyer le store local et rediriger
        logout();
        router.replace('/login');
      }
    });

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          router.replace('/login');
        } else if (session?.user) {
          setUser(session.user, session.access_token);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, setUser]);

  // Écran de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas authentifié, ne rien afficher (la redirection est en cours)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <PinLock>
      <div className="flex flex-col min-h-screen bg-background text-foreground pb-16 md:pb-0 md:pl-64">
        <div className="hidden md:block fixed top-0 left-0 w-64 h-full z-50">
          <BottomNav />
        </div>
        
        <main className="flex-1 w-full max-w-screen-xl mx-auto relative p-0 md:p-6">
          {children}
        </main>
        
        <div className="md:hidden fixed bottom-0 w-full z-50">
          <BottomNav />
        </div>
      </div>
    </PinLock>
  );
}
