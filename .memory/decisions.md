# Décisions

## 2026-09-18 — Activation mémoire hiérarchique
- Contexte: l'utilisateur voulait retrouver ses conversations précédentes, mais aucune persistence n'existait.
- Décision: mise en place HAM (Hierarchical Agent Memory) avec CLAUDE.md racine + .memory/
- Conséquence: toutes les prochaines sessions chargeront ce contexte automatiquement.

## 2026-09-18 — Nom officiel Akouè
- Contexte: nom officiel de l'app fixé une fois pour toutes.
- Décision: CLAUDE.md et mémoire mis à jour, package `akoue-app`
- Conséquence: références futures utilisent Akouè App

<!-- Ajouter les ADR suivantes au format: Date | Contexte | Décision | Conséquence -->
