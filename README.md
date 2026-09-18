<a name="readme-top"></a>

![Akouè - Maîtrise ton argent. Note. Contrôle.](/.github/images/img_main.png "Akouè - Maîtrise ton argent. Note. Contrôle.")

<p align="center">
  <h3 align="center">Akouè App</h3>
  <p align="center">
    Maîtrise ton argent. Note. Contrôle.
    <br />
    App open source de gestion financière personnelle — fork de Finote par Aayush Bharti
    <br />
    <br />
    <a href="https://github.com/T0b0i7/akoue-app"><strong>Code »</strong></a>
    &middot;
    <a href="https://github.com/T0b0i7/akoue-app/issues">Issues</a>
    &middot;
    <a href="https://github.com/T0b0i7/akoue-app/issues/new?labels=enhancement&template=FEATURE_REQUEST_TEMPLATE.md">Demander une fonctionnalité</a>
  </p>
</p>

<p align="center">
  <a href="https://github.com/T0b0i7/akoue-app/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/T0b0i7/akoue-app?color=dddddd&labelColor=000000&label=License" alt="License MIT">
  </a>
  <a href="https://github.com/T0b0i7/akoue-app/stargazers">
    <img src="https://img.shields.io/github/stars/T0b0i7/akoue-app?style=flat&logo=github" alt="GitHub Stars">
  </a>
  <a href="https://github.com/T0b0i7/akoue-app/forks">
    <img src="https://img.shields.io/github/forks/T0b0i7/akoue-app?style=flat" alt="GitHub Forks">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/github/languages/top/T0b0i7/akoue-app?&logoColor=%23007ACC&label=TypeScript" alt="Top Language">
  </a>
  <a href="https://github.com/T0b0i7/akoue-app/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/T0b0i7/akoue-app?style=flat&color=orange&label=Contributors" alt="Contributors">
  </a>
  <a href="https://github.com/T0b0i7/akoue-app/commits/main">
    <img src="https://img.shields.io/github/commit-activity/t/T0b0i7/akoue-app?style=flat&logo=github" alt="Commits">
  </a>
  <a href="https://github.com/T0b0i7/akoue-app/pulls">
    <img src="https://img.shields.io/github/issues-pr/T0b0i7/akoue-app?color=brightgreen&label=PRs" alt="Pull Requests">
  </a>
</p>

<details>
<summary>Table des matières</summary>

