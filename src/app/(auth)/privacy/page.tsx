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
        <h1 className="text-lg font-bold">Politique de Confidentialite</h1>
      </div>

      {/* Contenu scrollable */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 text-sm leading-relaxed text-foreground/90">

        {/* ========== CHAPITRE 1 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 1 : Introduction et Definitions</h2>
          
          <h3 className="text-base font-semibold text-foreground mt-4">1.1 Presentation de KabaCash</h3>
          <p>KabaCash est une application de gestion financiere personnelle et de micro-entreprise, developpee pour repondre aux besoins specifiques des utilisateurs en Afrique de l'Ouest, et plus particulierement en Republique de Guinee. L'application permet a ses utilisateurs de suivre leurs revenus, depenses, budgets, comptes bancaires et portefeuilles de monnaie mobile de maniere simple, securisee et accessible meme sans connexion internet.</p>
          <p>KabaCash est concue selon le principe "offline-first" (local d'abord), ce qui signifie que toutes les donnees financieres sont stockees en priorite sur l'appareil de l'utilisateur, garantissant ainsi un acces permanent aux informations meme en l'absence de reseau.</p>
          <p>La presente politique de confidentialite a pour objectif de vous informer de maniere transparente, exhaustive et comprehensible sur la facon dont KabaCash collecte, utilise, stocke, protege et, le cas echeant, partage vos donnees personnelles. En utilisant KabaCash, vous reconnaissez avoir pris connaissance de la presente politique et en accepter les termes.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">1.2 Definitions</h3>
          <p>Aux fins de la presente politique, les termes suivants sont definis comme suit :</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Donnees personnelles</strong> : toute information se rapportant a une personne physique identifiee ou identifiable, directement ou indirectement, notamment par reference a un identifiant tel qu'un nom, un numero d'identification, des donnees de localisation, un identifiant en ligne, ou a un ou plusieurs elements specifiques propres a l'identite physique, physiologique, genetique, psychique, economique, culturelle ou sociale de cette personne.</li>
            <li><strong>Traitement</strong> : toute operation ou ensemble d'operations effectuees ou non a l'aide de procedes automatises et appliquees a des donnees personnelles, telles que la collecte, l'enregistrement, l'organisation, la structuration, la conservation, l'adaptation ou la modification, l'extraction, la consultation, l'utilisation, la communication par transmission, la diffusion ou toute autre forme de mise a disposition, le rapprochement ou l'interconnexion, la limitation, l'effacement ou la destruction.</li>
            <li><strong>Responsable du traitement</strong> : la personne physique ou morale, l'autorite publique, le service ou un autre organisme qui, seul ou conjointement avec d'autres, determine les finalites et les moyens du traitement des donnees personnelles.</li>
            <li><strong>Utilisateur</strong> : toute personne physique qui utilise l'application KabaCash, que ce soit en tant qu'utilisateur inscrit ou visiteur.</li>
            <li><strong>Appareil</strong> : tout dispositif electronique (telephone mobile, tablette, ordinateur) sur lequel l'application KabaCash est installee ou utilisee.</li>
            <li><strong>Stockage local</strong> : le stockage de donnees directement sur l'appareil de l'utilisateur, via la technologie IndexedDB du navigateur web, sans transmission a un serveur distant.</li>
            <li><strong>Service cloud</strong> : tout service de stockage et de traitement de donnees a distance, notamment les services fournis par Supabase pour l'authentification et, le cas echeant, la synchronisation des donnees.</li>
            <li><strong>PIN</strong> : Code d'Identification Personnel, constitue de quatre (4) chiffres, utilise pour securiser l'acces a l'application sur un appareil donne.</li>
            <li><strong>Hachage</strong> : procede cryptographique unidirectionnel transformant une donnee (comme un code PIN) en une empreinte numerique unique et irreversible, rendant impossible la reconstitution de la donnee originale a partir de l'empreinte.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-4">1.3 Date d'entree en vigueur</h3>
          <p>La presente politique de confidentialite entre en vigueur a compter du 16 juin 2026 et s'applique a toutes les versions de l'application KabaCash distribuees a partir de cette date. Toute version anterieure de la politique de confidentialite est remplacee par la presente version.</p>
        </section>

        {/* ========== CHAPITRE 2 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 2 : Responsable du Traitement des Donnees</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">2.1 Identite et coordonnees</h3>
          <p>Le responsable du traitement des donnees personnelles collectees et traitees dans le cadre de l'utilisation de KabaCash est :</p>
          <div className="bg-muted p-4 rounded-lg space-y-1">
            <p><strong>Editeur</strong> : Equipe KabaCash</p>
            <p><strong>Adresse</strong> : Conakry, Republique de Guinee</p>
            <p><strong>Contact</strong> : contact@kabacash.com</p>
          </div>

          <h3 className="text-base font-semibold text-foreground mt-4">2.2 Delegue a la protection des donnees</h3>
          <p>Compte tenu de la nature des traitements effectues par KabaCash et du respect des droits fondamentaux des utilisateurs, l'equipe KabaCash designe un point de contact unique pour toute question relative a la protection des donnees personnelles. Toute demande, reclamation ou exercice de droits peut etre adresse par courrier electronique a l'adresse : privacy@kabacash.com. L'equipe s'engage a repondre dans un delai maximal de trente (30) jours ouvrables a compter de la reception de la demande.</p>
        </section>

        {/* ========== CHAPITRE 3 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 3 : Donnees Collectees</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">3.1 Donnees d'inscription et d'identification</h3>
          <p>Lors de la creation d'un compte sur KabaCash, les informations suivantes sont collectees :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Adresse electronique (email) : utilisee comme identifiant unique de connexion et pour la recuperation du mot de passe.</li>
            <li>Mot de passe : stocke sous forme hachee et salee sur les serveurs Supabase. KabaCash n'a jamais acces a votre mot de passe en clair.</li>
            <li>Nom complet : saisi volontairement par l'utilisateur pour personnaliser son profil dans l'application.</li>
            <li>Numero de telephone : saisi volontairement par l'utilisateur dans la section profil. Cette donnee est facultative et n'est pas requise pour le fonctionnement de l'application.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-4">3.2 Donnees financieres</h3>
          <p>KabaCash collecte et stocke les donnees financieres suivantes, exclusivement sur l'appareil de l'utilisateur (stockage local) :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Comptes financiers : nom du compte, type (especes, mobile money, banque, entreprise), solde, devise, operateur mobile le cas echeant, nom de la banque le cas echeant.</li>
            <li>Transactions : montant, type (revenu, depense, transfert), categorie, date, description, compte source et compte destinataire pour les transferts.</li>
            <li>Budgets : categorie associee, limite de depense, periode (journaliere, hebdomadaire, mensuelle, annuelle ou personnalisee), seuil d'alerte.</li>
            <li>Categories personnalisees : nom, icone, couleur, type (revenu ou depense).</li>
          </ul>
          <p>Ces donnees sont stockees dans la base de donnees IndexedDB de votre navigateur. Elles ne sont pas transmises a nos serveurs sauf si vous activez explicitement la fonctionnalite de synchronisation cloud.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">3.3 Donnees techniques</h3>
          <p>L'application peut collecter automatiquement certaines informations techniques a des fins de fonctionnement et d'amelioration du service :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Type d'appareil et systeme d'exploitation (par exemple : Android 14, iOS 18, Windows 11).</li>
            <li>Type et version du navigateur web (par exemple : Chrome 126, Safari 18).</li>
            <li>Resolution d'ecran et orientation de l'appareil.</li>
            <li>Informations de connexion reseau (uniquement pour determiner si l'appareil est en ligne ou hors-ligne).</li>
          </ul>
          <p>Ces informations techniques ne sont pas associees a votre identite personnelle et ne sont pas utilisees a des fins de profilage ou de publicite ciblee.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">3.4 Donnees de securite</h3>
          <p>Si vous choisissez d'activer le verrouillage par code PIN :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Votre code PIN n'est JAMAIS stocke en clair. Il est transforme par un algorithme de hachage cryptographique SHA-256 avec un sel specifique a l'application avant d'etre enregistre dans le stockage local de votre navigateur.</li>
            <li>Cette empreinte numerique (hash) est irreversible : il est techniquement impossible de retrouver votre code PIN a partir de l'empreinte stockee.</li>
            <li>L'empreinte reste exclusivement sur votre appareil et n'est jamais transmise a un serveur distant.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-4">3.5 Donnees que nous ne collectons PAS</h3>
          <p>KabaCash s'engage a ne PAS collecter les donnees suivantes :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Donnees de geolocalisation (GPS) de votre appareil.</li>
            <li>Contacts de votre repertoire telephonique.</li>
            <li>Messages (SMS, WhatsApp ou autres messageries).</li>
            <li>Photos, videos ou autres fichiers multimedia de votre appareil.</li>
            <li>Historique de navigation sur d'autres sites web ou applications.</li>
            <li>Identifiants publicitaires (IDFA, GAID).</li>
            <li>Donnees biometriques (empreintes digitales, reconnaissance faciale).</li>
            <li>Numeros complets de comptes bancaires, numeros de cartes de credit ou informations financieres aupres de tiers.</li>
          </ul>
        </section>

        {/* ========== CHAPITRE 4 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 4 : Base Juridique du Traitement</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">4.1 Consentement</h3>
          <p>En acceptant la presente politique de confidentialite lors de votre premiere utilisation de KabaCash, vous consentez au traitement de vos donnees personnelles conformement aux finalites decrites dans ce document. Votre consentement est libre, specifique, eclaire et univoque. Vous pouvez retirer votre consentement a tout moment en cessant d'utiliser l'application et en supprimant votre compte.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">4.2 Execution du contrat</h3>
          <p>Certains traitements de donnees sont necessaires a l'execution du contrat entre vous et KabaCash, c'est-a-dire a la fourniture du service de gestion financiere. Sans ces traitements, nous ne serions pas en mesure de vous fournir les fonctionnalites de l'application (creation de comptes, enregistrement de transactions, suivi budgetaire).</p>

          <h3 className="text-base font-semibold text-foreground mt-4">4.3 Interet legitime</h3>
          <p>KabaCash peut traiter certaines donnees techniques sur la base de son interet legitime, notamment pour assurer la securite de l'application, prevenir les fraudes, ameliorer les performances et corriger les dysfonctionnements techniques. Ces traitements sont strictement limites a ce qui est necessaire et ne portent pas atteinte de maniere disproportionnee a vos droits et libertes.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">4.4 Obligation legale</h3>
          <p>KabaCash peut etre tenu de traiter ou de communiquer certaines donnees personnelles en vertu d'une obligation legale, reglementaire ou judiciaire emanant d'une autorite competente de la Republique de Guinee ou de toute autre juridiction applicable. Dans un tel cas, KabaCash s'efforcera de limiter la divulgation au strict minimum requis par la loi.</p>
        </section>

        {/* ========== CHAPITRE 5 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 5 : Finalites du Traitement</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">5.1 Gestion du compte utilisateur</h3>
          <p>Vos donnees d'inscription (email, nom, mot de passe hache) sont utilisees pour creer et gerer votre compte utilisateur, vous permettre de vous connecter a l'application, recuperer votre mot de passe en cas d'oubli, et personnaliser votre experience au sein de l'application.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">5.2 Fourniture du service</h3>
          <p>Vos donnees financieres (comptes, transactions, budgets) sont traitees exclusivement pour vous fournir le service de gestion financiere que vous avez sollicite, c'est-a-dire le suivi de vos revenus et depenses, la gestion de vos comptes, le suivi budgetaire et la generation d'alertes. Ces donnees ne sont utilisees pour aucune autre finalite.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">5.3 Amelioration de l'application</h3>
          <p>Les donnees techniques anonymisees (type d'appareil, version du navigateur) peuvent etre utilisees pour ameliorer les performances de l'application, corriger les bugs, adapter l'interface aux differents types d'ecrans et optimiser l'experience utilisateur. Ces donnees ne permettent en aucun cas de vous identifier personnellement.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">5.4 Securite et prevention de la fraude</h3>
          <p>Les donnees de securite (empreinte du PIN, jetons d'authentification) sont utilisees pour proteger l'acces a votre compte, prevenir les acces non autorises, detecter les activites suspectes et garantir l'integrite de vos donnees financieres.</p>
        </section>

        {/* ========== CHAPITRE 6 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 6 : Stockage des Donnees</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">6.1 Stockage local (IndexedDB)</h3>
          <p>La grande majorite de vos donnees personnelles et financieres sont stockees exclusivement sur votre appareil, dans la base de donnees IndexedDB de votre navigateur web. Cette approche "offline-first" presente les avantages suivants :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Acces instantane a vos donnees, meme sans connexion internet.</li>
            <li>Performance optimale : les requetes sont executees localement, sans latence reseau.</li>
            <li>Souverainete des donnees : vos informations financieres ne quittent pas votre appareil sauf si vous l'autorisez explicitement.</li>
            <li>Protection naturelle : en cas de piratage de nos serveurs, vos donnees financieres ne sont pas exposees car elles ne s'y trouvent pas.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-4">6.2 Stockage cloud (Supabase)</h3>
          <p>Les donnees suivantes sont stockees sur les serveurs de Supabase, notre prestataire d'authentification et de base de donnees cloud :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Donnees d'authentification : adresse email, mot de passe hache, metadonnees du profil (nom complet, numero de telephone).</li>
            <li>Donnees de synchronisation (si activee) : une copie de vos donnees financieres peut etre stockee sur les serveurs Supabase pour permettre la synchronisation entre plusieurs appareils.</li>
          </ul>
          <p>Les serveurs de Supabase sont heberges par Amazon Web Services (AWS) dans des centres de donnees securises. Les donnees en transit sont chiffrees via le protocole TLS 1.2 ou superieur. Les donnees au repos sont chiffrees selon les normes de l'industrie (AES-256).</p>

          <h3 className="text-base font-semibold text-foreground mt-4">6.3 Duree de conservation</h3>
          <p>Les donnees stockees localement sur votre appareil sont conservees tant que vous ne les supprimez pas manuellement ou ne desinstallez pas l'application. Les donnees d'authentification sont conservees sur les serveurs de Supabase tant que votre compte est actif. En cas de suppression de votre compte, toutes les donnees associees seront supprimees dans un delai maximal de trente (30) jours a compter de la demande de suppression.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">6.4 Suppression des donnees</h3>
          <p>Vous pouvez a tout moment supprimer l'ensemble de vos donnees locales en effacant les donnees de l'application dans les parametres de votre navigateur ou en desinstallant l'application. Pour supprimer votre compte et les donnees associees sur nos serveurs, vous pouvez en faire la demande a l'adresse privacy@kabacash.com. La suppression sera effectuee dans les trente (30) jours suivant la verification de votre identite.</p>
        </section>

        {/* ========== CHAPITRE 7 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 7 : Securite des Donnees</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">7.1 Chiffrement des communications</h3>
          <p>Toutes les communications entre l'application KabaCash et les serveurs de Supabase sont chiffrees a l'aide du protocole HTTPS (HTTP Secure) base sur TLS (Transport Layer Security) version 1.2 ou superieure. Ce chiffrement garantit que les donnees transmises ne peuvent etre interceptees, lues ou modifiees par des tiers lors de leur transit sur le reseau.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">7.2 Protection du code PIN</h3>
          <p>Le code PIN de securite, lorsqu'il est active par l'utilisateur, est protege par l'algorithme de hachage cryptographique SHA-256. Un sel (salt) specifique a l'application est ajoute au code PIN avant le hachage, ce qui rend les attaques par dictionnaire ou par tables arc-en-ciel (rainbow tables) significativement plus difficiles. L'empreinte resultante est stockee uniquement dans le localStorage du navigateur sur l'appareil de l'utilisateur et n'est jamais transmise a un serveur distant.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">7.3 Authentification securisee</h3>
          <p>L'authentification des utilisateurs est geree par Supabase Auth, qui met en oeuvre les pratiques de securite suivantes : hachage des mots de passe avec l'algorithme bcrypt, gestion securisee des sessions via des jetons JWT (JSON Web Tokens) avec une duree de vie limitee, protection contre les attaques par force brute via la limitation du nombre de tentatives de connexion, et support de la reinitialisation securisee du mot de passe par email.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">7.4 Mesures techniques et organisationnelles</h3>
          <p>KabaCash met en oeuvre les mesures techniques et organisationnelles suivantes pour proteger vos donnees :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Architecture "offline-first" reduisant la surface d'attaque en limitant les donnees stockees sur des serveurs distants.</li>
            <li>Row Level Security (RLS) sur Supabase garantissant qu'un utilisateur ne peut acceder qu'a ses propres donnees.</li>
            <li>Absence de stockage de donnees sensibles en clair (mots de passe, codes PIN).</li>
            <li>Mise a jour reguliere des dependances logicielles pour corriger les vulnerabilites connues.</li>
            <li>Hebergement sur Vercel avec certificats SSL/TLS automatiques et protection DDoS integree.</li>
            <li>Absence de scripts tiers, de publicites ou de trackers dans l'application.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-4">7.5 Notification en cas de violation de donnees</h3>
          <p>En cas de violation de donnees personnelles susceptible d'engendrer un risque eleve pour les droits et libertes des personnes concernees, KabaCash s'engage a notifier les utilisateurs affectes dans les meilleurs delais et, en tout etat de cause, dans un delai maximal de soixante-douze (72) heures apres en avoir pris connaissance. La notification sera effectuee par courrier electronique a l'adresse associee au compte de l'utilisateur et contiendra une description de la nature de la violation, les categories de donnees concernees, les consequences probables et les mesures prises ou proposees pour y remedier.</p>
        </section>

        {/* ========== CHAPITRE 8 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 8 : Partage et Transfert des Donnees</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">8.1 Principe de non-partage</h3>
          <p>KabaCash ne vend, ne loue, ne negocie et ne partage en aucun cas vos donnees personnelles ou financieres avec des tiers a des fins commerciales, publicitaires, de marketing, de profilage ou toute autre finalite non decrite dans la presente politique. Vos donnees financieres vous appartiennent et restent sous votre controle exclusif.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">8.2 Prestataires techniques</h3>
          <p>Pour assurer le fonctionnement de l'application, KabaCash fait appel aux prestataires techniques suivants, qui peuvent avoir acces a certaines donnees dans le cadre strict de la fourniture de leurs services :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase Inc.</strong> : fournisseur de services d'authentification et de base de donnees cloud. Supabase heberge les donnees d'authentification (email, mot de passe hache) et, le cas echeant, les donnees synchronisees. Supabase est soumis a sa propre politique de confidentialite et s'engage a ne pas utiliser vos donnees a des fins autres que la fourniture de ses services.</li>
            <li><strong>Vercel Inc.</strong> : fournisseur de services d'hebergement web. Vercel heberge le code source de l'application et gere la distribution du contenu statique. Vercel n'a pas acces a vos donnees personnelles ou financieres.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-4">8.3 Transferts internationaux</h3>
          <p>Les serveurs de Supabase et Vercel etant situes aux Etats-Unis et dans d'autres pays, vos donnees d'authentification peuvent faire l'objet d'un transfert international. Ces transferts sont encadres par des clauses contractuelles types et des certifications de conformite aux normes internationales de protection des donnees. KabaCash veille a ce que ces transferts offrent un niveau de protection adequat conformement aux lois applicables.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">8.4 Exigences legales</h3>
          <p>KabaCash peut etre amene a divulguer vos donnees personnelles si la loi l'exige, notamment en reponse a une ordonnance judiciaire, une assignation a comparaitre, une enquete gouvernementale ou toute autre procedure legale. Dans un tel cas, KabaCash s'efforcera de vous informer prealablement de cette divulgation, sauf si la loi l'interdit expressement.</p>
        </section>

        {/* ========== CHAPITRE 9 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 9 : Cookies et Technologies de Suivi</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">9.1 Cookies techniques</h3>
          <p>KabaCash n'utilise aucun cookie publicitaire, cookie de suivi, cookie analytique ou cookie tiers. Les seuls cookies susceptibles d'etre utilises sont des cookies strictement necessaires au fonctionnement de l'authentification (jetons de session), qui expirent automatiquement a la fin de la session ou apres une duree d'inactivite predeterminee.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">9.2 LocalStorage</h3>
          <p>KabaCash utilise le mecanisme de stockage local du navigateur (localStorage) pour sauvegarder les informations suivantes :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Etat de l'authentification (pour eviter de vous reconnecter a chaque ouverture).</li>
            <li>Empreinte hashee du code PIN (si active).</li>
            <li>Preferences de l'application (theme clair/sombre, acceptation de la politique de confidentialite).</li>
          </ul>
          <p>Ces donnees sont stockees localement sur votre appareil et ne sont pas accessibles par des sites web tiers.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">9.3 Absence de tracking publicitaire</h3>
          <p>KabaCash ne contient aucun SDK publicitaire, aucun pixel de suivi, aucun outil d'analyse tiers (comme Google Analytics, Facebook Pixel, Mixpanel ou similaire). Votre activite au sein de l'application n'est ni suivie, ni profilée, ni partagee avec des annonceurs ou des reseaux publicitaires.</p>
        </section>

        {/* ========== CHAPITRE 10 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 10 : Droits des Utilisateurs</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">10.1 Droit d'acces</h3>
          <p>Vous avez le droit d'obtenir la confirmation que des donnees personnelles vous concernant sont ou ne sont pas traitees et, lorsqu'elles le sont, l'acces auxdites donnees ainsi que les informations suivantes : les finalites du traitement, les categories de donnees concernees, les destinataires ou categories de destinataires, la duree de conservation envisagee et l'existence de droits supplementaires (rectification, effacement, limitation, opposition).</p>

          <h3 className="text-base font-semibold text-foreground mt-4">10.2 Droit de rectification</h3>
          <p>Vous avez le droit d'obtenir la rectification de donnees personnelles inexactes vous concernant. Vous pouvez modifier votre nom complet et votre numero de telephone directement dans la section "Profil" de l'application. Pour la modification de votre adresse email, veuillez nous contacter a privacy@kabacash.com.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">10.3 Droit a l'effacement</h3>
          <p>Vous avez le droit d'obtenir l'effacement de vos donnees personnelles dans les cas suivants : les donnees ne sont plus necessaires au regard des finalites pour lesquelles elles ont ete collectees, vous retirez le consentement sur lequel est fonde le traitement, vous vous opposez au traitement et il n'existe pas de motif legitime imperieux, ou les donnees ont fait l'objet d'un traitement illicite. Pour exercer ce droit, vous pouvez supprimer vos donnees locales en effacant les donnees de l'application, et demander la suppression de votre compte en ligne a privacy@kabacash.com.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">10.4 Droit a la limitation du traitement</h3>
          <p>Vous avez le droit d'obtenir la limitation du traitement de vos donnees personnelles dans certains cas prevus par la loi, notamment lorsque vous contestez l'exactitude des donnees, lorsque le traitement est illicite et que vous preferez la limitation a l'effacement, ou lorsque vous avez exerce votre droit d'opposition et que la verification des motifs est en cours.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">10.5 Droit a la portabilite</h3>
          <p>Vous avez le droit de recevoir les donnees personnelles vous concernant dans un format structure, couramment utilise et lisible par machine. L'architecture offline-first de KabaCash facilite l'exercice de ce droit puisque vos donnees financieres sont deja stockees sur votre appareil et peuvent etre exportees depuis les parametres de l'application (fonctionnalite de sauvegarde).</p>

          <h3 className="text-base font-semibold text-foreground mt-4">10.6 Droit d'opposition</h3>
          <p>Vous avez le droit de vous opposer a tout moment au traitement de vos donnees personnelles fonde sur l'interet legitime de KabaCash. En cas d'opposition, KabaCash cessera le traitement des donnees concernees, sauf s'il existe des motifs legitimes et imperieux pour le traitement qui prevalent sur vos interets, droits et libertes.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">10.7 Comment exercer vos droits</h3>
          <p>Pour exercer l'un quelconque des droits mentionnes ci-dessus, vous pouvez nous contacter par courrier electronique a l'adresse privacy@kabacash.com en precisant votre identite (nom, prenom, adresse email associee a votre compte) et le droit que vous souhaitez exercer. Nous vous repondrons dans un delai maximal de trente (30) jours ouvrables. Si votre demande est complexe ou si nous recevons un nombre important de demandes, ce delai peut etre prolonge de deux (2) mois supplementaires, auquel cas nous vous en informerons.</p>
        </section>

        {/* ========== CHAPITRE 11 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 11 : Protection des Mineurs</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">11.1 Age minimum d'utilisation</h3>
          <p>KabaCash est destinee aux personnes agees de seize (16) ans et plus. Les personnes de moins de seize ans ne sont pas autorisees a creer un compte ni a utiliser l'application sans le consentement explicite et verifiable de leur representant legal (parent ou tuteur).</p>

          <h3 className="text-base font-semibold text-foreground mt-4">11.2 Mesures de protection</h3>
          <p>Si nous avons connaissance qu'un mineur de moins de seize ans a cree un compte sans le consentement de son representant legal, nous prendrons les mesures necessaires pour supprimer ce compte et les donnees associees dans les plus brefs delais. Si vous etes parent ou tuteur et que vous estimez que votre enfant a fourni des donnees personnelles a KabaCash sans votre consentement, veuillez nous contacter immediatement a privacy@kabacash.com.</p>
        </section>

        {/* ========== CHAPITRE 12 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 12 : Fonctionnalite Hors-Ligne</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">12.1 Fonctionnement sans internet</h3>
          <p>KabaCash est concue pour fonctionner de maniere complete et autonome sans connexion internet. Toutes les fonctionnalites principales (creation de comptes, enregistrement de transactions, suivi budgetaire, alertes) sont disponibles en mode hors-ligne. Cette conception garantit que vos donnees financieres sont accessibles a tout moment, independamment de la qualite ou de la disponibilite de votre connexion internet.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">12.2 Implications sur la confidentialite</h3>
          <p>Le mode hors-ligne renforce la confidentialite de vos donnees puisque celles-ci restent exclusivement sur votre appareil. Aucune donnee financiere n'est transmise a un serveur distant tant que vous n'activez pas explicitement la synchronisation. Cela signifie egalement que si vous perdez votre appareil sans avoir active la synchronisation, vos donnees financieres seront definitivement perdues. Nous vous recommandons d'activer la sauvegarde reguliere de vos donnees.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">12.3 Synchronisation et ses effets</h3>
          <p>Si vous choisissez d'activer la synchronisation cloud pour acceder a vos donnees depuis plusieurs appareils, une copie de vos donnees financieres sera envoyee et stockee sur les serveurs de Supabase. Ces donnees seront protegees par les memes mesures de securite decrites dans cette politique (chiffrement en transit et au repos, Row Level Security). Vous pouvez desactiver la synchronisation a tout moment depuis les parametres de l'application.</p>
        </section>

        {/* ========== CHAPITRE 13 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 13 : Modifications de la Politique</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">13.1 Procedure de notification</h3>
          <p>KabaCash se reserve le droit de modifier la presente politique de confidentialite a tout moment pour refleter les evolutions de l'application, des pratiques de traitement des donnees ou de la legislation applicable. En cas de modification substantielle, les utilisateurs seront informes par une notification dans l'application et/ou par courrier electronique a l'adresse associee a leur compte. La date de la derniere mise a jour sera clairement indiquee en haut de la politique.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">13.2 Consentement renouvele</h3>
          <p>Si les modifications apportees a la politique de confidentialite affectent de maniere significative la facon dont vos donnees personnelles sont traitees, votre consentement sera a nouveau sollicite avant que les nouvelles pratiques ne s'appliquent a vos donnees. Vous aurez la possibilite d'accepter ou de refuser les nouvelles conditions. En cas de refus, vous pourrez continuer a utiliser l'application sous les conditions precedentes ou choisir de supprimer votre compte.</p>
        </section>

        {/* ========== CHAPITRE 14 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 14 : Legislation Applicable</h2>

          <h3 className="text-base font-semibold text-foreground mt-4">14.1 Droit guineen</h3>
          <p>La presente politique de confidentialite est regie par les lois de la Republique de Guinee. En l'absence de legislation specifique sur la protection des donnees personnelles en Guinee, KabaCash s'engage a respecter les principes generaux de protection de la vie privee reconnus par le droit guineen et les conventions internationales auxquelles la Guinee est partie.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">14.2 Conformite au RGPD</h3>
          <p>Bien que KabaCash soit principalement destinee aux utilisateurs de la Republique de Guinee, nous nous engageons a respecter les principes du Reglement General sur la Protection des Donnees (RGPD) de l'Union Europeenne dans la mesure du possible, notamment en ce qui concerne la transparence, la minimisation des donnees, la limitation des finalites et le respect des droits des personnes concernees. Si vous etes un utilisateur situe dans l'Union Europeenne, vous beneficiez de l'ensemble des droits prevus par le RGPD.</p>

          <h3 className="text-base font-semibold text-foreground mt-4">14.3 Juridiction competente</h3>
          <p>Tout litige relatif a l'interpretation ou a l'execution de la presente politique de confidentialite sera soumis a la competence exclusive des tribunaux de Conakry, Republique de Guinee, sauf disposition legale imperieuse contraire. Les parties s'engagent a rechercher une solution amiable avant toute action judiciaire.</p>
        </section>

        {/* ========== CHAPITRE 15 ========== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Chapitre 15 : Contact</h2>

          <p>Pour toute question, preoccupation, suggestion ou reclamation concernant la presente politique de confidentialite ou le traitement de vos donnees personnelles par KabaCash, vous pouvez nous contacter aux coordonnees suivantes :</p>
          <div className="bg-muted p-4 rounded-lg space-y-1">
            <p><strong>Email general</strong> : contact@kabacash.com</p>
            <p><strong>Protection des donnees</strong> : privacy@kabacash.com</p>
            <p><strong>Adresse postale</strong> : Equipe KabaCash, Conakry, Republique de Guinee</p>
          </div>
          <p>Nous nous engageons a traiter votre demande avec la plus grande diligence et a vous repondre dans les meilleurs delais.</p>
        </section>

        {/* Dernière mise à jour */}
        <div className="border-t border-border pt-6 mt-8">
          <p className="text-xs text-muted-foreground text-center">
            Derniere mise a jour : 16 juin 2026 | Version 1.0
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
