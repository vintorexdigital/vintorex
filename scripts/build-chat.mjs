// Embeds the chat assistant's knowledge (server/knowledge.mjs) with Cloudflare Workers AI
// and saves the vectors to server/chat-vectors.json, so the server starts ready.
// Only new or changed chunks are sent: a full build costs under 100 of the 10,000
// neurons Cloudflare gives every account free each day, and a no-op build costs none.
//
// Usage: npm run build:chat   (needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN; see README)
// Output is deterministic, so re-running without content changes leaves git clean.
import '../server/env.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { buildChunks } from '../server/knowledge.mjs';
import { AI_ON, EMBED_MODEL, embed, pack, chunkKey, chunkText, neuronsToday } from '../server/chat.mjs';

const FILE = new URL('../server/chat-vectors.json', import.meta.url);
if (!AI_ON) {
  console.error('Chat build needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env or the environment (README → Chat assistant).');
  process.exit(1);
}

let saved = {};
try {
  const file = JSON.parse(await readFile(FILE, 'utf8'));
  if (file.model === EMBED_MODEL) saved = file.vectors;
} catch { /* first build */ }

const chunks = buildChunks();
const vectors = {};
const todo = [];
for (const c of chunks) {
  const key = chunkKey(c);
  if (saved[key]) vectors[key] = saved[key];
  else todo.push(c);
}
for (let i = 0; i < todo.length; i += 50) {
  const batch = todo.slice(i, i + 50);
  const data = await embed(batch.map(chunkText));
  batch.forEach((c, j) => { vectors[chunkKey(c)] = pack(data[j]); });
  console.log(`Embedded ${Math.min(i + 50, todo.length)} of ${todo.length} new or changed chunks`);
}

const lines = Object.keys(vectors).sort().map(k => `    ${JSON.stringify(k)}: ${JSON.stringify(vectors[k])}`);
await writeFile(FILE, `{\n  "model": ${JSON.stringify(EMBED_MODEL)},\n  "vectors": {\n${lines.join(',\n')}\n  }\n}\n`);
const removed = Object.keys(saved).filter(k => !vectors[k]).length;
console.log(`Chat knowledge: ${chunks.length} chunks, ${todo.length} embedded, ${removed} removed, about ${neuronsToday().toFixed(1)} neurons used. Saved server/chat-vectors.json`);
