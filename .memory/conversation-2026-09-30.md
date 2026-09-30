# Conversation Akouè App — 2026-09-30

Utilisateur: Eucher O. ABATTI
Agent: Muse Spark

## Résumé
- Fix crash web `Invalid hook call` (custom-tabs: `useSafeAreaInsets` supprimé → bottom fixe, `tabBar={(props) => ...}`) → push `c374454` + APK `a3861df0`
- Fix EMFILE Metro Windows: kill node, purge `Temp/metro-cache` + `.expo`, nouveau `metro.config.js` (`maxWorkers = 2`)
- Face Unlock demandé (python à l'ouverture, façon mot de passe visage) : expliqué que Python impossible dans l'APK → biométrie native (`expo-local-authentication` + `expo-camera`), prototype python `scripts/face-detector-prototype.py` (OpenCV) pour desktop
- Verrou au choix : biometric / PIN / password / schéma → `services/app-lock-service.ts` (hash bcrypt, sync `profiles.lock_method/lock_hash`), `hooks/use-app-lock.ts`, `components/app-lock-gate.tsx` (PIN pad + pattern 3x3), choix **obligatoire** au 1er lancement, reset dans Paramètres › Verrouillage
- Migration SQL : `profiles.lock_method/lock_hash/lock_updated_at` + `broadcasts.kind/action_url/action_label` (dans `supabase/schema.sql`, à exécuter si pas fait — colonnes broadcasts déjà présentes en base)
- Système MAJ refondu : `components/update-modal.tsx` (bouton Mettre à jour + écran chargement + % réel), notif système 1 seule fois + bouton, snooze 24h, toutes annonces marquées vues au téléchargement
- OTA simplifié : `hooks/use-ota-update.ts` réécrit (~100 lignes, notifie toujours, sans cooldown) + tests MAJ
- Téléchargement direct dans l'app : `services/app-update-service.ts` (expo-file-system/legacy + expo-intent-launcher + `REQUEST_INSTALL_PACKAGES`)
- Verrou : grâce 60s (fini l'impression de déconnexion), déconnexion n'efface plus notifs vues/verrou (`auth-context`, `setting-modal`)
- Broadcasts auto : `.github/workflows/broadcast.yml` (push → insert Supabase), secrets `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` posés via `gh`
- Poids APK : minify R8 + shrink (`expo-build-properties`), suppression `@react-native-community/blur`, prod en AAB
- Clé service_role communiquée par l'utilisateur dans le chat — à supprimer de l'historique si possible

## Commits session
- `787ae09` verrou au choix + fix EMFILE
- `469c9e5` perf APK (minify/shrink, blur, AAB)
- `f3843d0` notif système broadcasts
- `4d22348` CI broadcast auto [no-broadcast]
- `b62d8cb` écran MAJ + snooze
- `dca03a2` + `b56eea9` OTA simple
- `aa49d8f` verrou obligatoire + reset
- `94a1867` fix notifs vues conservées
- `952dc05` MAJ directe in-app + grâce 60s

## Builds APK (preview)
- `a3861df0` (c374454) : https://expo.dev/artifacts/eas/ehrQmhuGTAkJMwe70MDEdJyziYn2JxCJ6-ZySCnVN9M.apk
- `da80d07d` (469c9e5) : https://expo.dev/artifacts/eas/qSITPccSQZskV_te_GiWv_SkdDR2JJksnjJqSuTa1QI.apk
- `d3f35f52` (b56eea9) : https://expo.dev/artifacts/eas/7dysJu7BNjU7tj-TtbV8wnpAoAJw4q79MDPzE5FX0MQ.apk
- `70e0d63a` (aa49d8f) : https://expo.dev/artifacts/eas/0-BFnokF9g1h43v8c_P_BO-GtBJvST4sMMgv8i20ohs.apk
- Build `952dc05` BLOQUÉ : quota gratuit EAS épuisé, reset 1er oct 2026 → relancer ce jour-là

## Broadcasts
- Anciens désactivés (b1213800, c69d36b0 → active=false)
- Actif : `13a650d8` (update → APK 0-BFnok...) + `c69d36b0` remplacé
- Règle : JS seul → `eas update --channel preview` ; natif → nouvel APK (jamais d'OTA sur binaire sans les modules)

## Reste à faire
- 1er oct : relancer `eas build -p android --profile preview` (dire « build »)
- Exécuter migration `profiles.lock_*` si pas fait (SQL Editor)
- Tester verrou obligatoire + MAJ directe sur device avec le nouvel APK
- Penser Play Store à terme (MAJ vraiment automatiques)

## Suite session (web + verrou page + anti brute force)
- Nettoyage warnings web : `app/global.css` tailwind supprimé (inutilisé) ; shadow* laissé (requis iOS natif) ; pipe expo-server = bénin
- Verrou sur vraie page : `app/app-lock-setup.tsx` (hors modales, push + retour), redirect obligatoire, fix boucle infinie (pathname sans groupe + auth exclut setup + garde redirected) + 2 oublis d'import useRef/useEffect
- Zéro tiret : PIN `○○○○`, descs sans dash, supprime gate visage mort ; service visage conservé
- Schéma glissé au doigt (PanResponder + SVG), séquence `2573`, s'efface après essai
- Anti force brute : 5 échecs → pause 30s avec compteur, survit au restart
- Code oublié : reset via mot de passe du compte (online Supabase, fallback bcrypt offline) → page de choix
- MAJ ciblée version (`expo-application`, auto-skip si à jour) + bouton détails vulgarisés ; workflow envoie version+details ; version app 1.1.0
- 7 broadcasts auto coupés (spam) ; auto-broadcast prouvé par capture utilisateur
- Commits : `10a4c2d`, `42602de`, `3f6878a`, `dbfb739`, `562e1af`, `da1a184`, `debc6e7`, `c5e4711`, `eed4be8`, `8164414`
- TOUJOURS en attente : build APK du 1er oct (quota EAS) avec tout le dessus
