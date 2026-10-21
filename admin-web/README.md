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
3. Se connecter avec `[redacted-email]` + ton mot de passe Akouè

## Sécurité

- Aucune clé secrète : seule la clé publique `anon` est dans `config.js` (normal).
- Pas de `service_role` nulle part — l'accès admin passe par le RLS
  (`admin_users` + `auth.jwt() ->> 'email'`).
- L'app mobile garde ses policies `uid = auth.uid()` : chaque user ne voit que ses données.

## Annoncer une mise à jour par e-mail

Sur `notifications.html`, publier une annonce de type `update`, puis cocher l'envoi de l'e-mail de service. Le lien APK Expo est facultatif pour une préannonce ; lorsqu'il est renseigné, un bouton de téléchargement est inclus. L'envoi requiert que `admin-web/supabase-admin.sql` puis `supabase/broadcast-email-deliveries.sql` aient été exécutés dans l'éditeur SQL Supabase et que l'admin dispose d'une session valide.

Dans Vercel, configurer ces variables d'environnement pour l'API `/api/admin/send-update-email` :

- `SMTP_USER` : `[redacted-email]`
- `SMTP_APP_PASSWORD` : mot de passe d'application Gmail (secret, jamais dans le dépôt ni dans le client)
- `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` : déjà nécessaires à l'app

L'API vérifie l'administrateur côté serveur, récupère les adresses autorisées par RLS, masque les destinataires en BCC et consigne l'envoi par annonce pour empêcher les doublons. Elle n'utilise pas de clé `service_role`. En cas d'envoi partiel, elle ne relance pas automatiquement les mêmes messages. L'envoi est limité à 450 adresses par annonce pour rester dans la capacité d'un compte Gmail courant.

## Publication OTA Android

Les modifications JavaScript compatibles sont téléchargées en arrière-plan par l'application et prises en compte à son prochain démarrage. Pour publier une OTA de test locale, utiliser `pnpm update:android:preview`; pour la production, `pnpm update:android:production`.

Le workflow GitHub **Publish Android OTA update** permet aussi de choisir `preview` ou `production` et de publier depuis Actions. Ajouter une fois un secret de dépôt `EXPO_TOKEN` créé dans le compte Expo (GitHub → Settings → Secrets and variables → Actions). Les changements natifs (permissions, modules ou configuration native) exigent toujours un nouvel APK et ne doivent pas être publiés en OTA.
