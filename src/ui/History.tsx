import { navigate } from '../router';
import { formatValue, metricValue, passed, primaryMetric } from '../scoring';
import { useStore } from '../store';
import { Empty, Header } from './common';

export function History() {
  const { results, drills } = useStore();
  const byId = new Map(drills.map((d) => [d.id, d]));
  const sorted = [...results].sort((a, b) => b.date.localeCompare(a.date));
  const days = new Map<string, typeof sorted>();
  for (const r of sorted) {
    const k = new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    days.set(k, [...(days.get(k) ?? []), r]);
  }

  return (
    <div class="page">
      <Header title="History" />
      {sorted.length === 0 && <Empty>Your logged drills will show up here.</Empty>}
      {[...days].map(([day, rs]) => (
        <section>
          <h2>{day}</h2>
          <div class="list">
            {rs.map((r) => {
              const d = byId.get(r.drillId);
              if (!d) return null;
              const pm = primaryMetric(d);
              const ok = passed(d, r, r.level);
              return (
                <div class="row" role="button" onClick={() => navigate(`/drill/${d.id}`)}>
                  <div class="row-main">
                    <div class="row-title">{d.name}</div>
                    <div class="row-sub">{pm && `${pm.label}: ${formatValue(d, pm, metricValue(d, pm, r))}`}{r.note ? ` · ${r.note}` : ''}</div>
                  </div>
                  {ok !== null && <span class={'badge ' + (ok ? 'good' : 'bad')}>{ok ? 'Pass' : 'Miss'}</span>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
