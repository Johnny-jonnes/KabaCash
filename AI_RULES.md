# 🛡️ Règles de Sécurité — OBLIGATOIRES

> Ces règles s'appliquent à CHAQUE ligne de code générée. Aucune exception.

---

## 🔑 Secrets & Clés API

- JAMAIS de clé API, token ou mot de passe en dur dans le code
- TOUS les secrets vont dans `.env.local` (jamais commité)
- `.env` doit être dans `.gitignore` AVANT le premier commit
- **Côté client** : uniquement les variables préfixées (`NEXT_PUBLIC_`, `VITE_`, etc.)
- **Côté serveur** : clés sensibles (Stripe secret, Supabase service key) jamais exposées au frontend

---

## 🗄️ Base de données (Supabase )

- RLS (Row Level Security) ACTIVÉ sur TOUTES les tables sans exception
- Chaque table a au minimum : 1 policy SELECT + 1 UPDATE + 1 DELETE
- Policy par défaut = RESTRICTIVE (tout bloqué sauf ce qui est autorisé explicitement)
- Utiliser UNIQUEMENT `auth.uid()` dans les policies — JAMAIS `user_metadata`
- `service_key` Supabase = BACKEND UNIQUEMENT, jamais dans le code client
- Côté client = uniquement la `anon key`
- Ajouter `WITH CHECK` sur toutes les policies UPDATE et INSERT
- Créer un index sur `user_id` pour chaque table avec RLS

---

## 🔐 Authentification

- Toute page protégée redirige vers `/login` si non connecté
- Tokens JWT validés CÔTÉ SERVEUR, pas uniquement côté client
- Le logout invalide la session complètement (pas juste un redirect)
- Cookies : `Secure`, `HttpOnly`, `SameSite=Strict`
- Refresh token : 15 min access / 7 jours refresh

---

## 🛡️ Inputs utilisateur — Injections

```js
// ❌ INTERDIT
db.query("SELECT * FROM users WHERE id = " + userId)

// ✅ CORRECT
db.query("SELECT * FROM users WHERE id = $1", [userId])
```

- JAMAIS de `innerHTML` ou `dangerouslySetInnerHTML` avec du contenu utilisateur
- Valider ET sanitiser chaque input CÔTÉ SERVEUR (pas seulement côté client)
- Échapper tout output affiché dans le HTML

---

## 🌐 API & Réseau

```
❌ Access-Control-Allow-Origin: *
✅ Access-Control-Allow-Origin: https://monapp.com
```

- HTTPS obligatoire en production
- CORS restreint : domaines autorisés listés explicitement
- Rate limiting sur les endpoints sensibles (login, signup, paiement)
- JAMAIS de secrets dans les URLs (`?apiKey=xxx` → interdit)

---

## 📦 Dépendances & Packages

- Vérifier chaque package ajouté par l'IA dans `package.json` AVANT de commit
- Lancer `npm audit` régulièrement
- Méfiance pour les packages peu connus (< 1 000 téléchargements/semaine)
- JAMAIS de `eval()`, `Function()`, ni exécution dynamique de code

---

## 🚀 Déploiement

- Variables d'environnement configurées dans le dashboard d'hébergement
- Le fichier `.env` n'est PAS dans le repo Git
- Tester en staging avant production
- Aucune erreur n'affiche de stack trace en production
- Headers requis : `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`

---

## ⚡ Les 7 failles à éviter absolument

| # | Faille | Fix |
|---|--------|-----|
| 1 | Service key Supabase en frontend | `anon key` côté client uniquement |
| 2 | RLS désactivé | RLS + policies `auth.uid()` sur toutes les tables |
| 3 | Clé Stripe en dur dans le code | `.env.local` + variable d'environnement |
| 4 | Pas de validation côté serveur | Toujours valider backend |
| 5 | CORS grand ouvert (`*`) | Whitelister les domaines explicitement |
| 6 | Pas de rate limiting | Rate limiting sur endpoints sensibles |
| 7 | Dépendances fantômes | Vérifier chaque package avant install |

---

## 🔍 Prompt d'audit — À utiliser après chaque build

```
Fais un audit de sécurité de mon code actuel. Vérifie :

1. SECRETS     : clés API, tokens ou mots de passe en dur dans le code ?
2. RLS         : activé sur toutes les tables ? policies avec auth.uid() ?
3. INJECTIONS  : concaténations SQL ? innerHTML avec contenu utilisateur ?
4. AUTH        : pages protégées vérifiées ? logout invalide la session ?
5. CORS        : headers restrictifs (pas de wildcard *) ?
6. DEPS        : packages suspects dans package.json ?

Pour chaque problème : ligne exacte + risque en 1 phrase + fix exact.
Ne fais AUCUNE modification sans mon accord. Liste d'abord.
```
Toute table doit contenir :

id uuid
user_id uuid
created_at
updated_at

Index obligatoire :

user_id
created_at
# Données financières

Les montants sont stockés en entier.

❌ float
❌ decimal JS

✅ integer

Exemple :

150000 GNF

jamais

150000.55
# Offline First Obligatoire

Toute nouvelle fonctionnalité doit fonctionner :

1. Sans Internet
2. Avec Internet faible
3. Après reconnexion

Avant d'écrire une feature :

Toujours répondre :

