import { useState } from 'preact/hooks';
import { navigate } from '../router';
import { newBests, passed } from '../scoring';
import { actions, uid, useStore } from '../store';
import type { Result } from '../types';
import { Empty, Header } from './common';
import { Markdown } from './Markdown';
import { ScoreForm } from './ScoreForm';

export function LogResult({ id }: { id: string }) {
  const { drills, results, settings } = useStore();
  const drill = drills.find((d) => d.id === id);
  const [saved, setSaved] = useState<Result | null>(null);
  if (!drill) return <div class="page"><Header title="Log" backTo="/drills" /><Empty>Drill not found.</Empty></div>;

  if (saved) {
    const ok = passed(drill, saved, saved.level);
    const pbs = newBests(drill, results, saved);
    return (
      <div class="page">
        <Header title="Saved" />
        <div class="celebrate">
          <div class="big-emoji">{pbs.length ? '🏆' : ok ? '✅' : '⛳'}</div>
          <h1>{pbs.length ? 'New personal best!' : ok ? 'Pass at your level' : 'Result saved'}</h1>
          {pbs.map((m) => <p>{m.label}</p>)}
          {ok === false && <p class="muted">Keep at it — every logged score counts.</p>}
        </div>
        <button class="btn primary big" onClick={() => navigate(`/drill/${drill.id}`, true)}>See progress</button>
        <button class="btn big" onClick={() => setSaved(null)}>Log another round</button>
      </div>
    );
  }

  return (
    <div class="page">
      <Header title="Log result" backTo={`/drill/${drill.id}`} />
      <h1 class="title">{drill.name}</h1>
      <details class="card">
        <summary>Instructions</summary>
        <Markdown text={drill.content} />
      </details>
      <ScoreForm
        drill={drill}
        level={settings.level}
        onSave={(values, note) => {
          const r: Result = { id: uid(), drillId: drill.id, date: new Date().toISOString(), values, level: settings.level, note: note || undefined };
          actions.addResult(r);
          setSaved(r);
        }}
      />
    </div>
  );
}
