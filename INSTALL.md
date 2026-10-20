# 📱 Akouè — Guide d'installation mobile

Akouè est disponible sur **Android (APK native)** et sur **iOS / Android (PWA web)**.
Le code source est sur GitHub : https://github.com/T0b0i7/akoue-app

---

## 1. Android — Installation de l'APK (recommandé)

L'APK est l'application native complète (notifications, verrouillage FaceID, musique de fond, OTA silencieuse).

### Étape 1 — Télécharger l'APK
Récupérez le dernier fichier `.apk` depuis l'un de ces liens :

| Lien | Description |
|------|-------------|
| **Dernier build** | https://expo.dev/artifacts/eas/Tw1U6Jk3ph6v2RmNEeavQDxJOuom7XS1PL0yEmnka-w.apk |
| **Page de build (QR code)** | https://expo.dev/accounts/tobias07/projects/akoue-app/builds/607e6284-9fe8-4892-914d-47c016b03fe4 |

### Étape 2 — Autoriser l'installation de sources inconnues
1. Ouvrez **Paramètres** > **Sécurité** (ou **Applications** > **Accès spécial aux applications**).
2. Activez **Installer des applis inconnues** pour votre navigateur (Chrome, Firefox, etc.) ou pour le gestionnaire de fichiers.

### Étape 3 — Installer
1. Ouvrez le fichier `.apk` téléchargé.
2. Cliquez sur **Installer**.
3. Lancez **Akouè** depuis votre écran d'accueil.

> ⚠️ Si une version précédente est déjà installée : **désinstallez-la d'abord**, puis réinstallez le nouvel APK (même package `com.akoue.app`, mais signature différente possible).

---

## 2. iOS — Installation via PWA (Ajouter à l'écran d'accueil)

Il n'existe pas encore de build natif iOS sur l'App Store. La méthode officielle pour utiliser Akouè sur iPhone est la **PWA (Progressive Web App)** : l'application s'installe depuis Safari comme une appli native, avec icône sur l'écran d'accueil et affichage plein écran.

### Étape 1 — Ouvrir Akouè dans Safari
1. Sur votre iPhone, ouvrez **Safari** (pas Chrome, pas Firefox).
2. Allez sur : **https://akoue-app.vercel.app**

### Étape 2 — Ajouter à l'écran d'accueil
1. Une fois le site chargé, appuyez sur le bouton **Partager** (carré avec flèche vers le haut, en bas de l'écran).
2. Faites défiler vers le bas et touchez **« Sur l'écran d'accueil »**.
3. Confirmez le nom **Akouè** et appuyez sur **Ajouter**.

### Étape 3 — Lancer l'application
Une icône **Akouè** apparaît sur votre écran d'accueil. Elle ouvre l'application en mode plein écran (sans barre d'adresse Safari), comme une appli native.

> 💡 La PWA fonctionne **hors ligne** pour l'interface principale (service worker mis en cache). Seules les données bancaires (Supabase) nécessitent une connexion.

---

## 3. Android — Installation via PWA (alternative à l'APK)

Si vous ne souhaitez pas installer l'APK, vous pouvez ajouter Akouè à votre écran d'accueil depuis Chrome :

1. Ouvrez **Chrome** sur Android.
2. Allez sur **https://akoue-app.vercel.app**.
3. Appuyez sur le menu **⋮** (trois points, en haut à droite).
4. Sélectionnez **« Ajouter à l'écran d'accueil »**.
5. Confirmez. L'icône Akouè apparaît sur votre écran d'accueil.

Une bulle d'installation peut aussi apparaître automatiquement en bas de l'écran lors de votre première visite.

---

## 4. Fonctionnalités par plateforme

| Fonctionnalité | Android APK | PWA (Android) | PWA (iOS) |
|---|---|---|---|
| Icône écran d'accueil | ✅ | ✅ | ✅ |
| Affichage plein écran | ✅ | ✅ | ✅ |
| Hors-ligne (interface) | ✅ | ✅ | ✅ |
| Notifications système | ✅ | ⚠️ (limitées) | ⚠️ (limitées) |
| Musique de fond | ✅ | ❌ | ❌ |
| Verrouillage FaceID / empreinte | ✅ | ❌ | ❌ |
| Mises à jour automatiques (OTA) | ✅ | ✅ | ✅ |
| Appareil photo / documents | ✅ | ⚠️ (limité) | ⚠️ (limité) |

---

## 5. Mises à jour

- **APK Android** : téléchargez le nouveau `.apk` depuis le lien ci-dessus et installez-le par-dessus (ou désinstallez/réinstallez si nécessaire).
- **PWA (iOS et Android web)** : les mises à jour s'appliquent automatiquement à chaque ouverture, sans action de votre part.

---

## 6. Dépannage

| Problème | Solution |
|----------|----------|
| « Application non installée » (Android) | Désinstallez l'ancienne version, redémarrez le téléphone, réinstallez l'APK. |
| L'option « Ajouter à l'écran d'accueil » n'apparaît pas (iOS) | Utilisez impérativement **Safari**, pas Chrome ou une autre application. |
| Écran blanc au chargement | Patientez quelques secondes ; si cela persiste, videz le cache du navigateur ou réinstallez l'APK. |
| Données ne se chargent pas | Vérifiez votre connexion internet (Supabase est requis pour les soldes et transactions). |

---

## 7. Liens utiles

- Site web / PWA : https://akoue-app.vercel.app
- Code source : https://github.com/T0b0i7/akoue-app
- Dernier APK : https://expo.dev/artifacts/eas/Tw1U6Jk3ph6v2RmNEeavQDxJOuom7XS1PL0yEmnka-w.apk

---

*Akouè — Maîtrise ton argent. 💰*
