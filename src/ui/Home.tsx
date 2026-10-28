import { navigate } from '../router';
import { drillStats, newBests, passed, practiceStats } from '../scoring';
import { useStore } from '../store';
import { LEVELS } from '../types';
import { DrillRow, Empty, relDate } from './common';

export function Home() {
  const data = useStore();
  const { results, drills, settings, active } = data;
  const p = practiceStats(results);
  const byId = new Map(drills.map((d) => [d.id, d]));
  const recent = [...results].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const levelUp = drills.filter((d) => drillStats(d, results, settings.level).passStreak >= 2);
  const level = LEVELS.find((l) => l.id === settings.level)!;

  return (
    <div class="page">
      <header class="hero">
        <div>
          <h1>Putting Practice</h1>
          <p class="muted small">Targets: {level.label} · <a href="#/settings">change</a></p>
        </div>
      </header>

      <div class="stats">
        <div class="stat"><b>{p.weekStreak}</b><span>week streak</span></div>
        <div class="stat"><b>{p.daysThisWeek}</b><span>days this week</span></div>
        <div class="stat"><b>{results.length}</b><span>drills logged</span></div>
      </div>

      {active ? (
        <button class="btn primary big" onClick={() => navigate('/session')}>
          Resume session · drill {active.index + 1} of {active.session.drillIds.length}
        </button>
      ) : (
        <button class="btn primary big" onClick={() => navigate('/plan')}>⛳ Plan today's practice</button>
      )}
      <button class="btn big" onClick={() => navigate('/drills')}>Log a single drill</button>

      {levelUp.length > 0 && (
        <section>
          <h2>Ready to progress</h2>
          <p class="muted small">Passed twice in a row at your level. Try the harder version (see “Progressions”) or raise your level.</p>
          <div class="list">
            {levelUp.map((d) => <DrillRow drill={d} results={results} level={settings.level} onClick={() => navigate(`/drill/${d.id}`)} />)}
          </div>
        </section>
      )}

      <section>
        <h2>Recent results</h2>
        {recent.length === 0 ? (
          <Empty>No results yet. Plan a session or pick a drill to log your first score.</Empty>
        ) : (
          <div class="list">
            {recent.map((r) => {
              const d = byId.get(r.drillId);
              if (!d) return null;
              const ok = passed(d, r, r.level);
              const pb = newBests(d, results, r).length > 0;
              return (
                <div class="row" role="button" onClick={() => navigate(`/drill/${d.id}`)}>
                  <div class="row-main">
                    <div class="row-title">
                      {d.name}
                      {pb && <span class="tag pb">★ PB</span>}
                      {r.hard && <span class="tag warm">Hard</span>}
                    </div>
                    <div class="row-sub">{relDate(r.date)}</div>
                  </div>
                  {ok !== null && <span class={'badge ' + (ok ? 'good' : 'bad')}>{ok ? 'Pass' : 'Miss'}</span>}
                </div>
              );
            })}
          </div>
        )}
        {results.length > 6 && <button class="link" onClick={() => navigate('/history')}>All history ›</button>}
      </section>
    </div>
  );
}
