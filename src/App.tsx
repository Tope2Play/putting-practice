import { match, navigate, useRoute } from './router';
import { useStore } from './store';
import { DrillDetail } from './ui/DrillDetail';
import { DrillEditor } from './ui/DrillEditor';
import { Drills } from './ui/Drills';
import { History } from './ui/History';
import { Home } from './ui/Home';
import { LogResult } from './ui/LogResult';
import { Plan } from './ui/Plan';
import { SessionRunner } from './ui/Session';
import { Guide, Settings } from './ui/Settings';

const TABS = [
  { path: '/', label: 'Home', icon: '⛳' },
  { path: '/drills', label: 'Drills', icon: '📋' },
  { path: '/history', label: 'History', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙︎' },
];

function screen(path: string) {
  let m;
  if (path === '/') return <Home />;
  if (path === '/plan') return <Plan />;
  if (path === '/session') return <SessionRunner />;
  if (path === '/drills') return <Drills />;
  if (path === '/drill-new') return <DrillEditor />;
  if ((m = match('/drill/:id/edit', path))) return <DrillEditor id={m.id} key={m.id} />;
  if ((m = match('/drill/:id', path))) return <DrillDetail id={m.id} />;
  if ((m = match('/log/:id', path))) return <LogResult id={m.id} key={m.id} />;
  if (path === '/history') return <History />;
  if (path === '/settings') return <Settings />;
  if (path === '/guide') return <Guide />;
  return <Home />;
}

export function App() {
  const path = useRoute();
  const { active } = useStore();
  const tab = TABS.slice(1).find((t) => path.startsWith(t.path) || (t.path === '/drills' && /^\/(drill|log)/.test(path)))?.path ?? '/';
  return (
    <>
      <main>{screen(path)}</main>
      {path !== '/session' && (
        <nav class="tabs">
          {TABS.map((t) => (
            <button class={tab === t.path ? 'on' : ''} onClick={() => navigate(t.path)}>
              <span class="ti">{t.icon}</span>
              <span>{t.label}</span>
              {t.path === '/' && active && <i class="dot-live" />}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
