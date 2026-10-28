// Scoring setup for docs/warmup-and-games.md, keyed by code (W1, G1 …).
// The Markdown supplies the text; this file supplies what the app needs to log and judge a result.
// Where a game scores points per ball by band (e.g. holed = 3, in zone = 2), you enter how many balls
// fell in each band and a `calc` metric turns them into points.
//
// Metric fields:
//   id, label        – key and display name
//   kind             – 'count' (whole numbers, stepper), 'number' (decimals), 'boolean' (yes/no)
//   max, unit, step  – optional upper bound, unit, and +/− step for decimals
//   better           – 'higher' | 'lower' | 'none' (informational only, no high score)
//   aggregate        – how rounds combine: 'sum' | 'avg' | 'best' | 'worst'
//   calc             – computed: { terms: [{ id, w }], offset } = Σ w × value + offset
//   par              – reference value; the app shows the difference
//   signed           – show a + sign on positive values
//   targets          – pass thresholds per level: { beginner, low, tour }

const count = (id, label, max, extra = {}) => ({ id, label, kind: 'count', max, better: 'higher', ...extra });
const info = (id, label, max) => ({ id, label, kind: 'count', max, better: 'none' });
const points = (terms, max, targets, label = 'Points') => ({
  id: 'points', label, kind: 'count', max, better: 'higher',
  calc: { terms: Object.entries(terms).map(([id, w]) => ({ id, w })) }, targets,
});

export const meta = {
  W1: { minutes: 7, warmup: true, metrics: [] },
  W2: { minutes: 8, warmup: true, metrics: [] },

  G1: {
    minutes: 8,
    metrics: [
      count('gates', 'Clean gate passes', 20),
      count('holes', 'Holed', 20),
      points({ gates: 1, holes: 1 }, 40, { beginner: 18, low: 28, tour: 32 }),
    ],
  },
  G2: {
    minutes: 8,
    metrics: [
      count('within3', 'Strikes within ±3 mm (2 pts)', 10),
      count('within6', 'Strikes ±3.1–6 mm (1 pt)', 10),
      points({ within3: 2, within6: 1 }, 20, { beginner: 8, low: 13, tour: 17 }),
      info('heel', 'Misses toward heel', 10),
      info('toe', 'Misses toward toe', 10),
    ],
  },
  G3: {
    minutes: 15,
    metrics: [
      count('streak', 'Best streak', 100, { targets: { beginner: 25, low: 50, tour: 100 } }),
      { id: 'time', label: 'Time to 100 (if reached)', kind: 'number', unit: 'min', better: 'lower' },
    ],
  },
  G4: {
    minutes: 8,
    metrics: [
      { id: 'farthest', label: 'Farthest holed', kind: 'number', unit: 'm', max: 6, step: 0.5, better: 'higher',
        targets: { beginner: 2, low: 3, tour: 4 } },
      count('lives', 'Lives left', 3),
    ],
  },
  G5: {
    minutes: 8,
    metrics: [
      count('makes', 'Makes', 10),
      { id: 'sg', label: 'Strokes gained vs Tour', kind: 'number', better: 'higher', signed: true,
        calc: { terms: [{ id: 'makes', w: 1 }], offset: -7.1 }, targets: { beginner: -2.6, low: -1.1, tour: 0 } },
    ],
  },
  G6: {
    minutes: 6,
    metrics: [
      count('holed', 'Holed (3 pts)', 10),
      count('zone', 'In safe zone (2 pts)', 10),
      points({ holed: 3, zone: 2 }, 30, { beginner: 10, low: 15, tour: 20 }),
    ],
  },
  G7: {
    minutes: 8, rounds: 3,
    metrics: [
      count('balls', 'Balls placed', 6, { aggregate: 'sum', targets: { beginner: 9, low: 15, tour: 18 } }),
    ],
  },
  G8: {
    minutes: 10,
    caller: { label: 'Call target', options: ['3 m', '5 m', '7 m', '9 m', '11 m', '13 m'] },
    metrics: [
      count('within5', 'Within 5% (3 pts)', 12),
      count('within10', 'Within 5–10% (2 pts)', 12),
      count('within15', 'Within 10–15% (1 pt)', 12),
      points({ within5: 3, within10: 2, within15: 1 }, 36, { beginner: 12, low: 20, tour: 27 }),
    ],
  },
  G9: {
    minutes: 10,
    metrics: [
      count('holed', 'Holed (2 pts)', 12),
      count('zone', 'In zone (1 pt)', 12),
      points({ holed: 2, zone: 1 }, 24, { beginner: 8, low: 13, tour: 17 }),
    ],
  },
  G10: {
    minutes: 10,
    metrics: [
      count('calls', 'Correct calls', 20),
      count('zone', 'Balls in ±0.5 m zone', 20),
      points({ calls: 1, zone: 1 }, 40, { beginner: 18, low: 25, tour: 31 }),
    ],
  },
  G11: {
    minutes: 10,
    metrics: [
      count('holed', 'Holed (5 pts)', 9),
      count('r05', 'Inside 0.5 m (3 pts)', 9),
      count('r10', 'Inside 1.0 m (2 pts)', 9),
      count('r20', 'Inside 2.0 m (1 pt)', 9),
      points({ holed: 5, r05: 3, r10: 2, r20: 1 }, 45, { beginner: 10, low: 16, tour: 22 }),
    ],
  },
  G12: {
    minutes: 15,
    metrics: [
      { id: 's12', label: 'Balls at 12 m', kind: 'count', better: 'lower' },
      { id: 's9', label: 'Balls at 9 m', kind: 'count', better: 'lower' },
      { id: 's15', label: 'Balls at 15 m', kind: 'count', better: 'lower' },
      { id: 'total', label: 'Balls used', kind: 'count', max: 75, better: 'lower',
        calc: { terms: [{ id: 's12', w: 1 }, { id: 's9', w: 1 }, { id: 's15', w: 1 }] },
        targets: { beginner: 50, low: 30, tour: 16 } },
    ],
  },
  G13: {
    minutes: 8,
    metrics: [
      count('w025', 'Within ±0.25% (3 pts)', 8),
      count('w05', 'Within ±0.5% (2 pts)', 8),
      count('w10', 'Within ±1.0% (1 pt)', 8),
      points({ w025: 3, w05: 2, w10: 1 }, 24, { beginner: 10, low: 16, tour: 20 }),
    ],
  },
  G14: {
    minutes: 10,
    metrics: [
      count('makes', 'Makes', 16, { targets: { beginner: 8, low: 11, tour: 13 } }),
      { id: 'low', label: 'Misses low side', kind: 'count', max: 16, better: 'lower' },
      info('high', 'Misses high side', 16),
    ],
  },
  G15: {
    minutes: 20,
    metrics: [
      { id: 'total', label: 'Total putts', kind: 'count', better: 'lower', par: 30,
        targets: { beginner: 36, low: 33, tour: 30 } },
      { id: 'threePutts', label: '3-putts', kind: 'count', max: 18, better: 'lower' },
      { id: 'short', label: 'Putts on 0.9–3 m holes', kind: 'count', better: 'lower', par: 10.4 },
      { id: 'long', label: 'Putts on 4.5–15 m holes', kind: 'count', better: 'lower', par: 19.7 },
    ],
  },
};
