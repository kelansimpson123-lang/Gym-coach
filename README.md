# Gym Coach

A personal bodybuilding coaching Progressive Web App — monthly training
planning, on-demand workout generation, and simple progression tracking.
Runs entirely client-side (React + IndexedDB), free to host on GitHub
Pages, installable to a phone home screen.

This repo currently contains **Phase 1 — Project Foundation** only:
project scaffolding, routing, bottom navigation, dark theme, PWA
configuration, and the IndexedDB schema. No training data, exercise
library, or Coach logic yet — those arrive in later phases.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
- IndexedDB via [`idb`](https://github.com/jakearchibald/idb)
- `vite-plugin-pwa` for the installable app shell

Everything here is free and open-source — no paid services, no API
keys, no accounts.

## Running locally

Requires [Node.js](https://nodejs.org/) 20 or later.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

To test the installed/offline PWA behaviour locally:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/   Shared UI (BottomNav, PageContainer, ...)
  pages/        One file per screen (Home, Calendar, Exercises, EditApp)
  database/     IndexedDB schema + connection (schema.ts, db.ts)
  models/       TypeScript types for every stored data model
  services/     Reserved for Phase 2 (data read/write functions)
  coach/        Reserved for Phase 8 (planning + selection logic)
  utils/        Shared helpers
  hooks/        Shared React hooks
```

## Deploying to GitHub Pages (free)

1. Push this repo to GitHub. **If your repository name is not
   `gym-coach-app`**, update `REPO_NAME` in `vite.config.ts` first -- it's
   used to build the correct base path and PWA scope for GitHub Pages.
2. In the repo's GitHub settings, go to **Pages** -> set **Source** to
   **GitHub Actions**.
3. Push to `main`. The included workflow
   (`.github/workflows/deploy.yml`) builds the app and deploys it
   automatically -- no manual steps, no cost.
4. Your app will be live at `https://<your-username>.github.io/<repo-name>/`.
5. On your phone, open that URL in Safari (iOS) or Chrome (Android) and
   use "Add to Home Screen" -- it will install and run like a native app.

## Notes for future phases

- The IndexedDB schema (`src/database/schema.ts`) already defines all
  planned object stores and indexes, so later phases only add
  read/write functions in `src/services/` -- the database version should
  rarely need to change.
- Bump `DB_VERSION` in `schema.ts` and extend the `upgrade()` callback in
  `db.ts` if a genuinely new store or index is ever needed.
