// Converts docs/putting-drill-library.md into src/data/library.json.
// Run with `npm run import-library` after editing the Markdown or scripts/drill-meta.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { meta } from './drill-meta.mjs';

const src = readFileSync(new URL('../docs/putting-drill-library.md', import.meta.url), 'utf8');
const lines = src.split('\n');

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const firstSection = (md, label) => {
  const m = md.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]*)`));
  return m ? m[1].trim() : '';
};

const drills = [];
let guide = [];
let category = null;
let current = null;
let inFence = false;

for (const line of lines) {
  if (line.startsWith('```')) inFence = !inFence;
  const cat = !inFence && line.match(/^## Category \d+ — (.+)$/);
  const drill = !inFence && line.match(/^### Drill (\d+) — (.+)$/);
  const otherH2 = !inFence && !cat && line.startsWith('## ');

  if (cat) { category = cat[1].trim(); current = null; continue; }
  if (drill) {
    current = { num: Number(drill[1]), name: drill[2].trim(), category, body: [] };
    drills.push(current);
    continue;
  }
  if (otherH2) {
    current = null;
    // Everything outside drill sections (intro, benchmarks, weekly plan) becomes the library guide.
    if (!line.startsWith('## Sources')) category = null;
  }
  if (current) current.body.push(line);
  else if (!line.startsWith('# ') && !line.startsWith('Oct 27')) guide.push(line);
}

const out = drills.map((d) => {
  const m = meta[d.num];
  if (!m) throw new Error(`No scoring meta for drill ${d.num}`);
  const content = d.body.join('\n').trim();
  return {
    id: `putt-${String(d.num).padStart(2, '0')}-${slug(d.name).slice(0, 40)}`,
    number: d.num,
    name: d.name,
    discipline: 'putting',
    category: d.category,
    minutes: m.minutes,
    warmup: !!m.warmup,
    rounds: m.rounds ?? 1,
    summary: firstSection(content, 'What it trains'),
    equipment: firstSection(content, 'Equipment'),
    metrics: m.metrics,
    content,
    builtin: true,
  };
});

writeFileSync(
  new URL('../src/data/library.json', import.meta.url),
  JSON.stringify({ version: 1, guide: guide.join('\n').trim(), drills: out }, null, 1) + '\n',
);
console.log(`Wrote ${out.length} drills`);
