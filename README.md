# Putting Practice

A phone-first web app (PWA) for planning putting and chipping practice, logging drill scores and tracking high scores, streaks and progress. Add it to the iPhone home screen and it runs full-screen and offline.

## Features

- **Drill library**: the 25 drills from `docs/putting-drill-library.md`, with full instructions, diagrams and targets for three levels (Beginner/mid, Low single digit, Tour).
- **Plan by time**: pick how many minutes you have; the app starts with a warm-up drill and fills the rest, favouring drills you haven't done lately or haven't passed yet. Swap, remove or add drills before starting.
- **Session mode**: one drill at a time with a timer, instructions and score entry; summary at the end with passes and new bests.
- **Scoring types**: makes out of N, best streak, balls/putts needed to finish, score vs par, decimals (cm, %, seconds), yes/no, multiple rounds (total, average, best or worst round).
- **Progress**: high score, pass streak ("two passes in a row → level up"), chart per score, weekly practice streak, history.
- **Your own drills**: create, edit, duplicate or delete drills (putting or chipping) in the app.
- **Backup and sharing**: export/import a backup file; share single drills as files with friends.

Data is stored on the phone only (browser storage). Export a backup now and then.

## Install on iPhone

1. Open the app URL in **Safari**.
2. Tap Share → **Add to Home Screen**.
3. Open it from the home screen icon. (Data saved by the home-screen app is separate from data in a normal Safari tab.)

## Development

```sh
npm install
npm run dev        # local dev server
npm run build      # type-check + production build into dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml` (enable Pages → Source: GitHub Actions in the repo settings).

### Updating the built-in drill library

The built-in drills are generated from Markdown:

- `docs/putting-drill-library.md`: drill text (each drill is a `### Drill N — Name` section under a `## Category k — Name` heading)
- `scripts/drill-meta.mjs`: scoring per drill (scores, targets, minutes, rounds, warm-up flag)

After editing either file, run `npm run import-library` and bump `version` in the generated `src/data/library.json` so existing installs pick up new drills.

### Project layout

- `src/types.ts`: data model (drills, metrics, results, sessions)
- `src/store.ts`: state + localStorage persistence
- `src/scoring.ts`: round aggregation, pass/fail, high scores, streaks
- `src/planner.ts`: time-based session planner
- `src/ui/`: screens
