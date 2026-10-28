// Scoring setup for each drill in docs/putting-drill-library.md, keyed by drill number.
// The Markdown supplies the text; this file supplies what the app needs to log and judge a result.
//
// Metric fields:
//   id, label        – key and display name
//   kind             – 'count' (whole numbers, stepper), 'number' (decimals), 'boolean' (yes/no)
//   max, unit        – optional upper bound and unit shown next to the value
//   better           – 'higher' | 'lower' | 'none' (informational only, no high score)
//   aggregate        – how rounds combine into the session value: 'sum' | 'avg' | 'best' | 'worst'
//   sumOf            – computed metric: sum of these metric ids (not entered by hand)
//   par              – reference value; the app shows the difference (e.g. +2 vs Tour)
//   targets          – pass thresholds per level: { beginner, low, tour }

export const meta = {
  1: {
    minutes: 5, warmup: true, rounds: 2,
    metrics: [
      { id: 'points', label: 'Setup points', kind: 'count', max: 30, better: 'higher', aggregate: 'worst',
        targets: { beginner: 21, low: 26, tour: 29 } },
    ],
  },
  2: {
    minutes: 10,
    metrics: [
      { id: 'error', label: 'Avg aim error', kind: 'number', unit: 'cm', better: 'lower',
        targets: { beginner: 8, low: 5, tour: 3 } },
      { id: 'bias', label: 'Bias (− left / + right)', kind: 'number', unit: 'cm', better: 'none' },
    ],
  },
  3: {
    minutes: 10,
    metrics: [
      { id: 'toe', label: 'Ball-to-toe range', kind: 'number', unit: 'cm', better: 'lower',
        targets: { beginner: 5, low: 3, tour: 2 } },
      { id: 'angle', label: 'Stance-angle range', kind: 'number', unit: 'cm', better: 'lower',
        targets: { beginner: 3, low: 2, tour: 1 } },
      { id: 'pos', label: 'Ball-position range', kind: 'number', unit: 'cm', better: 'lower',
        targets: { beginner: 5, low: 3, tour: 2 } },
    ],
  },
  4: {
    minutes: 10, warmup: true, rounds: 2,
    metrics: [
      { id: 'gates', label: 'Clean gate passes', kind: 'count', max: 10, better: 'higher', aggregate: 'worst',
        targets: { beginner: 5, low: 8, tour: 9 } },
      { id: 'holed', label: 'Holed', kind: 'count', max: 10, better: 'higher', aggregate: 'sum' },
    ],
  },
  5: {
    minutes: 10,
    metrics: [
      { id: 'lr', label: 'Left-to-right points', kind: 'count', max: 20, better: 'higher' },
      { id: 'rl', label: 'Right-to-left points', kind: 'count', max: 20, better: 'higher' },
      { id: 'total', label: 'Total points', kind: 'count', max: 40, better: 'higher', sumOf: ['lr', 'rl'],
        targets: { beginner: 18, low: 26, tour: 31 } },
    ],
  },
  6: {
    minutes: 15,
    metrics: [
      { id: 'gatesA', label: 'Gates – A (eyes on ball)', kind: 'count', max: 20, better: 'higher' },
      { id: 'gatesB', label: 'Gates – B (eyes on hole)', kind: 'count', max: 20, better: 'higher' },
      { id: 'holedA', label: 'Holed – A', kind: 'count', max: 20, better: 'higher' },
      { id: 'holedB', label: 'Holed – B', kind: 'count', max: 20, better: 'higher' },
      { id: 'gates', label: 'Gates total', kind: 'count', max: 40, better: 'higher', sumOf: ['gatesA', 'gatesB'],
        targets: { beginner: 24, low: 32, tour: 36 } },
      { id: 'holed', label: 'Holed total', kind: 'count', max: 40, better: 'higher', sumOf: ['holedA', 'holedB'],
        targets: { beginner: 16, low: 24, tour: 30 } },
    ],
  },
  7: {
    minutes: 10, warmup: true,
    metrics: [
      { id: 'trail', label: 'Trail hand only', kind: 'count', max: 20, better: 'higher',
        targets: { beginner: 12, low: 16, tour: 19 } },
      { id: 'both', label: 'Both hands', kind: 'count', max: 20, better: 'higher',
        targets: { beginner: 14, low: 18, tour: 20 } },
    ],
  },
  8: {
    minutes: 10, rounds: 2,
    metrics: [
      { id: 'centred', label: 'Strikes within ±5 mm', kind: 'count', max: 10, better: 'higher', aggregate: 'worst',
        targets: { beginner: 5, low: 8, tour: 9 } },
    ],
  },
  9: {
    minutes: 10, warmup: true,
    metrics: [
      { id: 'points', label: 'Points', kind: 'count', max: 9, better: 'higher',
        targets: { beginner: 4, low: 7, tour: 9 } },
    ],
  },
  10: {
    minutes: 15,
    metrics: [
      { id: 'streak', label: 'Best streak', kind: 'count', better: 'higher',
        targets: { beginner: 5, low: 9, tour: 15 } },
      { id: 'zone', label: 'Putts in zone', kind: 'number', unit: '%', max: 100, better: 'higher',
        targets: { beginner: 50, low: 70, tour: 85 } },
    ],
  },
  11: {
    minutes: 10, rounds: 3,
    metrics: [
      { id: 'balls', label: 'Balls placed', kind: 'count', max: 6, better: 'higher', aggregate: 'avg',
        targets: { beginner: 3, low: 5, tour: 6 } },
    ],
  },
  12: {
    minutes: 10,
    metrics: [
      { id: 'calls', label: 'Correct calls', kind: 'count', max: 20, better: 'higher',
        targets: { beginner: 12, low: 15, tour: 17 } },
      { id: 'good', label: 'Balls in good zone', kind: 'count', max: 20, better: 'higher',
        targets: { beginner: 6, low: 10, tour: 14 } },
    ],
  },
  13: {
    minutes: 10,
    metrics: [
      { id: 'points', label: 'Points', kind: 'count', max: 12, better: 'higher',
        targets: { beginner: 6, low: 9, tour: 11 } },
    ],
  },
  14: {
    minutes: 15,
    metrics: [
      { id: 'balls', label: 'Balls to finish all 3 stations', kind: 'count', better: 'lower',
        targets: { beginner: 45, low: 60, tour: 30 } },
    ],
  },
  15: {
    minutes: 25,
    metrics: [
      { id: 'threePutts', label: '3-putts', kind: 'count', max: 18, better: 'lower',
        targets: { beginner: 5, low: 3, tour: 2 } },
      { id: 'putts', label: 'Total putts', kind: 'count', better: 'lower' },
    ],
  },
  16: {
    minutes: 15,
    metrics: [
      { id: 'inside', label: 'Inside 10% window', kind: 'count', max: 18, better: 'higher',
        targets: { beginner: 6, low: 9, tour: 13 } },
      { id: 'short', label: 'Misses short', kind: 'count', max: 18, better: 'none' },
    ],
  },
  17: {
    minutes: 10,
    metrics: [
      { id: 'mae', label: 'Mean abs. error', kind: 'number', unit: '%', better: 'lower',
        targets: { beginner: 1.0, low: 0.6, tour: 0.4 } },
      { id: 'direction', label: 'Direction correct', kind: 'count', max: 16, better: 'higher',
        targets: { beginner: 14, low: 16, tour: 16 } },
    ],
  },
  18: {
    minutes: 15,
    metrics: [
      { id: 'error', label: 'Avg read error', kind: 'number', unit: 'cm', better: 'lower',
        targets: { beginner: 15, low: 8, tour: 5 } },
      { id: 'makes', label: 'First-read makes', kind: 'count', max: 18, better: 'higher',
        targets: { beginner: 4, low: 7, tour: 9 } },
    ],
  },
  19: {
    minutes: 10,
    metrics: [
      { id: 'makes', label: 'Makes', kind: 'count', max: 16, better: 'higher',
        targets: { beginner: 8, low: 11, tour: 13 } },
      { id: 'lowMisses', label: 'Low-side misses', kind: 'count', max: 16, better: 'lower' },
    ],
  },
  20: {
    minutes: 15,
    metrics: [
      { id: 'streak', label: 'Best streak', kind: 'count', max: 100, better: 'higher',
        targets: { beginner: 25, low: 50, tour: 100 } },
    ],
  },
  21: {
    minutes: 15, rounds: 3,
    metrics: [
      { id: 'makes', label: 'Makes (of 10)', kind: 'count', max: 10, better: 'higher', aggregate: 'avg', par: 7.1,
        targets: { beginner: 4.5, low: 6, tour: 7.1 } },
    ],
  },
  22: {
    minutes: 15,
    metrics: [
      { id: 'run', label: 'Best run', kind: 'count', max: 12, better: 'higher',
        targets: { beginner: 8, low: 12, tour: 12 } },
      { id: 'completions', label: 'Completions', kind: 'count', better: 'higher',
        targets: { low: 1, tour: 1 } },
    ],
  },
  23: {
    minutes: 15,
    metrics: [
      { id: 'routine', label: 'Routine points', kind: 'count', max: 18, better: 'higher',
        targets: { beginner: 13, low: 16, tour: 18 } },
      { id: 'range', label: 'Timing range', kind: 'number', unit: 's', better: 'lower',
        targets: { beginner: 4, low: 2.5, tour: 1.5 } },
    ],
  },
  24: {
    minutes: 20,
    metrics: [
      { id: 'total', label: 'Total putts', kind: 'count', better: 'lower', par: 30,
        targets: { beginner: 36, low: 33, tour: 30 } },
      { id: 'short', label: 'Putts on 0.9–3 m holes', kind: 'count', better: 'lower', par: 10.4 },
      { id: 'long', label: 'Putts on 4.5–15 m holes', kind: 'count', better: 'lower', par: 19.7 },
    ],
  },
  25: {
    minutes: 10, warmup: true,
    metrics: [
      { id: 'lag', label: 'Lags inside window', kind: 'count', max: 9, better: 'higher',
        targets: { beginner: 3, low: 5, tour: 7 } },
      { id: 'gate', label: 'Gate passes', kind: 'count', max: 10, better: 'higher',
        targets: { beginner: 6, low: 8, tour: 9 } },
      { id: 'short', label: 'Short block done in 10 min', kind: 'boolean', better: 'higher',
        targets: { beginner: 1, low: 1, tour: 1 } },
    ],
  },
};
