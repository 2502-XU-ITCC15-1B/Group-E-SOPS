# Strucsure — Web-Based Organizational Profiling System (SOPS)

The Organization Profiling System is a web-based application built with Firebase to manage member information and organizational duties for a small organization. It uses Firebase Authentication, Firestore, role-based access (Admin, Executive, Member), and Firebase Hosting.

## Repository layout (four parts)

This repo is split into four areas so the group can own and review them separately:

| Part | Directory | What it contains |
|------|-----------|------------------|
| **1 — Frontend** | [`frontend/`](frontend/) | React app (`react-scripts`), UI, Tailwind, public assets, Docker image for local dev |
| **2 — Cloud Functions** | [`functions/`](functions/) | Firebase Cloud Functions (Node 18) |
| **3 — Firebase rules & indexes** | [`firebase-rules/`](firebase-rules/) | Firestore rules, Firestore indexes, Storage rules |
| **4 — Docs & scripts** | [`docs/`](docs/) | Workflow documentation, one-off scripts (admin setup, import analysis) |

Root files tie the project together: [`firebase.json`](firebase.json), [`docker-compose.yml`](docker-compose.yml), and this README. Run **`firebase`** CLI commands from the repository root so paths resolve correctly.

## Group repository (ITCC15)

**Official group remote:** [https://github.com/2502-XU-ITCC15-1B/Group-E-SOPS](https://github.com/2502-XU-ITCC15-1B/Group-E-SOPS)

From your machine (after [GitHub authentication](https://docs.github.com/en/get-started/git-basics/set-up-git)):

```bash
git remote add group-e https://github.com/2502-XU-ITCC15-1B/Group-E-SOPS.git
# skip "add" if remote already exists
git push -u group-e main
```

Use feature branches and `develop` per your course milestone; `main` should stay the stable integration target your instructor expects.

## Quick start

From the repo root:

```bash
npm run install:all
npm start
```

Build and deploy (requires Firebase CLI and project login):

```bash
npm run deploy
```

Docker (frontend + emulators): see [`docker-compose.yml`](docker-compose.yml).
