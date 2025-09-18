import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const siteDir = resolve(rootDir, 'site');
const appDir = resolve(siteDir, 'app');

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function copyAsset(relativeSource, relativeTarget) {
  const source = resolve(rootDir, relativeSource);
  const target = resolve(appDir, relativeTarget);
  await cp(source, target, { recursive: true });
}

async function validateNodes() {
  const schema = resolve(rootDir, 'schemas/codex_144_nodes_template.json');
  const data = resolve(rootDir, 'data/nodes.json');
  await execFileAsync('npx', ['ajv', '-s', schema, '-d', data, '--spec=draft2020'], { stdio: 'inherit' });
}

async function build() {
  await rm(siteDir, { recursive: true, force: true });
  await ensureDir(appDir);
  await validateNodes();
  const copies = [
    ['index.html', 'index.html'],
    ['style.css', 'style.css'],
    ['manifest.webmanifest', 'manifest.webmanifest'],
    ['service-worker.js', 'service-worker.js'],
    ['data', 'data'],
    ['js', 'js'],
    ['img', 'img'],
    ['labs', 'labs']
  ];
  for (const [src, dest] of copies) {
    await copyAsset(src, dest);
  }
  console.log('Site build complete: site/app');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exitCode = 1;
});
