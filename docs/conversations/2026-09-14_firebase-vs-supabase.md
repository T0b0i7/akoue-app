# Conversation — Firebase vs Supabase pour Finote

**Date :** 14 septembre 2026
**Projet :** finote-app (Expo 54 + React Native + Firebase)
**Participants :** Eucher O. ABATTI / Muse Spark

---

### 1. Question initiale

**Utilisateur :**
> a defaut d'utiliser firebase ont peut utiliser superbase ?

**Assistant :**
Oui, et pour Finote c'est même plus adapté que Firebase.

Supabase (correction : pas Superbase) remplace Firebase 1:1 :

| Firebase | Supabase | Note |
|---|---|---|
| Auth | `supabase.auth` | Email/Google/Apple identique, persistence AsyncStorage |
| Firestore (NoSQL) | Postgres + Realtime | Avantage pour Finote : requêtes SQL, jointures, agrégations `SUM()` |
| Storage | Storage | S3 compatible |
| Cloud Functions | Edge Functions (Deno) | |

Pour le projet actuel (Expo 54 + React Native) :
- Compatibilité 100% Expo, pas de config native compliquée
- `config/firebase.ts` devient `config/supabase.ts` en 15 lignes :

```ts
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true } }
)
```

```bash
pnpm add @supabase/supabase-js react-native-url-polyfill
pnpm remove firebase
```

**Quand choisir :**
- Supabase si app finance/compta (comme Finote) = données relationnelles, besoin SQL, RLS
- Firebase si besoin offline-first très poussé ou écosystème Google

---

### 2. Demande de recommandation

**Utilisateur :**
> ou tu me propose quoi ?

**Assistant :**
Proposition classée pour Finote :

**1. Supabase (recommandé) — remplace Firebase + Cloudinary d'un coup**
- `transaction-service.ts` fait `getDocs()` + agrégation côté client pour stats. Lent et coûteux. Postgres fait `SELECT sum(amount) GROUP BY month` en 10ms.
- Modèle `wallets` + `transactions` lié par `walletId` et `uid` = relationnel pur. Firestore se bat contre l'outil.
- Supabase Storage remplace Cloudinary pour les reçus `image`.
- 100% compatible Expo.

Structure proposée :
```sql
profiles(id uuid FK auth.users)
wallets(id uuid, uid uuid, name, amount, totalIncome, totalExpenses)
transactions(id uuid, walletId FK wallets, uid, type, amount, category, date)
-- RLS: where uid = auth.uid()
```

Coût : Free tier 500MB DB + 1GB Storage + 50k MAU vs Firebase pay-as-you-go.
Effort migration : ~1 jour.

**2. Rester sur Firebase (si ship cette semaine)**
Garder le code, fixer les 3 points faibles : writeBatch sans limite, stats qui fetch tout, règles Firestore.

**3. Option offline-first**
`expo-sqlite` + `drizzle-orm` en local, sync vers Supabase quand online. Top pour wallet, mais 3-4 jours.

Verdict : Passer sur Supabase. Simplifie 2 services en 1 et débloque le SQL.

---

### 3. Demande d'enregistrement

**Utilisateur :**
> enregistre la conervsation dans un ficier qui sera dan sun dossier

**Action :** Conversation enregistrée dans `docs/conversations/2026-09-14_firebase-vs-supabase.md`
