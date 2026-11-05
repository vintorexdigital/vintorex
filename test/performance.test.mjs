import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { once } from 'node:events';
import { gunzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { sendAsset } from '../server/http-response.mjs';

async function response({ encoding = 'gzip', method = 'GET', etag } = {}) {
  const payload = Buffer.from(JSON.stringify({ text: 'Sample catalog record ₹ '.repeat(200) }));
  const chunks = [];
  const res = new Writable({ write(chunk, _, done) { chunks.push(chunk); done(); } });
  res.writeHead = (status, headers) => { res.status = status; res.headers = headers; };
  const finished = once(res, 'finish');
  let opened = false;
  sendAsset({ method, headers: { 'accept-encoding': encoding, 'if-none-match': etag } }, res, 200,
    { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ETag: '"test"' },
    payload.length, () => { opened = true; return Readable.from([payload]); });
  await finished;
  return { res, payload, body: Buffer.concat(chunks), opened };
}

test('large JSON compresses losslessly and remains private', async () => {
  const { res, body, payload } = await response();
  assert.equal(res.headers['Content-Encoding'], 'gzip');
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.headers.Vary, 'Accept-Encoding');
  assert.deepEqual(gunzipSync(body), payload);
  assert.ok(body.length < payload.length / 2);
});
test('disabled gzip, HEAD and conditional responses preserve HTTP semantics', async () => {
  const plain = await response({ encoding: 'gzip;q=0' });
  assert.equal(plain.res.headers['Content-Encoding'], undefined);
  assert.equal(plain.res.headers['Content-Length'], plain.payload.length);
  assert.deepEqual(plain.body, plain.payload);
  for (const options of [{ method: 'HEAD' }, { etag: '"test"' }]) {
    const result = await response(options);
    assert.equal(result.body.length, 0);
    assert.equal(result.opened, false);
    assert.equal(result.res.status, options.etag ? 304 : 200);
  }
});
test('storefront initial imports exclude server seed catalogs and full legal documents', async () => {
  const visited = new Set();
  async function visit(url) {
    if (visited.has(url.href)) return;
    visited.add(url.href);
    const code = await readFile(url, 'utf8');
    for (const match of code.matchAll(/(?:import|export)\s+(?:[^;'"\n]*?\s+from\s*)?['"](\.[^'"]+)['"]/g)) {
      await visit(new URL(match[1], url));
    }
  }
  await visit(new URL('../dist/js/main.js', import.meta.url));
  for (const file of ['data.js', 'services.js', 'ai-services.js', 'policies.js']) {
    assert.equal(visited.has(new URL('../dist/js/' + file, import.meta.url).href), false, file);
  }
});