- [À propos](#about-the-project)
- [Captures](#-screenshots)
- [Fonctionnalités](#-key-features)
- [Technologies](#-technologies-used)
- [Démarrage](#-setup)
- [Contribuer](#-contributing)
- [Licence](#-licence)
- [Remerciements](#-acknowledgements)

</details>

## About the Project

**Akouè** — Reprends le contrôle de tes finances. Fork open source de **Finote** (par [Aayush Bharti](https://github.com/aayushbharti/finote-app)), rebaptisé **Akouè App** et maintenu par [T0b0i7](https://github.com/T0b0i7).

Gère plusieurs portefeuilles (Salaire, Freelance, Espèces), suis tes revenus/dépenses au quotidien et visualise tes habitudes avec des statistiques animées en temps réel. Stack moderne : **Expo 54 + React Native 0.81 + Supabase + Firebase**.

> **Open source** sous licence **MIT** — contributions bienvenues !

## 📷 Screenshots

![Modern UI/UX Hero](/.github/images/img1.jpeg "Modern UI/UX Hero")

![Animated Bento grid](/.github/images/img2.jpeg "Animated Bento grid")

## 🔥 Key Features

- **💰 Multi-Wallet Management**
  Crée et gère plusieurs portefeuilles pour organiser tes finances.

- **📊 Visual Analytics**
  Graphiques hebdo/mensuels/annuels pour visualiser revenus vs dépenses.

- **📝 Smart Transaction Tracking**
  Ajoute revenus/dépenses avec catégories, dates et notes.

- **🧾 Receipt Uploads**
  Attache tes reçus (Cloudinary) — ne perds plus une facture.

- **🔍 Advanced Search**
  Recherche par mot-clé, catégorie ou type de transaction.

- **🔐 Secure Authentication**
  Auth Supabase + Firebase.

- **🎨 Smooth UI/UX**
  Tab bar custom, animations Reanimated, design responsive.

## ✨ Technologies Used

<details><summary><b>Akouè App</b> est construit avec :</summary>

- [TypeScript](https://www.typescriptlang.org/)
- [React Native](https://reactnative.dev/) 0.81
- [Expo](https://expo.dev/) 54 + [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase](https://supabase.com/) + [Firebase](https://firebase.google.com/)
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Zod](https://zod.dev/)
- [Gifted Charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts) + [Flash List](https://shopify.github.io/flash-list/)
- [Phosphor Icons](https://phosphoricons.com/)

</details><br/>

[![Technologies Used](https://go-skill-icons.vercel.app/api/icons?i=ts,expo,reactnative,firebase,supabase,android,)](https://github.com/T0b0i7/akoue-app)

## 🧰 Setup

 1. Prérequis : [Git](https://git-scm.com/downloads), [Node.js](https://nodejs.org/en/) (>=18) et [pnpm](https://pnpm.io/installation) (`npm i -g pnpm`).
 2. Clone ton fork :

    ```bash
    git clone https://github.com/T0b0i7/akoue-app.git
    cd akoue-app
    ```
 3. Installe les dépendances (SSD recommandé) :

    ```bash
    pnpm install
    # Si erreur "Ignored build scripts" avec pnpm 11+ :
    pnpm config set dangerously-allow-all-builds true
    pnpm install
    ```
 4. Variables d'environnement — copie `.env.example` vers `.env` et remplis tes clés Supabase/Firebase :

    ```bash
    cp .env.example .env
    ```
 5. Lance le dev server :

    ```bash
    pnpm start          # Expo DevTools + QR code
    pnpm android        # ou pnpm ios / pnpm web
    ```

 > **Note Windows HDD :** Mets le projet + le store pnpm (`C:\pnpm-store`) sur SSD. Sur HDD, `pnpm install` prend 20-30min. Config : `pnpm config set store-dir C:\pnpm-store`.

## 🔧 Contributing

[![contributors](https://contrib.rocks/image?repo=T0b0i7/akoue-app)](https://github.com/T0b0i7/akoue-app/graphs/contributors)

Les contributions font vivre l'open source. Toute aide est **grandement appréciée** !

1. Fork le repo
2. Crée ta branche (`git checkout -b feat/ma-feature`)
3. Commit (`git commit -m 'feat: ajoute ma feature'`)
4. Push (`git push origin feat/ma-feature`)
5. Ouvre une Pull Request 🎉

Merci de lire `CONTRIBUTING.md` si présent et de respecter le code de conduite.

## 📄 Licence

Distribué sous licence **MIT**. Voir [`LICENSE`](./LICENSE) pour plus d'infos.

Copyright (c) 2026 Akouè App — Basé sur [Finote par Aayush Bharti](https://github.com/aayushbharti/finote-app).

## 💎 Acknowledgements

- [Aayush Bharti — projet Finote original](https://github.com/aayushbharti/finote-app)
- [Expo](https://expo.dev/) • [React Native](https://reactnative.dev/) • [Supabase](https://supabase.com/) • [Firebase](https://firebase.google.com/)
- [Expo Router](https://docs.expo.dev/router/introduction/) • [Reanimated](https://docs.swmansion.com/react-native-reanimated/) • [Gifted Charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts) • [Phosphor Icons](https://phosphoricons.com/) • [Flash List](https://shopify.github.io/flash-list/) • [Zod](https://zod.dev/)

## ⭐ Give A Star

Si Akouè t'aide, laisse une ⭐ — ça aide le projet à être découvert !

## 🌟 Star History

<a href="https://star-history.com/#T0b0i7/akoue-app&Timeline">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=T0b0i7/akoue-app&type=Timeline&theme=dark" />
  <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=T0b0i7/akoue-app&type=Timeline" />
  <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=T0b0i7/akoue-app&type=Timeline" />
</picture>
</a>

<br />
<p align="right">(<a href="#readme-top">back to top</a>)</p>
