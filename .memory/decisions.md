# Décisions

## 2026-09-18 — Activation mémoire hiérarchique
- Contexte: l'utilisateur voulait retrouver ses conversations précédentes, mais aucune persistence n'existait.
- Décision: mise en place HAM (Hierarchical Agent Memory) avec CLAUDE.md racine + .memory/
- Conséquence: toutes les prochaines sessions chargeront ce contexte automatiquement.

## 2026-09-18 — Renommage Finote → Akouè
- Contexte: l'app s'appelle désormais Akouè App, plus Finote App
- Décision: CLAUDE.md et mémoire mis à jour, dossier `finote-app` conservé tel quel (évite breaking paths)
- Conséquence: références futures utilisent Akouè App

<!-- Ajouter les ADR suivantes au format: Date | Contexte | Décision | Conséquence -->
