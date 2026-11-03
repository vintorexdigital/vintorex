import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { legacyUrl } from '../dist/js/router.js';
import { clientIp } from '../server/client-ip.mjs';
import { verifySignature } from '../server/whatsapp/webhook.mjs';

test('forwarded IPs require an explicitly trusted local proxy', t => {
  const original = process.env.TRUST_LOCAL_PROXY;
  t.after(() => {
    if (original === undefined) delete process.env.TRUST_LOCAL_PROXY;
    else process.env.TRUST_LOCAL_PROXY = original;
  });
  const request = { socket: { remoteAddress: '127.0.0.1' }, headers: { 'x-forwarded-for': '192.0.2.1, 192.0.2.2' } };
  delete process.env.TRUST_LOCAL_PROXY;
  assert.equal(clientIp(request), '127.0.0.1');
  process.env.TRUST_LOCAL_PROXY = '1';
  assert.equal(clientIp(request), '192.0.2.2');
  request.socket.remoteAddress = '198.51.100.1';
  assert.equal(clientIp(request), '198.51.100.1');
});

test('webhook rejects a valid digest with trailing malformed bytes', () => {
  const raw = Buffer.from('{}');
  const signature = 'sha256=' + createHmac('sha256', 'test').update(raw).digest('hex');
  assert.equal(verifySignature(raw, signature + 'zz', 'test'), false);
});

test('legacy routes only redirect within this website', () => {
  assert.equal(legacyUrl('#//example.org'), null);
  assert.equal(legacyUrl('#/\\example.org'), null);
  assert.equal(legacyUrl('#/\t/example.org'), null);
  assert.equal(legacyUrl('#/contact'), '/contact');
});
