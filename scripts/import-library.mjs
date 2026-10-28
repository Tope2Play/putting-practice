// Converts docs/warmup-and-games.md into src/data/library.json.
// Run with `npm run import-library` after editing the Markdown or scripts/games-meta.mjs,
// and bump LIBRARY_VERSION so installed apps pick up the change.
//
// Expected format: `## Warm-up …` / `## Games — <Category>` sections containing
// `### W1 · Name (7 min)` or `### G1 · Name` drills. (The previous 25-drill library and its
// scoring setup are kept in docs/archive and scripts/archive.)
import { readFileSync, writeFileSync } from 'node:fs';
import { meta } from './games-meta.mjs';

const LIBRARY_VERSION = 2;

const src = readFileSync(new URL('../docs/warmup-and-games.md', import.meta.url), 'utf8');
const lines = src.split('\n');

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const field = (md, label) => md.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]*)`))?.[1].trim() ?? '';
// Header line "**Skill:** x · **Time:** y · …" → { Skill: 'x', Time: 'y', … }
const headerFields = (line) =>
  Object.fromEntries([...line.matchAll(/\*\*([^*]+):\*\*\s*([^·*]+?)\s*(?=·|$)/g)].map((m) => [m[1], m[2].trim()]));

const drills = [];
const guide = [];
let category = null;
let current = null;
let inFence = false;

for (const line of lines) {
  if (line.startsWith('```')) inFence = !inFence;
  const h2 = !inFence && line.match(/^## (.+)$/);
  const h3 = !inFence && line.match(/^### ([WG]\d+) · (.+?)(?: \((\d+) min\))?$/);
  if (h2) {
    current = null;
    const games = h2[1].match(/^Games — (.+)$/);
    category = games ? games[1][0].toUpperCase() + games[1].slice(1) : h2[1].startsWith('Warm-up') ? 'Warm-up' : null;
    if (category) continue;
  }
  if (h3) {
    current = { code: h3[1], name: h3[2].trim(), category, body: [] };
    drills.push(current);
    continue;
  }
  if (current) current.body.push(line);
  else if (!category && !line.startsWith('# ') && !/^\w{3} \d+, \d{4} ·/.test(line)) guide.push(line);
}

const out = drills.map((d, i) => {
  const m = meta[d.code];
  if (!m) throw new Error(`No scoring meta for ${d.code}`);
  const raw = d.body.join('\n').trim();
  const headerLine = raw.split('\n').find((l) => l.startsWith('**Skill:**')) ?? '';
  const h = headerFields(headerLine);
  // The header line is shown as the summary and App input is handled by the app, so drop both from the text.
  const content = raw
    .split('\n')
    .filter((l) => !(headerLine && l === headerLine) && !l.startsWith('**App input:**'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const summary = d.code.startsWith('W')
    ? 'Unscored warm-up station.'
    : [h.Skill, h.Score && `Score: ${h.Score}`, h['Slope class'] && `Slope: ${h['Slope class']}`].filter(Boolean).join(' · ');
  return {
    id: `${d.code.toLowerCase()}-${slug(d.name).slice(0, 40)}`,
    number: i + 1,
    code: d.code,
    name: d.name,
    discipline: 'putting',
    category: d.category,
    minutes: m.minutes,
    warmup: !!m.warmup,
    rounds: m.rounds ?? 1,
    summary,
    equipment: field(content, 'Equipment'),
    hardMode: field(content, 'Hard mode') || undefined,
    caller: m.caller,
    metrics: m.metrics,
    content,
    builtin: true,
  };
});

writeFileSync(
  new URL('../src/data/library.json', import.meta.url),
  JSON.stringify({ version: LIBRARY_VERSION, guide: guide.join('\n').replace(/ The full 25-drill library.*$/m, '').trim(), drills: out }, null, 1) + '\n',
);
console.log(`Wrote ${out.length} drills`);
