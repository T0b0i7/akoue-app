# Akouè Admin Web (HTML/CSS/JS — sans installation)

Dashboard admin 100 % statique : aucune dépendance, rien à installer,
l'app mobile n'est pas impactée.

## Fichiers

- `index.html` — connexion + KPI (inscrits, 7j, wallets, transactions, revenus/dépenses)
- `users.html` — liste des inscrits (nom, email, inscription, wallets, tx, activité, verrou) + recherche + export CSV
- `notifications.html` — publier une notif visible par TOUS les utilisateurs de l'app (`info` / `update`)
- `styles.css`, `app.js`, `config.js` — style + logique partagée

## Mise en route (une fois)

1. Exécuter `supabase-admin.sql` dans Supabase Dashboard > SQL Editor
   (crée `admin_users`, ajoute ton email, ajoute la colonne `email` sur `profiles`
   + rattrape les emails existants, ouvre la lecture admin via RLS)
2. Ouvrir `index.html` dans le navigateur
   (ou servir le dossier : `npx serve admin-web` puis http://localhost:3000)
3. Se connecter avec `abattieucher@gmail.com` + ton mot de passe Akouè

## Sécurité

- Aucune clé secrète : seule la clé publique `anon` est dans `config.js` (normal).
- Pas de `service_role` nulle part — l'accès admin passe par le RLS
  (`admin_users` + `auth.jwt() ->> 'email'`).
- L'app mobile garde ses policies `uid = auth.uid()` : chaque user ne voit que ses données.
