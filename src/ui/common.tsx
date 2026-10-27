import type { ComponentChildren } from 'preact';
import { back } from '../router';
import { drillStats, formatValue, primaryMetric } from '../scoring';
import type { Drill, Level, Result } from '../types';

export function Header({ title, backTo, right }: { title: string; backTo?: string; right?: ComponentChildren }) {
  return (
    <header class="top">
      {backTo !== undefined ? (
        <button class="link back" onClick={() => back(backTo)} aria-label="Back">‹ Back</button>
      ) : <span />}
      <h1>{title}</h1>
      <div class="top-right">{right}</div>
    </header>
  );
}

export const relDate = (iso: string) => {
  const d = new Date(iso);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 864e5);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: days > 300 ? 'numeric' : undefined });
};

export function DrillRow({ drill, results, level, onClick, right }: {
  drill: Drill; results: Result[]; level: Level; onClick?: () => void; right?: ComponentChildren;
}) {
  const s = drillStats(drill, results, level);
  const pm = primaryMetric(drill);
  return (
    <div class="row" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div class="row-main">
        <div class="row-title">
          {drill.name}
          {drill.warmup && <span class="tag warm">warm-up</span>}
          {s.passStreak >= 2 && <span class="tag good">level up</span>}
        </div>
        <div class="row-sub">
          {drill.minutes} min · {drill.category}
          {s.best && pm ? ` · Best ${formatValue(drill, pm, s.best.value)}` : ''}
          {s.last ? ` · ${relDate(s.last.date)}` : ' · never done'}
        </div>
      </div>
      {right ?? (onClick && <span class="chev">›</span>)}
    </div>
  );
}

export function Empty({ children }: { children: ComponentChildren }) {
  return <div class="empty">{children}</div>;
}
