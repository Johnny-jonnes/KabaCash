'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { BottomNav } from '@/components/layout/BottomNav';
import { PinLock } from '@/components/auth/PinLock';
import { NetworkStatus } from '@/components/pwa/NetworkStatus';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, setUser, logout, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Si on est hors-ligne mais qu'on a une session persistée dans Zustand,
    // on autorise l'accès direct (offline-first).
    if (!navigator.onLine && isAuthenticated && user) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // Vérifier la session Supabase au chargement
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user) {
        setUser(session.user, session.access_token);
        setIsLoading(false);
      } else if (error && isAuthenticated && user) {
        // Erreur réseau mais session locale disponible → accès offline
        console.warn('[KabaCash] Session Supabase indisponible, mode hors-ligne actif.');
        setIsLoading(false);
      } else {
        // Pas de session Supabase ET pas de session locale → rediriger
        logout();
        router.replace('/login');
      }
    }).catch(() => {
      // Timeout/erreur réseau : si session locale dispo, on continue en offline
      if (isAuthenticated && user) {
        console.warn('[KabaCash] Impossible de contacter Supabase, mode hors-ligne actif.');
        setIsLoading(false);
      } else {
        logout();
        router.replace('/login');
      }
    });

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          // Ne pas déconnecter si on est juste hors-ligne
          if (navigator.onLine) {
            setUser(null);
            router.replace('/login');
          }
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

        {/* Écouteur de réseau + sync automatique */}
        <NetworkStatus />
      </div>
    </PinLock>
  );
}
