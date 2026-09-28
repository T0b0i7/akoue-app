# Conversation Akouè App — 2026-09-24

Utilisateur: Eucher O. ABATTI
Agent: Muse Spark

## Résumé
- Lance projet → fix page blanche web (Splash + Asset + SafeArea + routing auth)
- Fix boutons retour → BackButton dismiss générique → double nav → fix exact pathname + anti-spam
- Suppression portefeuille ne marche pas → wallet-service IDOR + cache offline + ConfirmDialog Akouè (remplace window.confirm)
- Notification clic vide → NotificationsModal + liste + long-press delete + OTA handlers
- Audit pentest complet (18 vulns CRITICAL/HIGH) → bcrypt, rate-limit, RLS private bucket, upload validation, Zod, CSP, etc.
- Convertisseur monnaie temps réel (poll 60s + pull-to-refresh)
- Détail devise au tap (1 EUR = X GBP + inverse)
- Settings zone dangereuse (effacer données / supprimer compte) + devise d'affichage
- Total Balance multi-devises converti + détail par devise + cycle pill
- Fix verticalScale SSR → langue visible, nav bottom 0
- Drapeaux FR/US → revert FR/EN d'origine
- Deployments Expo Hosting multiples, APK builds in queue, OTA preview publié (98b4d4b5)
- APK 101MB discuté (AAB/Proguard)

## Fichiers modifiés
- app/_layout, +html, index, language, setting-modal, notifications-modal, exchange-rate-modal, wallet-modal, transaction-modal, profile-modal, etc.
- components/back-button, confirm-dialog, home-card, transaction-list, custom-tabs
- context/auth-context (bcrypt, rate-limit), services/*, hooks/*, supabase/schema.sql, utils/styling

## Déploiements
- Production: https://akoue-app.expo.app (deployments ga3kcmdute, path7ox0h2, ti7lx9epup, eskgk4p9eg, etc.)
- APK preview builds: 4e3d13d2 (in queue), OTA 98b4d4b5 (fix total devise)

## Actions restantes
- Attendre APK queue → lien frais
- Vercel non utilisé (Expo Hosting)
