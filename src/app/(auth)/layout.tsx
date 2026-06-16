'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Ne pas bloquer la page de confidentialité elle-même
    if (pathname === '/privacy') {
      setIsChecking(false);
      return;
    }

    // Vérifier si la politique de confidentialité a été acceptée
    const privacyAccepted = localStorage.getItem('kabacash_privacy_accepted');
    if (!privacyAccepted) {
      router.replace('/privacy');
      return;
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace('/dashboard');
      } else {
        setIsChecking(false);
      }
    });
  }, [router, pathname]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // La page de confidentialité gère son propre layout (plein écran scrollable)
  if (pathname === '/privacy') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
