// Makes the WebP copies that js/images.js expects next to every photograph: `name-480.webp`, `name-800.webp`,
// `name-1200.webp` and `name-1600.webp` (never wider than the original). Also converts the header background.
// Run after adding or replacing a JPEG:  npm run build:images:webp      (needs cwebp: brew install webp)
// Check without converting:              node scripts/optimize-images.mjs --check
// Copies are committed with the JPEGs, so the production server never needs cwebp.
import { readdir, readFile, stat, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_WIDTHS, variantPath } from '../dist/js/images.js';

const run = promisify(execFile);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const IMG = join(ROOT, 'dist', 'images');
const CHECK = process.argv.includes('--check');
const QUALITY = 78;

// Photograph folders plus single files that carry the same responsive markup.
const FOLDERS = ['blog', 'services', 'shop', 'work'];
const FILES = ['about-studio.jpg'];
// Background images used from CSS: one WebP copy at the original size.
const BACKGROUNDS = ['header-waves.png'];

const PHOTOGRAPHS = [];
for (const folder of FOLDERS) {
  for (const name of (await readdir(join(IMG, folder)).catch(() => [])).sort()) {
    if (/\.jpe?g$/i.test(name)) PHOTOGRAPHS.push(join(IMG, folder, name));
  }
}
for (const name of FILES) PHOTOGRAPHS.push(join(IMG, name));

// Width in pixels from the PNG or JPEG header, with no image library.
async function pixelWidth(file) {
  const buffer = await readFile(file);
  if (buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') return buffer.readUInt32BE(16);
  let i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) { i++; continue; }
    const marker = buffer[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return buffer.readUInt16BE(i + 7);
    i += 2 + buffer.readUInt16BE(i + 2);
  }
  return 1600;
}

const fresh = async (source, target) => {
  const [a, b] = await Promise.all([stat(source), stat(target).catch(() => null)]);
  return Boolean(b) && b.mtimeMs >= a.mtimeMs;
};

let made = 0, missing = 0, skipped = 0;
const jobs = [];
for (const source of PHOTOGRAPHS) {
  const sourceWidth = await pixelWidth(source);
  for (const width of IMAGE_WIDTHS.filter(w => w <= sourceWidth || w === IMAGE_WIDTHS.find(x => x >= sourceWidth))) {
    const target = variantPath(source, width);
    if (await fresh(source, target)) { skipped++; continue; }
    if (CHECK) { missing++; console.log('missing ' + target.slice(ROOT.length)); continue; }
    // Below the source width, resize; at or above it, keep the source size (the descriptor rounds up, never upscale).
    const args = ['-quiet', '-q', String(QUALITY), '-m', '4', '-sharp_yuv', '-metadata', 'none'];
    if (width < sourceWidth) args.push('-resize', String(width), '0');
    jobs.push({ source, target, args });
  }
}
for (const name of BACKGROUNDS) {
  const source = join(IMG, name);
  const target = join(IMG, basename(name, extname(name)) + '.webp');
  if (await fresh(source, target)) { skipped++; continue; }
  if (CHECK) { missing++; console.log('missing ' + target.slice(ROOT.length)); continue; }
  jobs.push({ source, target, args: ['-quiet', '-q', '82', '-m', '6', '-metadata', 'none'] });
}

if (CHECK) {
  if (missing) { console.error(`${missing} WebP copies are missing. Run: npm run build:images:webp`); process.exit(1); }
  console.log(`OK: every photograph has its ${IMAGE_WIDTHS.join('/')} WebP copies (${skipped} files).`);
  process.exit(0);
}

// A few conversions at a time keeps the machine responsive.
const PARALLEL = 4;
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const { source, target, args } = jobs[next++];
    await mkdir(dirname(target), { recursive: true });
    await run('cwebp', [...args, source, '-o', target]);
    made++;
  }
}
try {
  await Promise.all(Array.from({ length: PARALLEL }, worker));
} catch (error) {
  if (error.code === 'ENOENT') { console.error('cwebp was not found. Install it with: brew install webp  (or apt install webp)'); process.exit(1); }
  throw error;
}
console.log(`WebP copies: ${made} made, ${skipped} already current.`);
