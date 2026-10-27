export type Level = 'beginner' | 'low' | 'tour';
export type Discipline = 'putting' | 'chipping';

export const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Beginner / mid', hint: '≈ 15–28 HCP' },
  { id: 'low', label: 'Low single digit', hint: '≈ 0–5 HCP' },
  { id: 'tour', label: 'Tour', hint: 'PGA / DP World Tour' },
];

export interface Metric {
  id: string;
  label: string;
  kind: 'count' | 'number' | 'boolean';
  unit?: string;
  max?: number;
  better: 'higher' | 'lower' | 'none';
  /** How per-round values combine into the session value. Defaults to 'sum'. */
  aggregate?: 'sum' | 'avg' | 'best' | 'worst';
  /** Computed metric: sum of other metrics' session values. */
  sumOf?: string[];
  /** Reference value; the difference is shown next to the score (e.g. vs par / Tour). */
  par?: number;
  targets?: Partial<Record<Level, number>>;
}

export interface Drill {
  id: string;
  number?: number;
  name: string;
  discipline: Discipline;
  category: string;
  minutes: number;
  warmup: boolean;
  rounds: number;
  summary: string;
  equipment: string;
  metrics: Metric[];
  /** Full instructions in Markdown. */
  content: string;
  builtin?: boolean;
}

export interface Result {
  id: string;
  drillId: string;
  /** ISO timestamp */
  date: string;
  /** Entered values per metric, one per round. Computed metrics are not stored. */
  values: Record<string, number[]>;
  level: Level;
  note?: string;
  sessionId?: string;
}

export interface Session {
  id: string;
  date: string;
  plannedMinutes: number;
  drillIds: string[];
  /** Seconds from start to finish */
  duration?: number;
}

/** A practice session in progress; persisted so it survives iOS closing the app. */
export interface ActiveSession {
  session: Session;
  index: number;
  startedAt: number;
  drillStartedAt: number;
  resultIds: string[];
}

export interface Settings {
  level: Level;
}

export interface AppData {
  drills: Drill[];
  results: Result[];
  sessions: Session[];
  settings: Settings;
  /** Built-in drill ids the user deleted, so library updates don't bring them back. */
  removedBuiltins: string[];
  libraryVersion: number;
  active?: ActiveSession;
}
