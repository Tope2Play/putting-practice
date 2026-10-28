import { drillStats } from './scoring';
import type { AppData, Discipline, Drill } from './types';

export interface PlanOptions {
  minutes: number;
  warmup: boolean;
  /** Empty = all categories */
  categories: string[];
  discipline: Discipline | 'all';
}

const DAY = 864e5;

/** Higher = more worth doing today: long time since last done, not yet passing at your level. */
function priority(drill: Drill, data: AppData, now: number) {
  const s = drillStats(drill, data.results, data.settings.level);
  const daysSince = s.last ? (now - new Date(s.last.date).getTime()) / DAY : 30;
  const needsWork = s.passStreak >= 2 ? 0 : 10;
  return Math.min(daysSince, 30) + needsWork + Math.random() * 8;
}

function candidates(data: AppData, opts: PlanOptions) {
  return data.drills.filter((d) => opts.discipline === 'all' || d.discipline === opts.discipline);
}

function byLibraryOrder(drills: Drill[], all: Drill[]) {
  const idx = new Map(all.map((d, i) => [d.id, i]));
  return [...drills].sort((a, b) => (idx.get(a.id) ?? 0) - (idx.get(b.id) ?? 0));
}

/** Full warm-up (both stations, 15 min) from 30 minutes; one station for shorter sessions. */
export function warmupBudget(minutes: number) {
  return minutes >= 30 ? 15 : minutes >= 15 ? 8 : 0;
}

export function planSession(data: AppData, opts: PlanOptions): Drill[] {
  const now = Date.now();
  const pool = candidates(data, opts);
  const ranked = (ds: Drill[]) =>
    ds.map((d) => ({ d, p: priority(d, data, now) })).sort((a, b) => b.p - a.p).map((x) => x.d);

  const warm: Drill[] = [];
  let left = opts.minutes;
  if (opts.warmup) {
    const budget = warmupBudget(opts.minutes);
    let used = 0;
    for (const d of ranked(pool.filter((d) => d.warmup))) {
      if (used + d.minutes <= budget) {
        warm.push(d);
        used += d.minutes;
      }
    }
    left -= used;
  }

  const inFocus = (d: Drill) => !opts.categories.length || opts.categories.includes(d.category);
  const main: Drill[] = [];
  const rest = ranked(pool.filter((d) => !d.warmup && inFocus(d)));
  // First pass: one drill per category for variety; second pass: fill remaining time.
  for (const pass of [0, 1]) {
    for (const d of rest) {
      if (main.includes(d) || d.minutes > left) continue;
      if (pass === 0 && main.some((m) => m.category === d.category)) continue;
      main.push(d);
      left -= d.minutes;
    }
  }
  return [...byLibraryOrder(warm, data.drills), ...byLibraryOrder(main, data.drills)];
}

/** Best replacement for plan[index]: same role (warm-up or not), fits the freed time, not already planned. */
export function swapDrill(data: AppData, opts: PlanOptions, plan: Drill[], index: number): Drill[] {
  const old = plan[index];
  const used = plan.reduce((a, d) => a + d.minutes, 0) - old.minutes;
  const room = Math.max(opts.minutes - used, old.minutes);
  const now = Date.now();
  const options = candidates(data, opts)
    .filter((d) => !plan.includes(d) && d.minutes <= room && d.warmup === old.warmup)
    .filter((d) => old.warmup || !opts.categories.length || opts.categories.includes(d.category))
    .map((d) => ({ d, p: priority(d, data, now) }))
    .sort((a, b) => b.p - a.p);
  if (!options.length) return plan;
  const next = [...plan];
  next[index] = options[0].d;
  return next;
}
