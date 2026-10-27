import { metricValue } from '../scoring';
import type { Drill, Level, Metric, Result } from '../types';

/** Line chart of one metric across results, with the level's target as a dashed line. */
export function Chart({ drill, metric, results, level }: { drill: Drill; metric: Metric; results: Result[]; level: Level }) {
  const pts = results
    .map((r) => ({ r, v: metricValue(drill, metric, r) }))
    .filter((p): p is { r: Result; v: number } => p.v !== undefined)
    .slice(-30);
  if (pts.length < 2) return <p class="muted small">The chart appears after two logged results.</p>;

  const W = 320, H = 140, P = { l: 30, r: 10, t: 10, b: 20 };
  const target = metric.targets?.[level];
  const vals = pts.map((p) => p.v).concat(target !== undefined ? [target] : []);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.1;
  lo -= pad; hi += pad;
  const x = (i: number) => P.l + (i / (pts.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const fmt = (v: number) => String(Math.round(v * 10) / 10);
  const date = (r: Result) => new Date(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${metric.label} over time`}>
      <text x={P.l - 4} y={y(hi - pad) + 4} class="axis" text-anchor="end">{fmt(hi - pad)}</text>
      <text x={P.l - 4} y={y(lo + pad) + 4} class="axis" text-anchor="end">{fmt(lo + pad)}</text>
      <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} class="baseline" />
      {target !== undefined && (
        <>
          <line x1={P.l} x2={W - P.r} y1={y(target)} y2={y(target)} class="target" />
          <text x={W - P.r} y={y(target) - 4} class="axis" text-anchor="end">target {target}</text>
        </>
      )}
      <path d={line} class="series" />
      {pts.map((p, i) => <circle cx={x(i)} cy={y(p.v)} r={3} class="dot" />)}
      <text x={P.l} y={H - 4} class="axis">{date(pts[0].r)}</text>
      <text x={W - P.r} y={H - 4} class="axis" text-anchor="end">{date(pts[pts.length - 1].r)}</text>
    </svg>
  );
}
