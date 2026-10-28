# Putting Practice

A phone-first web app (PWA) for planning putting and chipping practice, logging drill scores and tracking high scores, streaks and progress. Add it to the iPhone home screen and it runs full-screen and offline.

## Features

- **Drill library**: 2 unscored warm-up stations and 15 scored games from `docs/warmup-and-games.md`, with full instructions, diagrams and targets for three levels (Beginner/mid, Low single digit, Tour). Points for band-scored games (e.g. Lag Darts: holed 5, inside 0.5 m 3 …) are computed from how many balls landed in each band.
- **Hard mode and green speed**: each result can be flagged Hard mode (listed in history, kept out of high scores and pass streaks) and tagged Slow/Medium/Fast green.
- **Target caller**: Distance Call has a button that calls a random target per ball.
- **Plan by time**: pick how many minutes you have; the app starts with the warm-up (both stations from 30 min, one below) and fills the rest with games, favouring drills you haven't done lately or haven't passed yet. Swap, remove or add drills before starting.
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

- `docs/warmup-and-games.md`: drill text (`### W1 · Name (7 min)` / `### G1 · Name` sections under `## Warm-up …` / `## Games — Category` headings)
- `scripts/games-meta.mjs`: scoring per drill (scores, point bands, targets, minutes, rounds, warm-up flag)

After editing either file, bump `LIBRARY_VERSION` in `scripts/import-library.mjs` and run `npm run import-library`. Installed apps then add new built-in drills and drop removed ones (unless results were logged on them).

The earlier 25-drill library and its scoring setup are kept in `docs/archive/` and `scripts/archive/` for later.

### Project layout

- `src/types.ts`: data model (drills, metrics, results, sessions)
- `src/store.ts`: state + localStorage persistence
- `src/scoring.ts`: round aggregation, pass/fail, high scores, streaks
- `src/planner.ts`: time-based session planner
- `src/ui/`: screens
