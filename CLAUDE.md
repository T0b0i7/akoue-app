# Akouè App — Mémoire Agent

> Expo 54 + React Native 0.81 + Expo Router + Supabase + Firebase. App finance perso (wallets, transactions, stats). Anciennement nommé Finote App.

## Stack
- Expo Router (tabs: index, wallet, statistics, more) + modals (wallet-modal, transaction-modal, etc.)
- Supabase (auth, DB) + Firebase + AsyncStorage
- TypeScript strict, ESLint expo, Playwright pour e2e

## Context Routing
→ app: app/CLAUDE.md
→ components: components/CLAUDE.md
→ services: services/CLAUDE.md
→ context: context/CLAUDE.md
→ supabase: supabase/CLAUDE.md

## Règles
- Langue: français par défaut avec l'utilisateur
- Ne jamais afficher de bloc résumé/plan avant action — aller direct au code
- Vérifier `Test-Path` avant création de dossiers/fichiers
- Préférer `Read/Edit/Write` aux commandes shell pour les fichiers

## Mémoire
- Décisions: `.memory/decisions.md`
- Patterns: `.memory/patterns.md`
- Brouillon/inférences à confirmer: `.memory/inbox.md`
- Historique: `.memory/audit-log.md`

## Session actuelle
- 2026-09-18: Activation mémoire demandée par l'utilisateur (conversations non persistées avant)
- Utilisateur: Eucher O. ABATTI
