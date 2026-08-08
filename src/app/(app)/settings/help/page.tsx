'use client';

import { Header } from '@/components/layout/Header';
import { FaqSection } from '@/components/settings/FaqSection';
import { Mail, Phone } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Démarrer',
    items: [
      {
        q: "Comment ajouter une dépense ou un revenu rapidement ?",
        a: "Appuyez sur le bouton vert (+) en bas de l'écran. Choisissez Dépense, Revenu ou Transfert, saisissez le montant sur le clavier, puis la catégorie et le compte. Vous pouvez aussi ajouter une note en appuyant sur \"+ Ajouter une note\" avant de valider. Toute l'opération prend moins de 3 secondes.",
      },
      {
        q: "Comment voir le détail complet d'une transaction ?",
        a: "Appuyez simplement sur une transaction dans la liste (Accueil ou onglet Transactions). Vous verrez tous les détails : compte, catégorie, date, et l'historique complet (création, modifications) pour savoir exactement ce qui s'est passé et quand.",
      },
      {
        q: "Comment modifier ou supprimer une transaction ?",
        a: "Sur la liste des transactions, glissez une transaction vers la droite pour la modifier, ou vers la gauche pour la supprimer (vous avez quelques secondes pour annuler). Un appui long ouvre un menu avec plus d'options : dupliquer, ajouter aux favoris, partager, changer de catégorie.",
      },
    ],
  },
  {
    title: 'Comptes',
    items: [
      {
        q: "Comment créer un compte ?",
        a: "Allez dans l'onglet \"Comptes\", appuyez sur \"Nouveau\", choisissez le type (Espèces, Mobile Money, Banque ou Compte Pro) et remplissez les informations. Vous pouvez créer autant de comptes que nécessaire pour séparer votre argent (personnel, professionnel, par activité).",
      },
      {
        q: "Comment transférer tout un compte vers un autre ?",
        a: "Sur un compte (page Comptes, ou dans le détail d'un espace), appuyez sur l'icône ⇄. Choisissez le compte de destination : tout l'historique et le solde restant y sont déplacés, puis le compte d'origine se ferme. Utile par exemple pour regrouper un compte personnel dans un compte d'entreprise.",
      },
      {
        q: "Que se passe-t-il si je supprime un compte ?",
        a: "Le compte disparaît de votre liste, mais l'historique de ses transactions reste conservé et consultable — rien n'est jamais perdu définitivement.",
      },
    ],
  },
  {
    title: 'Budgets',
    items: [
      {
        q: "Comment fonctionnent les budgets ?",
        a: "Vous définissez un montant limite pour une catégorie, sur une période (jour, semaine, mois, année ou durée personnalisée). La carte affiche en grand ce qu'il vous RESTE à dépenser (pas juste le pourcentage), avec le montant de départ toujours visible à côté. L'app vous alerte automatiquement en approchant de la limite.",
      },
      {
        q: "Que se passe-t-il si je dépasse un budget ?",
        a: "La carte devient rouge et une alerte apparaît dans vos Notifications. Rien n'est bloqué — vous pouvez toujours dépenser — mais vous êtes prévenu clairement pour décider en connaissance de cause.",
      },
    ],
  },
  {
    title: 'Planification',
    items: [
      {
        q: "À quoi sert la Planification ?",
        a: "Elle permet de noter à l'avance une dépense ou un revenu que vous savez déjà arriver à une date future (ex: \"Mars : achat semences\", \"15 du mois : paiement fournisseur\", \"Septembre : vente récolte\"). Contrairement à un budget, ça n'affecte rien tant que la date n'est pas arrivée — c'est une anticipation, pas une dépense réelle.",
      },
      {
        q: "Comment \"réaliser\" une prévision ?",
        a: "Ouvrez la prévision (menu Réglages > Planification), appuyez sur \"Réaliser maintenant\", choisissez le compte concerné et confirmez. Ça crée une vraie transaction qui affecte votre solde, et la prévision passe au statut \"Réalisé\". Si la date est dépassée sans action, elle passe en \"En retard\" pour attirer votre attention.",
      },
    ],
  },
  {
    title: "Objectifs d'épargne",
    items: [
      {
        q: "Comment créer un objectif et y contribuer ?",
        a: "Depuis le tableau de bord ou la page Objectifs, créez un objectif avec un montant cible et une date. Chaque contribution est une vraie dépense (catégorie \"Épargne\") débitée d'un compte que vous choisissez — l'argent mis de côté est donc réellement immobilisé, pas juste un chiffre affiché.",
      },
    ],
  },
  {
    title: 'Espaces Famille & Entreprise',
    items: [
      {
        q: "Qu'est-ce qu'un espace ?",
        a: "Un espace permet de partager des comptes, transactions, budgets et objectifs avec d'autres personnes (famille ou équipe). Depuis Réglages > \"Espaces Famille & Entreprise\", créez un espace ou rejoignez-en un avec un code d'invitation à 6 caractères.",
      },
      {
        q: "Quelle est la différence entre Chef et Membre ?",
        a: "Le Chef (celui qui crée l'espace) peut voir un rapport des dépenses par membre, retirer un membre, et transférer les comptes de l'espace. Un Membre peut enregistrer des transactions dans les comptes partagés et quitter l'espace quand il le souhaite.",
      },
      {
        q: "Comment passer d'un espace à un autre ?",
        a: "Utilisez le sélecteur en haut de l'écran (à côté de la cloche de notifications) — il indique \"Personnel\" ou le nom de l'espace actif. Toutes les pages (comptes, transactions, budgets) affichent alors uniquement les données de l'espace sélectionné.",
      },
    ],
  },
  {
    title: 'Analytics',
    items: [
      {
        q: "Que puis-je voir dans Analytics ?",
        a: "Cinq vues : répartition des dépenses par catégorie/compte/commerçant, évolution dans le temps, habitudes (jours/heures où vous dépensez le plus), comparaison entre deux périodes, et prévisions basées sur votre rythme réel. Utile pour comprendre où va votre argent, pas juste combien.",
      },
    ],
  },
  {
    title: 'Notifications',
    items: [
      {
        q: "D'où viennent les notifications ?",
        a: "Elles sont générées automatiquement à partir de vos vraies données : dépassement de budget, dépense inhabituelle, revenu récurrent manquant, solde presque vide, bonnes nouvelles (épargne solide, objectif atteint). Aucune intelligence artificielle générative n'est utilisée — uniquement des calculs sur vos chiffres réels.",
      },
      {
        q: "Comment nettoyer mes notifications ?",
        a: "Dans Notifications, le bouton \"Supprimer les lues\" les efface d'un coup. Un nettoyage automatique passe aussi une fois par semaine pour garder la liste légère.",
      },
    ],
  },
  {
    title: 'Synchronisation & hors-ligne',
    items: [
      {
        q: "L'app fonctionne-t-elle sans internet ?",
        a: "Oui, entièrement — ajout, consultation, budgets, tout fonctionne hors-ligne. Dès que la connexion revient, tout se synchronise automatiquement avec le cloud.",
      },
      {
        q: "Mes données ne semblent pas à jour, que faire ?",
        a: "Allez dans Réglages > \"Sauvegarde & Synchro\" et appuyez sur \"Synchroniser maintenant\". Ce bouton envoie vos modifications en attente ET récupère tout ce qui manquerait localement (utile après une installation sur un nouvel appareil, par exemple).",
      },
    ],
  },
  {
    title: 'Sécurité',
    items: [
      {
        q: "Mes données sont-elles en sécurité ?",
        a: "Oui. Vos données sont d'abord stockées localement sur votre téléphone. Si la synchronisation cloud est active, elles sont chiffrées en transit et sauvegardées sur des serveurs sécurisés. Aucune donnée n'est partagée avec des tiers.",
      },
      {
        q: "Comment activer le code PIN ?",
        a: "Dans Réglages > \"Sécurité et PIN\", activez le verrouillage par code. Il vous sera demandé à chaque ouverture de l'app pour protéger l'accès à vos finances.",
      },
    ],
  },
];

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
              <a href="mailto:trillionnx@gmail.com" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                trillionnx@gmail.com
              </a>
              <a href="tel:+224627171397" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Phone className="w-4 h-4" />
                </div>
                +224 627 17 13 97
              </a>
            </div>
          </div>

          {/* Guide complet, par thème */}
          {SECTIONS.map((section) => (
            <FaqSection key={section.title} title={section.title} items={section.items} />
          ))}

        </div>
      </div>
    </>
  );
}
