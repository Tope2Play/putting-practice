import { useState } from 'preact/hooks';
import { navigate } from '../router';
import { actions, uid, useStore } from '../store';
import { LEVELS, type Drill, type Metric } from '../types';
import { Empty, Header } from './common';

const blankMetric = (): Metric => ({ id: 'm' + uid().slice(-5), label: 'Makes', kind: 'count', max: 10, better: 'higher', targets: {} });

const blankDrill = (): Drill => ({
  id: 'custom-' + uid(),
  name: '',
  discipline: 'putting',
  category: '',
  minutes: 10,
  warmup: false,
  rounds: 1,
  summary: '',
  equipment: '',
  metrics: [blankMetric()],
  content: '**Setup:**\n\n- \n\n**Procedure:**\n\n1. \n\n**Scoring:**\n\n- ',
});

const PRESETS: { label: string; metric: () => Metric }[] = [
  { label: 'Makes out of N', metric: () => ({ ...blankMetric(), label: 'Makes', max: 10 }) },
  { label: 'Best streak', metric: () => ({ ...blankMetric(), label: 'Best streak', max: undefined }) },
  { label: 'Putts/balls needed to finish', metric: () => ({ ...blankMetric(), label: 'Balls needed', max: undefined, better: 'lower' }) },
  { label: 'Score vs par', metric: () => ({ ...blankMetric(), label: 'Score', max: undefined, better: 'lower', par: 18 }) },
  { label: 'Time to finish', metric: () => ({ ...blankMetric(), label: 'Time', kind: 'number', unit: 'min', max: undefined, better: 'lower' }) },
  { label: 'Distance / proximity', metric: () => ({ ...blankMetric(), label: 'Avg distance to hole', kind: 'number', unit: 'cm', max: undefined, better: 'lower' }) },
];

const num = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')));

function Field({ label, children }: { label: string; children: preact.ComponentChildren }) {
  return <label class="field"><span>{label}</span>{children}</label>;
}

