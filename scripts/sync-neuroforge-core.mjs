import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const metadataURL = new URL('../vendor/neuroforge-core/SOURCE.json', import.meta.url);
const targetURL = new URL('../vendor/neuroforge-core/index.mjs', import.meta.url);
const metadata = JSON.parse(await readFile(metadataURL, 'utf8'));
const rawURL = `https://raw.githubusercontent.com/bizc0m/Nyx2Brands/${metadata.commit}/${metadata.path}`;
const response = await fetch(rawURL);

if (!response.ok) throw new Error(`NeuroForge download failed: HTTP ${response.status}`);

const source = await response.text();
const sha256 = createHash('sha256').update(source).digest('hex');

if (sha256 !== metadata.sha256) {
  throw new Error(`NeuroForge checksum mismatch: ${sha256}`);
}

await writeFile(targetURL, source);
console.log(`NeuroForge core synchronized at ${metadata.commit}`);
