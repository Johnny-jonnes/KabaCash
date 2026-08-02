'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function PWAListener() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Gérer la mise à jour du Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Le SW a pris le contrôle, ce qui signifie qu'une mise à jour a été appliquée.
        toast.info('Une mise à jour de FinaX a été installée.', {
          description: 'L\'application va se recharger pour appliquer les nouveautés.',
          duration: 4000,
          onAutoClose: () => window.location.reload(),
          action: {
            label: 'Rafraîchir',
            onClick: () => window.location.reload()
          }
        });
      });
    }

    // 2. Gérer l'installation de la PWA (Desktop / Mobile)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêche Chrome 67 et antérieur d'afficher automatiquement l'invite
      e.preventDefault();
      // Stocke l'événement pour pouvoir le déclencher plus tard
      setDeferredPrompt(e);
      // Optionnel: On peut afficher un Toast proposant l'installation
      toast('Installer FinaX', {
        description: 'Installez l\'application sur votre appareil pour un accès hors-ligne rapide.',
        action: {
          label: 'Installer',
          onClick: async () => {
            if (e) {
              (e as any).prompt();
              const { outcome } = await (e as any).userChoice;
              if (outcome === 'accepted') {
                console.log('L\'utilisateur a accepté l\'installation');
              }
              setDeferredPrompt(null);
            }
          }
        },
        duration: 10000, // Reste un peu plus longtemps
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null; // Composant invisible
}
