'use client';

import { Header } from '@/components/layout/Header';
import { Mail, Phone, Globe } from 'lucide-react';

export default function HelpPage() {
  return (
    <>
      <Header title="Aide et Support" showBack />
      <div className="p-4 space-y-6">
        <div className="max-w-sm mx-auto mt-4 space-y-6">

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contactez-nous</h3>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
              <a href="mailto:support@kabacash.com" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                support@kabacash.com
              </a>
              <a href="tel:+224600000000" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Phone className="w-4 h-4" />
                </div>
                +224 600 00 00 00
              </a>
              <a href="https://kabacash.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Globe className="w-4 h-4" />
                </div>
                www.kabacash.com
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Questions fréquentes</h3>
            <div className="space-y-3">
              <details className="bg-card border border-border rounded-xl p-4 shadow-sm group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between font-medium cursor-pointer text-sm">
                  Comment créer un compte ?
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  Allez dans l'onglet "Comptes", cliquez sur le bouton "Nouveau", remplissez les informations demandées (Banque, Mobile Money ou Espèces) et validez.
                </p>
              </details>

              <details className="bg-card border border-border rounded-xl p-4 shadow-sm group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between font-medium cursor-pointer text-sm">
                  Comment fonctionnent les budgets ?
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  Vous pouvez définir une limite de dépense (journalière, hebdomadaire, mensuelle ou annuelle) pour une catégorie spécifique. L'application calculera automatiquement si vous dépassez ce montant à chaque nouvelle dépense.
                </p>
              </details>

              <details className="bg-card border border-border rounded-xl p-4 shadow-sm group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between font-medium cursor-pointer text-sm">
                  Mes données sont-elles en sécurité ?
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  Oui, toutes vos données sont stockées localement sur votre téléphone. Si vous activez la synchronisation cloud, elles seront cryptées et sauvegardées sur nos serveurs sécurisés.
                </p>
              </details>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
