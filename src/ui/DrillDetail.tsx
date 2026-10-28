import { useState } from 'preact/hooks';
import { navigate } from '../router';
import { drillResults, drillStats, formatPar, formatTarget, formatValue, isComputed, metricValue, parIsGood, passed, primaryMetric } from '../scoring';
import { actions, uid, useStore } from '../store';
import { LEVELS, SPEEDS, type Drill } from '../types';
import { shareJSON } from '../share';
import { Chart } from './Chart';
import { Empty, Header, relDate } from './common';
import { Markdown } from './Markdown';

/** The scores worth showing per history row: computed totals first, then other scored inputs. */
function historyMetrics(drill: Drill) {
  const totals = drill.metrics.filter(isComputed);
  const shown = totals.length ? totals : drill.metrics.filter((m) => m.better !== 'none');
  return shown.slice(0, 3);
}

export function DrillDetail({ id }: { id: string }) {
  const { drills, results, settings } = useStore();
  const drill = drills.find((d) => d.id === id);
  const [chartMetric, setChartMetric] = useState<string | null>(null);
  if (!drill) return <div class="page"><Header title="Drill" backTo="/drills" /><Empty>This drill was deleted.</Empty></div>;

  const level = settings.level;
  const s = drillStats(drill, results, level);
  const rs = drillResults(results, drill.id);
  const pm = primaryMetric(drill);
  const chartable = drill.metrics.filter((m) => m.kind !== 'boolean');
  const cm = chartable.find((m) => m.id === chartMetric) ?? pm;
  const withTargets = drill.metrics.filter((m) => m.targets && Object.keys(m.targets).length);

  const duplicate = () => {
    const copy: Drill = { ...structuredClone(drill), id: 'custom-' + uid(), name: drill.name + ' (copy)', builtin: false };
    actions.saveDrill(copy);
    navigate(`/drill/${copy.id}/edit`, true);
  };
  const remove = () => {
    const n = rs.length;
    if (confirm(`Delete “${drill.name}”${n ? ` and its ${n} logged result${n > 1 ? 's' : ''}` : ''}?`)) {
      rs.forEach((r) => actions.deleteResult(r.id));
      actions.deleteDrill(drill.id);
      navigate('/drills', true);
    }
  };

  return (
    <div class="page">
      <Header title="" backTo="/drills" right={<button class="link" onClick={() => navigate(`/drill/${drill.id}/edit`)}>Edit</button>} />
      <h1 class="title">{drill.code && <span class="code">{drill.code}</span>}{drill.name}</h1>
      <p class="muted">
        {drill.category} · {drill.minutes} min{drill.rounds > 1 ? ` · ${drill.rounds} rounds` : ''}
        {drill.warmup && <span class="tag warm">warm-up</span>}
      </p>
      {drill.summary && <p>{drill.summary}</p>}

      <button class="btn primary big" onClick={() => navigate(`/log/${drill.id}`)}>{drill.metrics.length ? 'Log result' : 'Mark done'}</button>

      {drill.metrics.length ? (
        <div class="stats">
          <div class="stat"><b>{s.best && pm ? formatValue(drill, pm, s.best.value) : '–'}</b><span>high score</span></div>
          <div class="stat"><b>{s.count}</b><span>times done</span></div>
          <div class="stat"><b>{s.passStreak}</b><span>passes in a row</span></div>
        </div>
      ) : (
        <div class="stats two">
          <div class="stat"><b>{s.count}</b><span>times done</span></div>
          <div class="stat"><b>{s.last ? relDate(s.last.date) : '–'}</b><span>last done</span></div>
        </div>
      )}
      {s.passStreak >= 2 && (
        <p class="callout good">Two passes in a row — time to take the harder progression or move up a level.</p>
      )}

      {withTargets.length > 0 && (
        <section>
          <h2>Targets</h2>
          <div class="table-wrap">
            <table class="targets">
              <thead><tr><th></th>{LEVELS.map((l) => <th class={l.id === level ? 'mine' : ''}>{l.label}</th>)}</tr></thead>
              <tbody>
                {withTargets.map((m) => (
                  <tr><td>{m.label}</td>{LEVELS.map((l) => <td class={l.id === level ? 'mine' : ''}>{formatTarget(m, l.id) ?? '–'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {rs.length > 0 && cm && (
        <section>
          <h2>Progress</h2>
          {chartable.length > 1 && (
            <div class="chips">
              {chartable.map((m) => <button class={'chip ' + (m.id === cm.id ? 'on' : '')} onClick={() => setChartMetric(m.id)}>{m.label}</button>)}
            </div>
          )}
          <Chart drill={drill} metric={cm} results={rs} level={level} />
        </section>
      )}

      <section>
        <h2>How to</h2>
        <details class="card" open={rs.length === 0}>
          <summary>Instructions</summary>
          <Markdown text={drill.content || '_No instructions yet. Tap Edit to add some._'} />
        </details>
      </section>

      {rs.length > 0 && (
        <section>
          <h2>History</h2>
          <div class="list">
            {[...rs].reverse().map((r) => {
              const ok = passed(drill, r, r.level);
              return (
                <div class="row">
                  <div class="row-main">
                    <div class="row-title">
                      {drill.metrics.length === 0 && <span class="hv">Done</span>}
                      {historyMetrics(drill).map((m) => {
                        const v = metricValue(drill, m, r);
                        const par = formatPar(m, v);
                        return <span class="hv">{m.label}: <b>{formatValue(drill, m, v)}</b>{par && <span class={'par ' + (parIsGood(m, v!) ? 'good' : 'bad')}> {par}</span>}</span>;
                      })}
                      {r.hard && <span class="tag warm">Hard</span>}
                    </div>
                    <div class="row-sub">
                      {relDate(r.date)}
                      {r.speed ? ` · ${SPEEDS.find((x) => x.id === r.speed)?.label} green` : ''}
                      {r.note ? ` · ${r.note}` : ''}
                    </div>
                  </div>
                  {ok !== null && <span class={'badge ' + (ok ? 'good' : 'bad')}>{ok ? 'Pass' : 'Miss'}</span>}
                  <button class="link danger" aria-label="Delete result" onClick={() => confirm('Delete this result?') && actions.deleteResult(r.id)}>✕</button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section class="actions-row">
        <button class="btn" onClick={duplicate}>Duplicate</button>
        <button class="btn" onClick={() => shareJSON(`${drill.name}.drill.json`, { type: 'drills', drills: [drill] })}>Share</button>
        <button class="btn danger" onClick={remove}>Delete</button>
      </section>
    </div>
  );
}
