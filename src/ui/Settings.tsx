import { navigate } from '../router';
import { pickJSON, shareJSON } from '../share';
import { actions, getState, guide, useStore } from '../store';
import { LEVELS, type AppData, type Drill } from '../types';
import { Header } from './common';
import { Markdown } from './Markdown';

const stamp = () => new Date().toISOString().slice(0, 10);

async function importFile() {
  try {
    const data = (await pickJSON()) as Partial<AppData> & { type?: string };
    if (data.type === 'drills' && Array.isArray(data.drills)) {
      actions.importDrills(data.drills as Drill[]);
      alert(`Imported ${data.drills.length} drill${data.drills.length > 1 ? 's' : ''}.`);
    } else if (Array.isArray(data.drills) && Array.isArray(data.results)) {
      if (confirm('Replace ALL data on this phone with this backup?')) {
        actions.replaceAll(data as AppData);
        alert('Backup restored.');
      }
    } else {
      alert('This file is not a Putting Practice backup or drill file.');
    }
  } catch (e) {
    alert((e as Error).message);
  }
}

export function Settings() {
  const { settings, drills, results, removedBuiltins } = useStore();
  const custom = drills.filter((d) => !d.builtin);

  return (
    <div class="page">
      <Header title="Settings" />

      <h2>My level</h2>
      <p class="small muted">Sets which targets count as a pass.</p>
      <div class="list">
        {LEVELS.map((l) => (
          <label class="row">
            <div class="row-main"><div class="row-title">{l.label}</div><div class="row-sub">{l.hint}</div></div>
            <input type="radio" name="level" checked={settings.level === l.id} onChange={() => actions.updateSettings({ level: l.id })} />
          </label>
        ))}
      </div>

      <h2>Backup</h2>
      <p class="small muted">Your data lives only on this phone. Export a backup now and then (save it to Files or iCloud Drive).</p>
      <div class="list">
        <button class="row" onClick={() => shareJSON(`putting-backup-${stamp()}.json`, getState())}>
          <div class="row-main"><div class="row-title">Export backup</div><div class="row-sub">{drills.length} drills · {results.length} results</div></div>
        </button>
        <button class="row" onClick={importFile}>
          <div class="row-main"><div class="row-title">Import backup or drills</div><div class="row-sub">A backup file, or a drill file shared by a friend</div></div>
        </button>
        {custom.length > 0 && (
          <button class="row" onClick={() => shareJSON(`my-drills-${stamp()}.json`, { type: 'drills', drills: custom })}>
            <div class="row-main"><div class="row-title">Share my drills</div><div class="row-sub">{custom.length} drill{custom.length > 1 ? 's' : ''} you created</div></div>
          </button>
        )}
      </div>

      <h2>Library</h2>
      <div class="list">
        <button class="row" onClick={() => navigate('/guide')}>
          <div class="row-main"><div class="row-title">Library guide & benchmarks</div><div class="row-sub">Setup rules, Tour make %, weekly plan</div></div>
          <span class="chev">›</span>
        </button>
        {removedBuiltins.length > 0 && (
          <button class="row" onClick={() => actions.restoreBuiltins()}>
            <div class="row-main"><div class="row-title">Restore deleted library drills</div><div class="row-sub">{removedBuiltins.length} deleted</div></div>
          </button>
        )}
        <button class="row danger" onClick={() => confirm('Delete all results and custom drills? This cannot be undone.') && actions.resetAll()}>
          <div class="row-main"><div class="row-title">Reset all data</div></div>
        </button>
      </div>

      <p class="small muted center">Putting Practice v{__APP_VERSION__}</p>
    </div>
  );
}

export function Guide() {
  return (
    <div class="page">
      <Header title="Library guide" backTo="/settings" />
      <Markdown text={guide} />
    </div>
  );
}
