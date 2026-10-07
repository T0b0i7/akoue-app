# Conversation — 2026-10-07 (Eucher O. ABATTI)

## Dashboard admin web (`admin-web/`)
- Demande : voir la liste des inscrits + page notifs globales pour tous les users.
- Axes retenus : vue d'ensemble (KPI), utilisateurs inscrits, wallets/transactions, rétention, broadcasts, santé/support, admin/sécurité.
- V1 en Next.js (`admin-web/` + API `service_role`) → **abandonnée** : trop lourd, Metro EMFILE sur Windows à cause de `node_modules`.
- V2 en **HTML/CSS/JS statique** : `index.html` (login + KPI), `users.html` (table + recherche + export CSV), `notifications.html` (CRUD `broadcasts` info/update), `styles.css`, `app.js`, `config.js` (clé anon publique uniquement).
- Sécurité : pas de `service_role` côté client ; accès via RLS (`admin_users` + `auth.jwt() ->> 'email'`). Fichier `supabase-admin.sql` à exécuter (crée `admin_users`, ajoute `profiles.email`, backfill depuis `auth.users`, policies admin read + broadcasts admin all).
- `metro.config.js` : tentative blockList `/admin-web/` → cassait Metro (flags / config illisible) → **revert à l'origine**, dossier statique sans `node_modules` donc plus de conflit.
- Mobile : `auth-context.tsx` signup stocke désormais `email` dans `profiles`.

## Compte admin
- Email : `abattieucher@gmail.com`. L'utilisateur ne connaissait pas le mot de passe → proposé reset via app (Mot de passe oublié) ou recréation.
- Clé `service_role` collée dans le chat → retirée de `.env.local`, demandé suppression du message + **régénération de la clé** dans Supabase (clé exposée).
- Suppression/recréation du compte : à faire dans Supabase Dashboard > Authentication > Users (client incapable de self-delete). Le "Supprimer le compte" de l'app n'efface que wallets/tx/profile, pas le user Auth.

## Écran verrou (`/app-lock-setup`)
- Ajout option **"Aucun"** (existait déjà en type/service/UI mais pas proposée sur l'écran) : tap → `setAppLock("none")` direct.
- Fix écran final : avec "Aucun" affiche "Aucun verrou / Ouverture directe…" au lieu de "Verrou appliqué ✓".

## Push
- Commit `5eb9a89` sur `main` → `origin` (T0b0i7/akoue-app) : `feat: dashboard admin web (inscrits, notifs) + option verrou Aucun + email profiles`. Aucun secret commité (`.env*` ignorés).

## EN ATTENTE (à reprendre)
- [ ] Exécuter `admin-web/supabase-admin.sql` dans Supabase SQL Editor (pas confirmé)
- [ ] Régénérer la clé `service_role` exposée (Settings > API)
- [ ] Régler le compte `abattieucher@gmail.com` (reset mdp ou delete + réinscription + confirmation email)
- [ ] Déployer `admin-web/` sur Vercel : import repo, **Root Directory = `admin-web`**, Deploy (CLI non connecté : `vercel login` requis si en CLI)
