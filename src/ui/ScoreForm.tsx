import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { formatPar, formatTarget, formatValue, isComputed, meetsTarget, metricValue, parIsGood, passed } from '../scoring';
import { SPEEDS, type Drill, type GreenSpeed, type Level, type Metric, type Result } from '../types';

type Values = Record<string, (number | undefined)[]>;

export interface ResultExtras {
  note?: string;
  hard?: boolean;
  speed?: GreenSpeed;
}

function NumberField({ metric, value, onChange }: { metric: Metric; value: number | undefined; onChange: (v: number | undefined) => void }) {
  if (metric.kind === 'boolean') {
    return (
      <div class="seg">
        <button type="button" class={value === 1 ? 'on' : ''} onClick={() => onChange(1)}>Yes</button>
        <button type="button" class={value === 0 ? 'on' : ''} onClick={() => onChange(0)}>No</button>
      </div>
    );
  }
  const inc = metric.step ?? 1;
  const step = (d: number) => {
    let n = Math.round(((value ?? (d > 0 ? 0 : inc)) + d) * 100) / 100;
    if (n < 0) n = 0;
    if (metric.max !== undefined && n > metric.max) n = metric.max;
    onChange(n);
  };
  const input = (
    <input
      type="text"
      inputMode={metric.kind === 'count' ? 'numeric' : 'decimal'}
      value={value ?? ''}
      placeholder="–"
      onInput={(e) => {
        const raw = (e.target as HTMLInputElement).value.replace(',', '.').replace(/[^0-9.\-]/g, '');
        const n = raw === '' ? undefined : Number(raw);
        onChange(n === undefined || Number.isNaN(n) ? undefined : n);
      }}
    />
  );
  if (metric.kind === 'number' && !metric.step) return <div class="num">{input}{metric.unit && <span class="unit">{metric.unit}</span>}</div>;
  return (
    <div class="stepper">
      <button type="button" aria-label={`minus ${inc}`} onClick={() => step(-inc)}>−</button>
      {input}
      <button type="button" aria-label={`plus ${inc}`} onClick={() => step(inc)}>+</button>
    </div>
  );
}

export function ScoreForm({ drill, level, onSave, saveLabel = 'Save result', extraActions, lastSpeed }: {
  drill: Drill;
  level: Level;
  onSave: (values: Record<string, number[]>, extras: ResultExtras) => void;
  saveLabel?: string;
  extraActions?: ComponentChildren;
  lastSpeed?: GreenSpeed;
}) {
  const rounds = Math.max(1, drill.rounds);
  const [values, setValues] = useState<Values>({});
  const [note, setNote] = useState('');
  const [hard, setHard] = useState(false);
  const [speed, setSpeed] = useState<GreenSpeed | undefined>(lastSpeed);
  const entered = drill.metrics.filter((m) => !isComputed(m));
  const unscored = drill.metrics.length === 0;

  const clean = (): Record<string, number[]> =>
    Object.fromEntries(
      Object.entries(values)
        .map(([k, vs]) => [k, vs.filter((v): v is number => v !== undefined)])
        .filter(([, vs]) => (vs as number[]).length),
    );
  const preview: Result = { id: '', drillId: drill.id, date: '', level, values: clean() };
  const pass = hard ? null : passed(drill, preview, level);
  const anyEntered = Object.keys(preview.values).length > 0;

  const set = (id: string, round: number, v: number | undefined) =>
    setValues((s) => {
      const arr = [...(s[id] ?? [])];
      arr[round] = v;
      return { ...s, [id]: arr };
    });

  return (
    <form
      class="score-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (anyEntered || unscored) onSave(clean(), { note: note.trim() || undefined, hard: hard || undefined, speed });
      }}
    >
      {entered.map((m) => (
        <div class={'metric-row' + (rounds === 1 ? ' inline' : '')}>
          <div class="metric-head">
            <span class="metric-label">{m.label}</span>
            {!hard && formatTarget(m, level) && <span class="target-chip">Target {formatTarget(m, level)}</span>}
          </div>
          {Array.from({ length: rounds }, (_, r) => (
            <div class="round-row">
              {rounds > 1 && <span class="round-label">Round {r + 1}</span>}
              <NumberField metric={m} value={values[m.id]?.[r]} onChange={(v) => set(m.id, r, v)} />
            </div>
          ))}
        </div>
      ))}

      {anyEntered && (
        <div class="card preview">
          {drill.metrics.filter((m) => isComputed(m) || rounds > 1 || m.par !== undefined || m.targets).map((m) => {
            const v = metricValue(drill, m, preview);
            const ok = hard ? null : meetsTarget(m, v, level);
            const par = formatPar(m, v);
            const t = !hard && isComputed(m) ? formatTarget(m, level) : null;
            return (
              <div class="kv">
                <span>
                  {m.label}
                  {rounds > 1 && !isComputed(m) && m.aggregate && m.aggregate !== 'sum' ? ` (${m.aggregate === 'avg' ? 'average' : m.aggregate + ' round'})` : ''}
                  {t && <span class="muted small"> · target {t}</span>}
                </span>
                <b class={ok === true ? 'good' : ok === false ? 'bad' : ''}>
                  {formatValue(drill, m, v)}
                  {par && <span class={'par ' + (parIsGood(m, v!) ? 'good' : 'bad')}> {par}</span>}
                </b>
              </div>
            );
          })}
          {pass !== null && <div class={'verdict ' + (pass ? 'good' : 'bad')}>{pass ? 'Pass at your level ✓' : 'Not a pass yet'}</div>}
        </div>
      )}

      {!unscored && (
        <div class="card options">
          <div class="kv">
            <span>Green speed</span>
            <div class="seg small">
              {SPEEDS.map((s) => (
                <button type="button" class={speed === s.id ? 'on' : ''} onClick={() => setSpeed(speed === s.id ? undefined : s.id)}>{s.label}</button>
              ))}
            </div>
          </div>
          {drill.hardMode && (
            <label class="toggle">
              <input type="checkbox" checked={hard} onChange={(e) => setHard((e.target as HTMLInputElement).checked)} />
              <span>Hard mode <span class="muted small">({drill.hardMode.replace(/\.$/, '')})</span></span>
            </label>
          )}
        </div>
      )}

      <label class="field">
        <span>Note (optional)</span>
        <textarea rows={2} value={note} placeholder="How it felt, what to work on…" onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} />
      </label>

      <div class="actions">
        {extraActions}
        <button class="btn primary" type="submit" disabled={!anyEntered && !unscored}>{unscored ? (saveLabel === 'Save result' ? 'Mark done' : saveLabel.replace('Save', 'Done')) : saveLabel}</button>
      </div>
    </form>
  );
}
