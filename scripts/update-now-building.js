const fs = require('fs');
const path = require('path');

const root = process.cwd();
const readmePath = path.join(root, 'README.md');
const nowBuildingPath = path.join(root, 'NOW_BUILDING.json');
const queuePath = path.join(root, 'PROJECT_QUEUE.json');

const START = '<!-- NOW_BUILDING_START -->';
const END = '<!-- NOW_BUILDING_END -->';

function loadQueueItems() {
  if (!fs.existsSync(queuePath)) return null;

  const q = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  const queue = Array.isArray(q.queue) ? q.queue : [];
  const active = q.active;

  const activeItems = [];
  if (active && active.id && active.name) {
    activeItems.push({
      code: active.id,
      name: active.name,
      status: 'Active',
      summary: active.notes || `Current active ${active.type || 'project'} in pipeline.`,
    });
  }

  const candidates = queue.filter((p) => !['completed', 'done'].includes(String(p.status || '').toLowerCase()));
  const queuedItems = candidates.slice(0, 3).map((p) => ({
    code: p.id,
    name: p.name,
    status: p.status || 'Queued',
    summary: p.notes || `Upcoming ${p.type || 'project'} (${p.priority || 'normal'} priority).`,
  }));

  const items = [...activeItems, ...queuedItems].slice(0, 3);

  if (items.length === 0) {
    const latestDone = queue
      .filter((p) => ['completed', 'done'].includes(String(p.status || '').toLowerCase()))
      .slice(-3)
      .reverse()
      .map((p) => ({
        code: p.id,
        name: p.name,
        status: 'Recently shipped',
        summary: p.notes || 'Recently completed and delivered.',
      }));

    return latestDone.length
      ? latestDone
      : [{ code: 'PIPELINE', name: 'No queued items yet', status: 'Idle', summary: 'Add projects to PROJECT_QUEUE.json to auto-populate this section.' }];
  }

  return items;
}

function loadFallbackItems() {
  return JSON.parse(fs.readFileSync(nowBuildingPath, 'utf8'));
}

const readme = fs.readFileSync(readmePath, 'utf8');
let items;

try {
  items = loadQueueItems() || loadFallbackItems();
} catch {
  items = loadFallbackItems();
}

const lines = items.map((p) => `- **${p.code} - ${p.name}** (${p.status})\n  - ${p.summary}`);
const block = `${START}\n${lines.join('\n')}\n${END}`;

if (!readme.includes(START) || !readme.includes(END)) {
  throw new Error('README markers for NOW_BUILDING not found');
}

const next = readme.replace(new RegExp(`${START}[\\s\\S]*?${END}`, 'm'), block);
fs.writeFileSync(readmePath, next);
console.log('Updated README now-building block from project pipeline data.');
