import { useState } from 'preact/hooks';
import { navigate } from '../router';
import { newBests, passed } from '../scoring';
import { actions, uid, useStore } from '../store';
import type { Result } from '../types';
import { Caller, Empty, Header, lastSpeed } from './common';
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
          <h1>{pbs.length ? 'New personal best!' : ok ? 'Pass at your level' : drill.metrics.length ? 'Result saved' : 'Warm-up done'}</h1>
          {saved.hard && <p class="muted">Logged as Hard mode (not counted for high scores).</p>}
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
      <details class="card" open={drill.metrics.length === 0}>
        <summary>Instructions</summary>
        <Markdown text={drill.content} />
      </details>
      {drill.caller && <Caller caller={drill.caller} />}
      <ScoreForm
        drill={drill}
        level={settings.level}
        lastSpeed={lastSpeed(results)}
        onSave={(values, extras) => {
          const r: Result = { id: uid(), drillId: drill.id, date: new Date().toISOString(), values, level: settings.level, ...extras };
          actions.addResult(r);
          setSaved(r);
        }}
      />
    </div>
  );
}
