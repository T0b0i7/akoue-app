# Contribuer à Akouè App

Merci de ton intérêt pour Akouè ! Toute contribution est la bienvenue — bugfix, feature, doc ou design.

## Démarrage rapide

```bash
git clone https://github.com/T0b0i7/akoue-app.git
cd akoue-app
pnpm install
cp .env.example .env   # remplir Supabase / Firebase
pnpm start
```

## Workflow

1. **Fork** le repo → clone ton fork
2. Crée une branche : `git checkout -b feat/ma-feature` ou `fix/bug-xyz`
3. Code en respectant :
   - TypeScript strict (pas de `any` implicite)
   - `pnpm lint` doit passer (`eslint-config-expo`)
   - Composants dans `components/`, logique dans `services/` / `context/`
4. Teste : `pnpm start` + vérif manuelle. Si tu touches aux tests : `npx playwright test`
5. Commit conventionnel :
   - `feat: ajoute filtre par date`
   - `fix: corrige calcul balance wallet`
   - `docs: met à jour README`
   - `chore: bump expo`
6. Push : `git push origin feat/ma-feature`
7. Ouvre une **Pull Request** vers `main` — remplis le template `.github/PULL_REQUEST_TEMPLATE.md`

## Règles

- Un PR = un sujet. Évite les PR géantes.
- Pas de secrets dans le code (`.env` est gitignoré).
- Ajoute une capture / vidéo si changement UI.
- Sois bienveillant — voir `CODE_OF_CONDUCT.md` si présent.

## Signaler un bug / Proposer une feature

- Vérifie les [issues existantes](https://github.com/T0b0i7/akoue-app/issues)
- Ouvre une issue avec : contexte, étapes pour reproduire, attendu vs obtenu, captures / logs

## Besoin d'aide ?

Ouvre une issue avec le label `question` ou contacte le mainteneur via les Discussions GitHub.

Merci 🙏 — chaque étoile et chaque PR compte !