function MetricEditor({ m, rounds, onChange, onRemove }: { m: Metric; rounds: number; onChange: (m: Metric) => void; onRemove: () => void }) {
  const set = (patch: Partial<Metric>) => onChange({ ...m, ...patch });
  const val = (e: Event) => (e.target as HTMLInputElement).value;
  return (
    <div class="card metric-edit">
      <div class="section-head">
        <input class="field-input strong" value={m.label} onInput={(e) => set({ label: val(e) })} placeholder="Name, e.g. Makes" />
        <button type="button" class="link danger" onClick={onRemove}>Remove</button>
      </div>
      {m.sumOf && <p class="muted small">Calculated automatically as the sum of other scores.</p>}
      <div class="grid2">
        {!m.sumOf && (
          <Field label="Type">
            <select class="field-input" value={m.kind} onChange={(e) => set({ kind: val(e) as Metric['kind'] })}>
              <option value="count">Whole number</option>
              <option value="number">Decimal (cm, %, s…)</option>
              <option value="boolean">Yes / no</option>
            </select>
          </Field>
        )}
        <Field label="Better is">
          <select class="field-input" value={m.better} onChange={(e) => set({ better: val(e) as Metric['better'] })}>
            <option value="higher">Higher</option>
            <option value="lower">Lower</option>
            <option value="none">Just a note</option>
          </select>
        </Field>
        {m.kind !== 'boolean' && (
          <>
            <Field label="Out of (max)">
              <input class="field-input" inputMode="decimal" value={m.max ?? ''} placeholder="none" onInput={(e) => set({ max: num(val(e)) })} />
            </Field>
            <Field label="Unit">
              <input class="field-input" value={m.unit ?? ''} placeholder="e.g. cm" onInput={(e) => set({ unit: val(e) || undefined })} />
            </Field>
            <Field label="Par / reference">
              <input class="field-input" inputMode="decimal" value={m.par ?? ''} placeholder="none" onInput={(e) => set({ par: num(val(e)) })} />
            </Field>
          </>
        )}
        {rounds > 1 && !m.sumOf && (
          <Field label="Rounds combine as">
            <select class="field-input" value={m.aggregate ?? 'sum'} onChange={(e) => set({ aggregate: val(e) as Metric['aggregate'] })}>
              <option value="sum">Total</option>
              <option value="avg">Average</option>
              <option value="best">Best round</option>
              <option value="worst">Worst round (all must pass)</option>
            </select>
          </Field>
        )}
      </div>
      {m.better !== 'none' && (
        <>
          <p class="small muted">Pass targets (leave blank for none)</p>
          <div class="grid3">
            {LEVELS.map((l) => (
              <Field label={l.label}>
                <input class="field-input" inputMode="decimal" value={m.targets?.[l.id] ?? ''}
                  onInput={(e) => set({ targets: { ...m.targets, [l.id]: num(val(e)) } })} />
              </Field>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function DrillEditor({ id }: { id?: string }) {
  const { drills } = useStore();
  const existing = id ? drills.find((d) => d.id === id) : undefined;
  const [d, setD] = useState<Drill>(() => (existing ? structuredClone(existing) : blankDrill()));
  if (id && !existing) return <div class="page"><Header title="Edit" backTo="/drills" /><Empty>Drill not found.</Empty></div>;

  const set = (patch: Partial<Drill>) => setD({ ...d, ...patch });
  const val = (e: Event) => (e.target as HTMLInputElement).value;
  const cats = [...new Set(drills.map((x) => x.category))];
  const valid = d.name.trim() && d.metrics.length && d.metrics.every((m) => m.label.trim());

  const save = () => {
    // Drop targets left blank and ids of removed metrics from sums.
    const ids = new Set(d.metrics.map((m) => m.id));
    const metrics = d.metrics.map((m) => ({
      ...m,
      targets: Object.fromEntries(Object.entries(m.targets ?? {}).filter(([, v]) => v !== undefined && !Number.isNaN(v))),
      sumOf: m.sumOf?.filter((x) => ids.has(x)),
    }));
    actions.saveDrill({ ...d, name: d.name.trim(), category: d.category.trim() || 'My drills', metrics });
    navigate(`/drill/${d.id}`, true);
  };

  return (
    <div class="page">
      <Header title={existing ? 'Edit drill' : 'New drill'} backTo="/drills"
        right={<button class="link strong" disabled={!valid} onClick={save}>Save</button>} />

      <Field label="Name"><input class="field-input" value={d.name} onInput={(e) => set({ name: val(e) })} placeholder="e.g. Clock drill 1 m" /></Field>
      <div class="grid2">
        <Field label="Type">
          <select class="field-input" value={d.discipline} onChange={(e) => set({ discipline: val(e) as Drill['discipline'] })}>
            <option value="putting">Putting</option>
            <option value="chipping">Chipping</option>
          </select>
        </Field>
        <Field label="Category">
          <input class="field-input" list="cats" value={d.category} onInput={(e) => set({ category: val(e) })} placeholder="e.g. Short Putts" />
          <datalist id="cats">{cats.map((c) => <option value={c} />)}</datalist>
        </Field>
        <Field label="Usual time (min)">
          <input class="field-input" inputMode="numeric" value={d.minutes} onInput={(e) => set({ minutes: num(val(e)) ?? 0 })} />
        </Field>
        <Field label="Rounds">
          <input class="field-input" inputMode="numeric" value={d.rounds} onInput={(e) => set({ rounds: Math.max(1, num(val(e)) ?? 1) })} />
        </Field>
      </div>
      <label class="toggle">
        <input type="checkbox" checked={d.warmup} onChange={(e) => set({ warmup: (e.target as HTMLInputElement).checked })} />
        <span>Good as a warm-up</span>
      </label>
      <Field label="What it trains"><textarea rows={2} value={d.summary} onInput={(e) => set({ summary: val(e) })} /></Field>
      <Field label="Equipment"><input class="field-input" value={d.equipment} onInput={(e) => set({ equipment: val(e) })} /></Field>

      <h2>Scoring</h2>
      <p class="small muted">What you enter at the end of the drill. The first score with targets is used for the high score and chart.</p>
      {d.metrics.map((m, i) => (
        <MetricEditor m={m} rounds={d.rounds}
          onChange={(nm) => set({ metrics: d.metrics.map((x, j) => (j === i ? nm : x)) })}
          onRemove={() => set({ metrics: d.metrics.filter((_, j) => j !== i) })} />
      ))}
      <select class="field-input" value="" onChange={(e) => {
        const p = PRESETS[Number(val(e))];
        if (p) set({ metrics: [...d.metrics, p.metric()] });
      }}>
        <option value="">+ Add a score…</option>
        {PRESETS.map((p, i) => <option value={i}>{p.label}</option>)}
      </select>

      <h2>Instructions</h2>
      <p class="small muted">Markdown: **bold**, “- ” for bullets, “1. ” for steps.</p>
      <textarea class="code" rows={14} value={d.content} onInput={(e) => set({ content: val(e) })} />

      <button class="btn primary big" disabled={!valid} onClick={save}>Save drill</button>
    </div>
  );
}
