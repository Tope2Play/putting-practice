import { useMemo, useState } from 'preact/hooks';
import { planSession, swapDrill, warmupBudget, type PlanOptions } from '../planner';
import { navigate } from '../router';
import { actions, getState, uid, useStore } from '../store';
import type { Drill } from '../types';
import { DrillRow, Header } from './common';

const TIMES = [10, 15, 20, 30, 45, 60, 90];

export function Plan() {
  const data = useStore();
  const [opts, setOpts] = useState<PlanOptions>({ minutes: 30, warmup: true, categories: [], discipline: 'all' });
  const [seed, setSeed] = useState(0);
  const generated = useMemo(() => planSession(getState(), opts), [opts, seed]);
  const [edited, setEdited] = useState<{ key: string; plan: Drill[] } | null>(null);
  const key = JSON.stringify(opts) + seed;
  const plan = edited?.key === key ? edited.plan : generated;
  const setPlan = (p: Drill[]) => setEdited({ key, plan: p });
  const [adding, setAdding] = useState(false);

  const total = plan.reduce((a, d) => a + d.minutes, 0);
  const cats = [...new Set(data.drills.filter((d) => !d.warmup).map((d) => d.category))];
  const hasChipping = data.drills.some((d) => d.discipline === 'chipping');
  const set = (patch: Partial<PlanOptions>) => setOpts((o) => ({ ...o, ...patch }));
  const toggleCat = (c: string) =>
    set({ categories: opts.categories.includes(c) ? opts.categories.filter((x) => x !== c) : [...opts.categories, c] });

  const start = () => {
    const now = Date.now();
    actions.setActive({
      session: { id: uid(), date: new Date(now).toISOString(), plannedMinutes: opts.minutes, drillIds: plan.map((d) => d.id) },
      index: 0,
      startedAt: now,
      drillStartedAt: now,
      resultIds: [],
    });
    navigate('/session', true);
  };

  return (
    <div class="page">
      <Header title="Plan practice" backTo="/" />

      <h2>How much time do you have?</h2>
      <div class="chips">
        {TIMES.map((t) => <button class={'chip ' + (opts.minutes === t ? 'on' : '')} onClick={() => set({ minutes: t })}>{t} min</button>)}
      </div>

      <label class="toggle">
        <input type="checkbox" checked={opts.warmup} onChange={(e) => set({ warmup: (e.target as HTMLInputElement).checked })} />
        <span>Start with a warm-up {warmupBudget(opts.minutes) ? `(up to ${warmupBudget(opts.minutes)} min)` : '(needs 15+ min)'}</span>
      </label>

      {hasChipping && (
        <div class="chips">
          {(['all', 'putting', 'chipping'] as const).map((d) => (
            <button class={'chip ' + (opts.discipline === d ? 'on' : '')} onClick={() => set({ discipline: d })}>{d === 'all' ? 'Putting + chipping' : d[0].toUpperCase() + d.slice(1)}</button>
          ))}
        </div>
      )}

      <h2>Focus <span class="muted small">(optional)</span></h2>
      <div class="chips">
        {cats.map((c) => <button class={'chip ' + (opts.categories.includes(c) ? 'on' : '')} onClick={() => toggleCat(c)}>{c}</button>)}
      </div>

      <section>
        <div class="section-head">
          <h2>Your session · {total} of {opts.minutes} min</h2>
          <button class="link" onClick={() => setSeed(seed + 1)}>↻ Shuffle</button>
        </div>
        <div class="list">
          {plan.map((d, i) => (
            <DrillRow
              drill={d} results={data.results} level={data.settings.level}
              right={
                <span class="row-actions">
                  <button class="icon" aria-label="Swap drill" onClick={() => setPlan(swapDrill(data, opts, plan, i))}>⇄</button>
                  <button class="icon" aria-label="Remove drill" onClick={() => setPlan(plan.filter((_, j) => j !== i))}>✕</button>
                </span>
              }
            />
          ))}
          {plan.length === 0 && <div class="row muted">No drills fit. Try more time or fewer focus areas.</div>}
        </div>
        {adding ? (
          <select class="field-input" onChange={(e) => {
            const d = data.drills.find((x) => x.id === (e.target as HTMLSelectElement).value);
            if (d) setPlan([...plan, d]);
            setAdding(false);
          }}>
            <option value="">Choose a drill…</option>
            {data.drills.filter((d) => !plan.includes(d)).map((d) => <option value={d.id}>{d.name} ({d.minutes} min)</option>)}
          </select>
        ) : (
          <button class="link" onClick={() => setAdding(true)}>+ Add a drill</button>
        )}
      </section>

      <button class="btn primary big" disabled={!plan.length} onClick={start}>Start session</button>
    </div>
  );
}
