# Session 2026-09-25 — Updates OTA, devise, erreurs RLS, notifs Android

## Résumé des modifications

### 1. Notifications OTA intelligentes (`hooks/use-ota-update.ts`)
- **Cooldown 30 jours** pour utilisateurs existants (pas de spam à chaque lancement)
- **Nouveaux utilisateurs** (pas de session) : voient toujours la notification
- **Badge icône app** : `badge: updateAvailable ? 1 : 0`
- **4 messages** selon type : nouveau/existant × majeure/mineure
- **Canal Android** `updates` (AndroidImportance.HIGH) — obligatoire depuis Android 8
- Son + vibration activés, visible en lockscreen
- `isMajorUpdate()` détecte changement de numéro de version majeur

### 2. Devise solde total (`app/(tabs)/wallet.tsx`, `statistics.tsx`)
- **Bug fix** : `$ {getTotalBalance()?.toFixed(2)}` hardcodé → `formatCurrency(total, "fr-FR", displayCurrency, 2)`
- Graphique stats : `yAxisLabelPrefix="$"` → symbole de la devise choisie
- Charge `display_currency` depuis AsyncStorage (même logique que home-card)

### 3. Erreurs traduites en français (`services/wallet-service.ts`, `transaction-service.ts`)
- **`humanizeError()`** exporté : traduit toutes les erreurs Supabase en messages clairs
  - RLS → "Session expirée. Reconnectez-vous."
  - numeric overflow → "Le montant est trop grand ou invalide."
  - not null → "Un champ obligatoire est vide."
  - duplicate → "Cet élément existe déjà."
  - network → "Problème de connexion internet."

### 4. Session Supabase valide avant écriture
- **`ensureValidSession()`** : getSession → refreshSession → getUser
- Sans session valide, RLS bloque tout INSERT/UPDATE
- Retry automatique avec session rafraîchie si RLS bloque
- Fallback local uniquement pour vrais problèmes réseau

### 5. Validation montants (`wallet-modal.tsx`, `transaction-modal.tsx`)
- **`cleanAmount()`** : arrondit à 2 décimales (évite `100.00000000000001`)
- **`validateAmount()`** : vérifie négatif, trop grand (> 1 milliard), invalide
- Validation **AVANT** envoi en base

## Décisions techniques
- **eas update** (OTA) = code JS uniquement, ancienne app récupère automatiquement
- **eas build** (APK) = binaire complet, nécessite réinstallation manuelle
- Canal de notification Android obligatoire depuis API 26, sinon notif ignorée silencieusement
- Les erreurs RLS viennent d'un `auth.uid()` NULL = pas de session Supabase active

## Tests
- `tests/ota-update.spec.ts` : 9 tests Playwright (cooldown, badge, messages, TypeScript)
- TypeScript `tsc --noEmit` : 0 erreur
- ESLint : 0 erreur, 2 warnings React (exhaustive-deps, pré-existants)

## Push GitHub
- Repo : `https://github.com/T0b0i7/akoue-app`
- Upstream open-source : `https://github.com/AayushBharti/finote-app`
- Commits session : `567d718`, `007d695`, `1798b43`, `847efec`, `31b0695`

## OTA Updates publiés
- `bb87ce23` : notifs OTA + devise + canal Android
- `74a22531` : erreurs RLS en français + wallet hors-ligne
- `848e88f1` : session Supabase valide + retry RLS
- `99083f55` : montants arrondis + erreurs claires

## APK builds
- `792fa922` : version initiale (erreurs de devise)
- `4c372ade` : + canal Android notifications
- URL : https://expo.dev/artifacts/eas/QwPa5CqoI1KxcQtdpVjJANmR4uksfxjTryl5nqa1JQ4.apk

## Bugs pré-existants (pas liés aux changements)
- Tests auth `welcome page` et `navigation` : textes UI changés sans mise à jour des tests
