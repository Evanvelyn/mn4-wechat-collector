import { mkdir, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const output = `dist/mn4-wechat-collector-v${packageJson.version}.zip`;
const files = [
  'manifest.json',
  'src',
  'README.md',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  'CHANGELOG.md',
  'SPEC.md',
  'docs',
];
const result = spawnSync('zip', ['-r', output, ...files], { stdio: 'inherit' });

if (result.status !== 0) {
  throw new Error('zip packaging failed');
}

console.log(`Created ${output}`);
