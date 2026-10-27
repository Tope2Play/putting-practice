import { useEffect, useState } from 'preact/hooks';
import library from './data/library.json';
import type { ActiveSession, AppData, Drill, Result, Session, Settings } from './types';

const KEY = 'putting-practice:v1';
const builtinDrills = library.drills as Drill[];

function fresh(): AppData {
  return {
    drills: structuredClone(builtinDrills),
    results: [],
    sessions: [],
    settings: { level: 'beginner' },
    removedBuiltins: [],
    libraryVersion: library.version,
  };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const data = { ...fresh(), ...JSON.parse(raw) } as AppData;
    return mergeLibrary(data);
  } catch {
    return fresh();
  }
}

/** Adds built-in drills shipped in a newer app version, without touching the user's edited copies. */
function mergeLibrary(data: AppData): AppData {
  if (data.libraryVersion >= library.version) return data;
  const have = new Set(data.drills.map((d) => d.id));
  const added = builtinDrills.filter((d) => !have.has(d.id) && !data.removedBuiltins.includes(d.id));
  return { ...data, drills: [...data.drills, ...structuredClone(added)], libraryVersion: library.version };
}

let state: AppData = load();
const listeners = new Set<() => void>();

function commit(next: AppData) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked; keep working in memory.
  }
  listeners.forEach((l) => l());
}

// Ask iOS/Safari not to evict our data under storage pressure.
navigator.storage?.persist?.().catch(() => {});

export function useStore(): AppData {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);
  return state;
}

export const getState = () => state;

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const actions = {
  saveDrill(drill: Drill) {
    const exists = state.drills.some((d) => d.id === drill.id);
    commit({
      ...state,
      drills: exists ? state.drills.map((d) => (d.id === drill.id ? drill : d)) : [...state.drills, drill],
    });
  },
  deleteDrill(id: string) {
    const d = state.drills.find((x) => x.id === id);
    commit({
      ...state,
      drills: state.drills.filter((x) => x.id !== id),
      removedBuiltins: d?.builtin ? [...state.removedBuiltins, id] : state.removedBuiltins,
    });
  },
  addResult(r: Result) {
    commit({ ...state, results: [...state.results, r] });
  },
  deleteResult(id: string) {
    commit({ ...state, results: state.results.filter((r) => r.id !== id) });
  },
  saveSession(s: Session) {
    const exists = state.sessions.some((x) => x.id === s.id);
    commit({ ...state, sessions: exists ? state.sessions.map((x) => (x.id === s.id ? s : x)) : [...state.sessions, s] });
  },
  setActive(active: ActiveSession | undefined) {
    commit({ ...state, active });
  },
  updateSettings(patch: Partial<Settings>) {
    commit({ ...state, settings: { ...state.settings, ...patch } });
  },
  restoreBuiltins() {
    commit(mergeLibrary({ ...state, removedBuiltins: [], libraryVersion: 0 }));
  },
  /** Full backup restore. */
  replaceAll(data: AppData) {
    commit(mergeLibrary({ ...fresh(), ...data }));
  },
  /** Adds drills from a shared file; drills with an existing id are overwritten. */
  importDrills(drills: Drill[]) {
    const ids = new Set(drills.map((d) => d.id));
    commit({ ...state, drills: [...state.drills.filter((d) => !ids.has(d.id)), ...drills] });
  },
  resetAll() {
    commit(fresh());
  },
};

export const guide = library.guide;
