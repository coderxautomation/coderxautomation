const fs = require('fs');
const path = require('path');

const root = process.cwd();
const readmePath = path.join(root, 'README.md');
const dataPath = path.join(root, 'NOW_BUILDING.json');

const START = '<!-- NOW_BUILDING_START -->';
const END = '<!-- NOW_BUILDING_END -->';

const readme = fs.readFileSync(readmePath, 'utf8');
const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const lines = items.map((p) =>
  `- **${p.code} - ${p.name}** (${p.status})\\n  - ${p.summary}`
);

const block = `${START}\n${lines.join('\n')}\n${END}`;

if (!readme.includes(START) || !readme.includes(END)) {
  throw new Error('README markers for NOW_BUILDING not found');
}

const next = readme.replace(new RegExp(`${START}[\\s\\S]*?${END}`, 'm'), block);
fs.writeFileSync(readmePath, next);
console.log('Updated README now-building block.');