- Que se passe-t-il hors ligne ?
- Où est stockée la donnée ?
- Comment se synchronise-t-elle ?
- Comment gérer les conflits ?

Aucune feature ne peut dépendre uniquement du cloud.
# Mon Projet
Avant de générer du code :

1. Vérifier security.md
2. Vérifier stack.md
3. Vérifier offline.md
4. Vérifier finance.md

Puis répondre :

- Impact sécurité
- Impact synchronisation
- Impact offline
- Impact performance

Ensuite seulement générer le code.

Le code doit être :
- TypeScript strict
- Compatible PWA
- Compatible Supabase
- Compatible IndexedDB
- Sans any
- Sans duplication
- Prêt pour la production
## Fichiers de règles
- Sécurité     : @.cursor/rules/security.md
- Stack        : @.cursor/rules/stack.md
- Workflow     : @.cursor/rules/workflow.md

## Commandes
- Build : npm run build
- Test  : npm run test
- Dev   : npm run dev

## Important
- Toujours lire les fichiers de règles avant de coder
- Ne jamais modifier les règles sans demander
- Ce fichier reste sous 50 lignes — déléguer les détails aux fichiers spécialisés

## Fin de session
Avant de fermer, demander à l'IA :
"Mets à jour tous les fichiers .md avec ce qu'on a fait aujourd'hui.
Ajoute les décisions prises, les patterns utilisés, et les erreurs corrigées."
Toute modification importante doit être historisée.

Exemples :

Budget modifié
Dette modifiée
Objectif modifié

Créer une trace dans :

activity_logs
# Instructions d'Architecture du Projet KabaCash

Avant d'analyser le cahier des charges, considère les décisions techniques suivantes comme définitives et non négociables.

## Objectif

Construire KabaCash, une application de gestion financière personnelle et micro-entrepreneuriale destinée principalement au marché guinéen.

L'application doit être :

* Offline First
* Mobile First
* Installable comme une application Android via PWA
* Performante sur smartphones d'entrée de gamme
* Évolutive vers plusieurs milliers d'utilisateurs
* Sécurisée pour des données financières sensibles

---

# Stack Technique Officielle

## Frontend

* Next.js 15 App Router
* React 19
* TypeScript strict
* Tailwind CSS
* Shadcn/UI

## PWA

* next-pwa
* Service Workers
* Installation Android
* Fonctionnement hors ligne complet

## Stockage Local

* IndexedDB
* Dexie.js

Toutes les fonctionnalités critiques doivent fonctionner sans Internet.

Aucune fonctionnalité essentielle ne doit dépendre exclusivement du cloud.

---

## Backend

* Supabase

Utiliser :

* Supabase Auth
* PostgreSQL
* Row Level Security (RLS)
* Supabase Storage
* Realtime

---

## Validation

* Zod
* React Hook Form

---

## State Management

* Zustand

---

## Graphiques

* Recharts

---

## Rapports PDF

* React PDF

---

# Principes Architecturaux Obligatoires

## Offline First

Toute nouvelle fonctionnalité doit répondre aux questions suivantes :

* Comment fonctionne-t-elle hors ligne ?
* Où la donnée est-elle stockée localement ?
* Comment se synchronise-t-elle ?
* Comment les conflits sont-ils résolus ?

---

## Synchronisation

Toutes les entités synchronisées doivent contenir :

* id
* user_id
* created_at
* updated_at
* sync_status

Valeurs possibles :

* pending
* synced
* conflict
* deleted

Utiliser le soft delete.

Ne jamais supprimer physiquement une donnée métier.

---

## Données Financières

Les montants doivent être stockés sous forme d'entiers.

Exemple :

150000 GNF

Jamais :

150000.75

Éviter les erreurs liées aux nombres flottants.

---

## Historique

Toute modification financière importante doit être traçable.

Créer un système d'activité permettant d'auditer :

* transactions
* budgets
* objectifs
* dettes
* remboursements

---

## IA

Ne jamais utiliser un LLM pour effectuer :

* calcul de solde
* calcul budgétaire
* calcul de dette
* calcul d'épargne

Tous les calculs financiers doivent être déterministes et réalisés par du code métier.

L'IA sert uniquement à :

* expliquer
* résumer
* conseiller
* répondre en langage naturel

---

## Priorité Produit

Lorsqu'une fonctionnalité peut être implémentée de plusieurs façons :

Privilégier :

1. Fiabilité
2. Simplicité
3. Offline First
4. Performance
5. Complexité minimale

Ne pas surconcevoir.

Le MVP doit permettre à un utilisateur de gérer efficacement ses finances avant d'ajouter des fonctionnalités avancées.

---

Après avoir assimilé ces contraintes, analyse intégralement le cahier des charges fourni et propose l'architecture complète du projet.
# Principe fondamental

KabaCash est une application financière.

La cohérence des données est plus importante que la rapidité de développement.

Aucune fonctionnalité ne doit pouvoir :
- perdre une transaction
- modifier un montant silencieusement
- créer des doublons
- supprimer des données sans traçabilité

Chaque opération financière doit être traçable.
# Synchronisation

Toute table synchronisée contient :

id
created_at
updated_at
user_id
sync_status

sync_status :

pending
synced
conflict
deleted

Aucune suppression physique.

Utiliser le soft delete :

deleted_at