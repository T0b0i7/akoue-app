# Akouè Admin Web (HTML/CSS/JS — sans installation)

Dashboard admin 100 % statique : aucune dépendance, rien à installer,
l'app mobile n'est pas impactée.

## Fichiers

- `index.html` — connexion + KPI (inscrits, 7j, wallets, transactions, revenus/dépenses)
- `users.html` — liste des inscrits (nom, email, inscription, wallets, tx, activité, verrou) + recherche + export CSV
- `notifications.html` — publier une notif visible par TOUS les utilisateurs de l'app (`info` / `update`)
- `styles.css`, `app.js`, `config.js` — interface responsive + logique partagée

Le dashboard utilise une interface sombre pensée pour les écrans d’administration, avec navigation clavier visible, adaptation mobile et messages d’erreur en cas d’échec de chargement des données.

## Mise en route (une fois)

1. Exécuter `supabase-admin.sql` dans Supabase Dashboard > SQL Editor
   (crée `admin_users`, ajoute la colonne `email` sur `profiles`
   + rattrape les emails existants, ouvre la lecture admin via RLS)
2. Dans le SQL Editor Supabase, ajoute uniquement ton compte à `admin_users`.
   Pour être le seul administrateur, exécute ces commandes après avoir remplacé
   `TON_ADRESSE_ADMIN` par ton adresse uniquement dans le SQL Editor :

   ```sql
   delete from public.admin_users;
   insert into public.admin_users(email)
   values ('TON_ADRESSE_ADMIN')
   on conflict (email) do nothing;
   ```

3. Créer un projet Vercel séparé nommé `akoue-admin`, avec `admin-web/` comme
   racine du projet. Ne protège pas le projet Vercel `akoue-app` : il sert aussi
   l'application et son API.
4. Dans les réglages du projet `akoue-admin`, activer **Vercel Authentication**
   avec **All Deployments** et s'assurer que ton compte est le seul membre autorisé.
   Déployer depuis la racine du dépôt avec `vercel deploy admin-web --prod --project akoue-admin`.
5. Ouvrir https://akoue-admin.vercel.app et se connecter avec le compte autorisé dans Supabase.

## Sécurité

- Aucune clé secrète : seule la clé publique `anon` est dans `config.js` (normal).
- Pas de `service_role` nulle part — l'accès admin passe par le RLS
  (`admin_users` + `auth.jwt() ->> 'email'`). La table `admin_users` ne révèle
  à chaque utilisateur que sa propre ligne.
- L'app mobile garde ses policies `uid = auth.uid()` : chaque user ne voit que ses données.
- Le dépôt GitHub reste public : Vercel Authentication protège le dashboard déployé,
  mais ne masque pas les fichiers sources `admin-web/`.
- Le projet Vercel `akoue-admin` est protégé sur toutes ses URL, y compris les URL de
  production. N'active pas cette protection sur `akoue-app`, qui héberge aussi l'application.
- Les pages du dashboard et ses API vérifient également la session Supabase et les règles RLS.

## Annoncer une mise à jour par e-mail

Sur `notifications.html`, publier une annonce de type `update`, puis cocher l'envoi de l'e-mail de service. Le lien APK Expo est facultatif pour une préannonce ; lorsqu'il est renseigné, un bouton de téléchargement est inclus. L'envoi requiert que `admin-web/supabase-admin.sql` puis `supabase/broadcast-email-deliveries.sql` aient été exécutés dans l'éditeur SQL Supabase et que l'admin dispose d'une session valide.

Dans Vercel, configurer ces variables d'environnement pour l'API `/api/admin/send-update-email` :

- `SMTP_USER` : adresse d'expédition configurée dans Vercel (ne pas la mettre dans le dépôt)
- `SMTP_APP_PASSWORD` : mot de passe d'application Gmail (secret, jamais dans le dépôt ni dans le client)
- `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` : déjà nécessaires à l'app

L'API vérifie l'administrateur côté serveur, récupère les adresses autorisées par RLS, masque les destinataires en BCC et consigne l'envoi par annonce pour empêcher les doublons. Elle n'utilise pas de clé `service_role`. En cas d'envoi partiel, elle ne relance pas automatiquement les mêmes messages. L'envoi est limité à 450 adresses par annonce.

## Publication OTA Android

Les modifications JavaScript compatibles sont téléchargées en arrière-plan par l'application et prises en compte à son prochain démarrage. Pour publier une OTA de test locale, utiliser `pnpm update:android:preview`; pour la production, `pnpm update:android:production`.

Le workflow GitHub **Publish Android OTA update** permet aussi de choisir `preview` ou `production` et de publier depuis Actions. Ajouter une fois un secret de dépôt `EXPO_TOKEN` créé dans le compte Expo (GitHub → Settings → Secrets and variables → Actions). Les changements natifs (permissions, modules ou configuration native) exigent toujours un nouvel APK et ne doivent pas être publiés en OTA.
