# Audit Log

- 2026-09-18: Création mémoire HAM (CLAUDE.md + .memory/*) — activation demandée par l'utilisateur
- 2026-09-18: Nom officiel Akouè App (package `akoue-app`)
- 2026-10-16: Session OTP/auth (flux lien magique 100% Supabase, delete RPC, welcome sonore, fixes logs) — push `b66159e`, conversation-2026-10-16.md
- 2026-10-20: Push session 19/10 (`107bb1a`, 70 fichiers) + ErrorBoundary intégré (`9b30847`) + build & déploiement Vercel production en ligne (`akoue-app.vercel.app`), projet `t0b0i7s-projects/akoue-app` lié à GitHub, regex `routes` + `check:true` + catch-all fallback SPA (cleanUrls=ignore config manuelle, rewrites simples ne marchent pas avec outputDirectory), vars EXPO_PUBLIC_* dans Vercel + .vercelignore (.env exclu), smoke tests verts
- 2026-10-19: Session perf + auth + design (maxWorkers 2→4, délai index 700→120ms, getUser→getSession, orbes animées `components/animated-orbs.tsx`, imports Phosphor nominaux 8.89→3.69 Mo, Google login web redirect, musique fond `money-theme.wav`, pagination transactions, suppression polling 15s, ErrorBoundary, vercel.json + _redirects) — voir conversation-2026-10-19.md
