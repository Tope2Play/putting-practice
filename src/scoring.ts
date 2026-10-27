import type { Drill, Level, Metric, Result } from './types';

const round1 = (n: number) => Math.round(n * 10) / 10;

/** The session value of one metric: rounds combined by its aggregate, or the sum of other metrics. */
export function metricValue(drill: Drill, metric: Metric, result: Result): number | undefined {
  if (metric.sumOf) {
    const parts = metric.sumOf.map((id) => {
      const m = drill.metrics.find((x) => x.id === id);
      return m ? metricValue(drill, m, result) : undefined;
    });
    if (parts.some((p) => p === undefined)) return undefined;
    return (parts as number[]).reduce((a, b) => a + b, 0);
  }
  const vals = (result.values[metric.id] ?? []).filter((v) => Number.isFinite(v));
  if (!vals.length) return undefined;
  const better = metric.better === 'lower' ? -1 : 1;
  switch (metric.aggregate ?? 'sum') {
    case 'avg':
      return round1(vals.reduce((a, b) => a + b, 0) / vals.length);
    case 'best':
      return better > 0 ? Math.max(...vals) : Math.min(...vals);
    case 'worst':
      return better > 0 ? Math.min(...vals) : Math.max(...vals);
    default:
      return round1(vals.reduce((a, b) => a + b, 0));
  }
}

/** Max for the session value, taking rounds into account (e.g. 2 rounds of 10 summed = 20). */
export function metricMax(drill: Drill, metric: Metric): number | undefined {
  if (metric.max === undefined) return undefined;
  if (metric.sumOf) return metric.max;
  const agg = metric.aggregate ?? 'sum';
  return agg === 'sum' ? metric.max * Math.max(1, drill.rounds) : metric.max;
}

/** The metric used for the high score and chart. */
export function primaryMetric(drill: Drill): Metric | undefined {
  const scored = drill.metrics.filter((m) => m.better !== 'none');
  return scored.find((m) => m.targets && Object.keys(m.targets).length) ?? scored[0] ?? drill.metrics[0];
}

export function isBetter(metric: Metric, a: number, b: number) {
  return metric.better === 'lower' ? a < b : a > b;
}

export function meetsTarget(metric: Metric, value: number | undefined, level: Level): boolean | null {
  const t = metric.targets?.[level];
  if (t === undefined || value === undefined) return null;
  return metric.better === 'lower' ? value <= t : value >= t;
}

/** true/false if the drill has targets for this level, null otherwise. */
export function passed(drill: Drill, result: Result, level: Level): boolean | null {
  const checks = drill.metrics
    .map((m) => meetsTarget(m, metricValue(drill, m, result), level))
    .filter((c) => c !== null);
  return checks.length ? checks.every(Boolean) : null;
}

export function hasTargets(drill: Drill, level: Level) {
  return drill.metrics.some((m) => m.targets?.[level] !== undefined);
}

export function formatValue(drill: Drill, metric: Metric, value: number | undefined): string {
  if (value === undefined) return '–';
  if (metric.kind === 'boolean') return value ? 'Yes' : 'No';
  const max = metricMax(drill, metric);
  const v = String(round1(value));
  if (metric.unit === '%') return `${v}%`;
  if (max !== undefined) return `${v}/${max}`;
  return metric.unit ? `${v} ${metric.unit}` : v;
}

/** "+2" / "−0.6" relative to par, signed so that positive is always shown as-is. */
export function formatPar(metric: Metric, value: number | undefined): string | null {
  if (metric.par === undefined || value === undefined) return null;
  const d = round1(value - metric.par);
  if (d === 0) return 'E';
  return d > 0 ? `+${d}` : `−${Math.abs(d)}`;
}

export function parIsGood(metric: Metric, value: number) {
  if (metric.par === undefined) return true;
  return metric.better === 'lower' ? value <= metric.par : value >= metric.par;
}

export function formatTarget(metric: Metric, level: Level): string | null {
  const t = metric.targets?.[level];
  if (t === undefined) return null;
  if (metric.kind === 'boolean') return 'Yes';
  const unit = metric.unit === '%' ? '%' : metric.unit ? ` ${metric.unit}` : '';
  return `${metric.better === 'lower' ? '≤' : '≥'} ${t}${unit}`;
}

export function drillResults(results: Result[], drillId: string) {
  return results.filter((r) => r.drillId === drillId).sort((a, b) => a.date.localeCompare(b.date));
}

export interface DrillStats {
  count: number;
  last?: Result;
  best?: { value: number; result: Result };
  /** Consecutive passes, newest first, at the current level. */
  passStreak: number;
  passCount: number;
}

export function drillStats(drill: Drill, results: Result[], level: Level): DrillStats {
  const rs = drillResults(results, drill.id);
  const pm = primaryMetric(drill);
  let best: DrillStats['best'];
  if (pm && pm.better !== 'none') {
    for (const r of rs) {
      const v = metricValue(drill, pm, r);
      if (v !== undefined && (!best || isBetter(pm, v, best.value))) best = { value: v, result: r };
    }
  }
  let passStreak = 0;
  for (let i = rs.length - 1; i >= 0 && passed(drill, rs[i], level); i--) passStreak++;
  const passCount = rs.filter((r) => passed(drill, r, level)).length;
  return { count: rs.length, last: rs[rs.length - 1], best, passStreak, passCount };
}

/** Metrics on which this result set a new personal best (compared to earlier results). */
export function newBests(drill: Drill, results: Result[], result: Result): Metric[] {
  const earlier = results.filter((r) => r.drillId === drill.id && r.id !== result.id && r.date < result.date);
  if (!earlier.length) return [];
  return drill.metrics.filter((m) => {
    if (m.better === 'none' || m.kind === 'boolean') return false;
    const v = metricValue(drill, m, result);
    if (v === undefined) return false;
    const prev = earlier.map((r) => metricValue(drill, m, r)).filter((x): x is number => x !== undefined);
    return prev.length > 0 && prev.every((p) => isBetter(m, v, p));
  });
}

// ---- Practice streaks ----

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function weekStart(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x.getTime();
}

export function practiceStats(results: Result[], now = new Date()) {
  const days = new Set(results.map((r) => dayKey(new Date(r.date))));
  const weeks = new Set(results.map((r) => weekStart(new Date(r.date))));
  const thisWeek = weekStart(now);
  const daysThisWeek = new Set(
    results.filter((r) => weekStart(new Date(r.date)) === thisWeek).map((r) => dayKey(new Date(r.date))),
  ).size;
  // Weekly streak: counts back from this week, or from last week if nothing logged yet this week.
  let streak = 0;
  const WEEK = 7 * 864e5;
  let w = weeks.has(thisWeek) ? thisWeek : thisWeek - WEEK;
  while (weeks.has(w)) {
    streak++;
    w = weekStart(new Date(w - WEEK + 12 * 36e5)); // midday avoids DST edge cases
  }
  return { totalDays: days.size, daysThisWeek, weekStreak: streak };
}
