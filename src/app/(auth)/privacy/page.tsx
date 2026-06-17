'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const handleAccept = () => {
    localStorage.setItem('kabacash_privacy_accepted', 'true');
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête fixe */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Politique de Confidentialité</h1>
      </div>

      {/* Contenu scrollable */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 text-sm leading-relaxed text-foreground/90">

        {/* ========== CHAPITRE 1 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 1 : Introduction et Définitions</h2>
          
          <h3 className="text-base font-semibold text-foreground mt-4">1.1 Présentation de KabaCash</h3>
          <p>KabaCash est une application de gestion financière personnelle et de micro-entreprise, développée par la société <strong>TrillionX</strong> pour répondre aux besoins spécifiques des utilisateurs en Afrique de l'Ouest, et plus particulièrement en République de Guinée. L'application permet à ses utilisateurs de suivre leurs revenus, dépenses, budgets, comptes bancaires et portefeuilles de monnaie mobile de manière simple, sécurisée et accessible même sans connexion internet.</p>
          <p>KabaCash est conçue selon le principe "offline-first" (local d'abord), ce qui signifie que toutes les données financières sont stockées en priorité sur l'appareil de l'utilisateur, garantissant ainsi un accès permanent aux informations même en l'absence de réseau.</p>
          <p>La présente politique de confidentialité a pour objectif de vous informer de manière transparente, exhaustive et compréhensible sur la façon dont KabaCash collecte, utilise, stocke, protège et s'engage à <strong>ne pas partager</strong> vos données personnelles. En utilisant KabaCash, vous reconnaissez avoir pris connaissance de la présente politique et en accepter les termes.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">1.2 Définitions</h3>
          <p>Aux fins de la présente politique, les termes suivants sont définis comme suit :</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Données personnelles</strong> : toute information se rapportant à une personne physique identifiée ou identifiable, directement ou indirectement, notamment par référence à un identifiant tel qu'un nom, une adresse e-mail, etc.</li>
            <li><strong>Traitement</strong> : toute opération effectuée sur des données personnelles, telles que la collecte, l'enregistrement, le stockage, etc.</li>
            <li><strong>Responsable du traitement</strong> : l'entreprise TrillionX qui détermine les finalités et les moyens du traitement des données personnelles dans le cadre de KabaCash.</li>
            <li><strong>Utilisateur</strong> : toute personne physique qui utilise l'application KabaCash.</li>
            <li><strong>Stockage local</strong> : le stockage de données directement sur l'appareil de l'utilisateur, via la technologie IndexedDB du navigateur web, sans transmission à un serveur distant.</li>
            <li><strong>Service cloud</strong> : service de stockage à distance pour l'authentification et la sauvegarde synchronisée.</li>
            <li><strong>PIN</strong> : Code d'Identification Personnel, utilisé pour sécuriser l'accès à l'application.</li>
            <li><strong>Hachage</strong> : procédé cryptographique irréversible transformant une donnée (comme un code PIN) en une empreinte numérique unique, rendant impossible la reconstitution du code original.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-4">1.3 Date d'entrée en vigueur</h3>
          <p>La présente politique de confidentialité entre en vigueur à compter du 16 juin 2026 et s'applique à toutes les versions de l'application KabaCash distribuées à partir de cette date.</p>
        </section>

        {/* ========== CHAPITRE 2 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 2 : Responsable du Traitement des Données</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">2.1 Identité et coordonnées</h3>
          <p>Le responsable du traitement des données personnelles collectées et traitées dans le cadre de l'utilisation de KabaCash est :</p>
          <div className="bg-muted p-4 rounded-lg space-y-1">
            <p><strong>Éditeur</strong> : TrillionX</p>
            <p><strong>Adresse</strong> : Conakry, République de Guinée</p>
            <p><strong>Contact</strong> : trillionnx@gmail.com</p>
          </div>

          <h3 className="text-base font-semibold text-foreground mt-4">2.2 Délégué à la protection des données</h3>
          <p>TrillionX a désigné un point de contact unique pour toute question relative à la protection des données. Vous pouvez exercer vos droits par e-mail à : trillionnx@gmail.com.</p>
        </section>

        {/* ========== CHAPITRE 3 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 3 : Données Collectées</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">3.1 Données d'inscription et d'identification</h3>
          <p>Lors de la création d'un compte sur KabaCash, nous collectons :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Adresse électronique (email) : utilisée comme identifiant unique de connexion.</li>
            <li>Mot de passe : stocké sous forme hachée et salée. TrillionX n'a jamais accès à votre mot de passe en clair.</li>
            <li>Nom complet : saisi volontairement pour personnaliser votre profil.</li>
            <li>Numéro de téléphone : saisi volontairement. Donnée facultative non requise.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-4">3.2 Données financières</h3>
          <p>KabaCash collecte et stocke les données financières (comptes, transactions, budgets, catégories) <strong>exclusivement sur votre appareil (stockage local)</strong> en mode hors ligne. Ces données ne sont transmises à nos serveurs que si vous activez explicitement la fonctionnalité de synchronisation cloud pour vos sauvegardes.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">3.3 Données de sécurité</h3>
          <p>Si vous choisissez d'activer le verrouillage par code PIN, votre code PIN n'est JAMAIS stocké en clair. Il est transformé par un algorithme cryptographique SHA-256. Cette empreinte reste exclusivement sur votre appareil et n'est jamais transmise aux serveurs de TrillionX.</p>
        </section>

        {/* ========== CHAPITRE 4 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 4 : La promesse de Non-Partage des données</h2>

          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <h3 className="font-bold text-primary mb-2">ENGAGEMENT STRICT DE TRILLIONX</h3>
            <p><strong>TrillionX s'engage formellement et juridiquement à ne JAMAIS vendre, louer, négocier ou partager vos données personnelles et financières avec des tiers (annonceurs, banques, entreprises tierces).</strong> Vos données sont strictement confidentielles. Notre modèle économique ne repose pas sur l'exploitation de vos données financières.</p>
          </div>

          <h3 className="text-base font-semibold text-foreground mt-4">4.1 Prestataires techniques</h3>
          <p>Pour assurer le fonctionnement technique de l'application (hébergement, authentification), TrillionX fait appel à des prestataires de classe mondiale (Supabase, Vercel) soumis à des exigences strictes de sécurité. Ils n'ont pas l'autorisation d'exploiter vos données à d'autres fins que le strict fonctionnement de l'infrastructure de KabaCash.</p>
        </section>

        {/* ========== CHAPITRE 5 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 5 : Stockage et Sécurité</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">5.1 Stockage local (IndexedDB)</h3>
          <p>La grande majorité de vos données personnelles et financières sont stockées exclusivement sur votre appareil. Cette approche garantit que vos informations financières ne quittent pas votre téléphone sans votre autorisation.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">5.2 Sécurité et Chiffrement</h3>
          <p>Toutes les communications entre l'application KabaCash et les serveurs d'authentification sont chiffrées à l'aide du protocole HTTPS/TLS. Les mots de passe et codes PIN sont chiffrés et hachés de manière irréversible.</p>
        </section>

        {/* ========== CHAPITRE 6 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 6 : Cookies et Suivi</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">6.1 Absence de tracking publicitaire</h3>
          <p>KabaCash ne contient aucun SDK publicitaire, aucun pixel de suivi, et aucun outil d'analyse tiers. Votre activité au sein de l'application n'est ni suivie, ni profilée.</p>
        </section>

        {/* ========== CHAPITRE 7 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 7 : Droits des Utilisateurs</h2>

          <p>Conformément aux lois applicables sur la protection des données (y compris l'esprit du RGPD pour garantir les standards les plus élevés), vous disposez à tout moment des droits suivants :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Droit d'accès</strong> : pour consulter vos données.</li>
            <li><strong>Droit de rectification</strong> : pour corriger vos informations (depuis l'onglet Profil).</li>
            <li><strong>Droit à l'effacement</strong> : pour supprimer définitivement votre compte et vos données.</li>
            <li><strong>Droit à la portabilité</strong> : pour exporter vos données financières sous forme de fichier.</li>
          </ul>
          <p>Pour exercer vos droits, contactez-nous à : <strong>trillionnx@gmail.com</strong></p>
        </section>

        {/* ========== CHAPITRE 8 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 8 : Contact et Juridiction</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">8.1 Juridiction compétente</h3>
          <p>La présente politique de confidentialité est régie par les lois de la République de Guinée. Tout litige relatif à l'interprétation ou à l'exécution de la présente politique sera soumis à la compétence exclusive des tribunaux de Conakry, République de Guinée.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">8.2 Contactez TrillionX</h3>
          <p>Pour toute question ou réclamation concernant la présente politique de confidentialité développée par TrillionX pour KabaCash, vous pouvez nous contacter :</p>
          <div className="bg-muted p-4 rounded-lg space-y-1">
            <p><strong>Support KabaCash</strong> : trillionnx@gmail.com</p>
            <p><strong>Protection des données</strong> : trillionnx@gmail.com</p>
          </div>
        </section>

        {/* Dernière mise à jour */}
        <div className="border-t border-border pt-6 mt-8">
          <p className="text-xs text-muted-foreground text-center">
            Dernière mise à jour : 16 juin 2026 | Document édité par TrillionX
          </p>
        </div>

        {/* Bouton d'acceptation */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t border-border -mx-4 px-4">
          <Button onClick={handleAccept} className="w-full" size="lg">
            J'accepte et je continue
          </Button>
        </div>
      </div>
    </div>
  );
}
