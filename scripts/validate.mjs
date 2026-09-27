import { access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
const required = [
  manifest.action?.default_popup,
  manifest.background?.service_worker,
  'src/popup/popup.css',
  'src/popup/popup.js',
];

if (manifest.manifest_version !== 3) {
  throw new Error('manifest_version must be 3');
}

for (const file of required) {
  if (!file) throw new Error('Manifest entry is missing');
  await access(file);
}

const scripts = [
  'src/background/service-worker.js',
  'src/popup/popup.js',
  'src/lib/search-parser.js',
  'src/lib/scoring.js',
  'src/lib/offline-html.js',
];

for (const script of scripts) {
  const result = spawnSync(process.execPath, ['--check', script], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Syntax check failed: ${script}`);
}

console.log(`Validated ${manifest.name} v${manifest.version}`);
