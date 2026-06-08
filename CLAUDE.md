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
