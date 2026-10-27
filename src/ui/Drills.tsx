import { useState } from 'preact/hooks';
import { navigate } from '../router';
import { useStore } from '../store';
import type { Discipline } from '../types';
import { DrillRow, Empty, Header } from './common';

export function Drills() {
  const { drills, results, settings } = useStore();
  const [q, setQ] = useState('');
  const [disc, setDisc] = useState<Discipline | 'all'>('all');
  const [warmOnly, setWarmOnly] = useState(false);

  const hasChipping = drills.some((d) => d.discipline === 'chipping');
  const shown = drills.filter(
    (d) =>
      (disc === 'all' || d.discipline === disc) &&
      (!warmOnly || d.warmup) &&
      (!q || `${d.name} ${d.category} ${d.summary}`.toLowerCase().includes(q.toLowerCase())),
  );
  const cats = [...new Set(shown.map((d) => d.category))];

  return (
    <div class="page">
      <Header title="Drills" right={<button class="link" onClick={() => navigate('/drill-new')}>+ New</button>} />
      <input class="search" type="search" placeholder="Search drills" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
      <div class="chips">
        {hasChipping && (['all', 'putting', 'chipping'] as const).map((d) => (
          <button class={'chip ' + (disc === d ? 'on' : '')} onClick={() => setDisc(d)}>{d === 'all' ? 'All' : d[0].toUpperCase() + d.slice(1)}</button>
        ))}
        <button class={'chip ' + (warmOnly ? 'on' : '')} onClick={() => setWarmOnly(!warmOnly)}>Warm-ups</button>
      </div>
      {shown.length === 0 && <Empty>No drills match.</Empty>}
      {cats.map((c) => (
        <section>
          <h2>{c}</h2>
          <div class="list">
            {shown.filter((d) => d.category === c).map((d) => (
              <DrillRow drill={d} results={results} level={settings.level} onClick={() => navigate(`/drill/${d.id}`)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
