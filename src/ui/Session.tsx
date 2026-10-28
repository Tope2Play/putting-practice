import { useEffect, useState } from 'preact/hooks';
import { navigate } from '../router';
import { formatValue, metricValue, newBests, passed, primaryMetric } from '../scoring';
import { actions, uid, useStore } from '../store';
import type { Result } from '../types';
import { Caller, Empty, Header, lastSpeed } from './common';
import { Markdown } from './Markdown';
import { ScoreForm } from './ScoreForm';

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function SessionRunner() {
  const data = useStore();
  const active = data.active;
  const now = useNow();
  const [doneId, setDoneId] = useState<string | null>(null);

  if (!active) {
    const finished = doneId && data.sessions.find((s) => s.id === doneId);
    return finished ? <Summary sessionId={finished.id} /> : (
      <div class="page"><Header title="Session" backTo="/" /><Empty>No session running. <a href="#/plan">Plan one</a>.</Empty></div>
    );
  }

  const { session, index } = active;
  const drill = data.drills.find((d) => d.id === session.drillIds[index]);
  const finish = () => {
    actions.saveSession({ ...session, duration: Math.round((Date.now() - active.startedAt) / 1000) });
    actions.setActive(undefined);
    setDoneId(session.id);
  };
  const next = (resultIds: string[]) => {
    if (index + 1 >= session.drillIds.length) return finish();
    actions.setActive({ ...active, index: index + 1, drillStartedAt: Date.now(), resultIds });
    window.scrollTo(0, 0);
  };

  if (!drill) {
    // Drill was deleted mid-session.
    return <div class="page"><Empty>This drill no longer exists.</Empty><button class="btn primary big" onClick={() => next(active.resultIds)}>Next</button></div>;
  }

  const planned = drill.minutes * 60e3;
  const elapsed = now - active.drillStartedAt;

  return (
    <div class="page">
      <Header title={`Drill ${index + 1} of ${session.drillIds.length}`} backTo="/"
        right={<button class="link" onClick={() => confirm('End the session now? Logged results are kept.') && finish()}>End</button>} />
      <div class="progress"><div style={{ width: `${(index / session.drillIds.length) * 100}%` }} /></div>

      <div class="timer-row">
        <div class={'timer ' + (elapsed > planned ? 'over' : '')}>
          <b>{mmss(elapsed)}</b><span>of {drill.minutes}:00</span>
        </div>
        <div class="timer subtle"><b>{mmss(now - active.startedAt)}</b><span>session</span></div>
      </div>

      <h1 class="title">{drill.name}</h1>
      <p class="muted">{drill.category}{drill.warmup && <span class="tag warm">warm-up</span>}</p>
      {drill.summary && <p>{drill.summary}</p>}
      {drill.equipment && <p class="small"><b>Equipment:</b> {drill.equipment}</p>}

      <details class="card" open={drill.metrics.length === 0}>
        <summary>Instructions</summary>
        <Markdown text={drill.content} />
      </details>

      {drill.caller && <Caller caller={drill.caller} key={drill.id + index} />}

      <h2>{drill.metrics.length ? 'Your score' : 'When you’re done'}</h2>
      <ScoreForm
        key={drill.id + index}
        drill={drill}
        level={data.settings.level}
        lastSpeed={lastSpeed(data.results)}
        saveLabel={index + 1 >= session.drillIds.length ? 'Save & finish' : 'Save & next'}
        onSave={(values, extras) => {
          const r: Result = { id: uid(), drillId: drill.id, date: new Date().toISOString(), values, level: data.settings.level, ...extras, sessionId: session.id };
          actions.addResult(r);
          next([...active.resultIds, r.id]);
        }}
        extraActions={<button type="button" class="btn" onClick={() => next(active.resultIds)}>Skip</button>}
      />
    </div>
  );
}

function Summary({ sessionId }: { sessionId: string }) {
  const { sessions, results, drills } = useStore();
  const s = sessions.find((x) => x.id === sessionId)!;
  const rs = results.filter((r) => r.sessionId === sessionId);
  return (
    <div class="page">
      <Header title="Session done" />
      <div class="stats">
        <div class="stat"><b>{rs.length}</b><span>drills logged</span></div>
        <div class="stat"><b>{Math.round((s.duration ?? 0) / 60)}</b><span>minutes</span></div>
        <div class="stat"><b>{rs.filter((r) => { const d = drills.find((x) => x.id === r.drillId); return d && passed(d, r, r.level); }).length}</b><span>passes</span></div>
      </div>
      <div class="list">
        {rs.map((r) => {
          const d = drills.find((x) => x.id === r.drillId);
          if (!d) return null;
          const pm = primaryMetric(d);
          const ok = passed(d, r, r.level);
          const pbs = newBests(d, results, r);
          return (
            <div class="row">
              <div class="row-main">
                <div class="row-title">{d.name}{pbs.length > 0 && <span class="tag pb">★ New best</span>}</div>
                <div class="row-sub">{pm && `${pm.label}: ${formatValue(d, pm, metricValue(d, pm, r))}`}</div>
              </div>
              {ok !== null && <span class={'badge ' + (ok ? 'good' : 'bad')}>{ok ? 'Pass' : 'Miss'}</span>}
            </div>
          );
        })}
      </div>
      <button class="btn primary big" onClick={() => navigate('/', true)}>Done</button>
    </div>
  );
}
