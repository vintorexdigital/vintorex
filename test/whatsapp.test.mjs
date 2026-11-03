// WhatsApp integration tests. No network: Graph API calls are replaced. Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';

Object.assign(process.env, {
  WHATSAPP_TOKEN: 'test-token', WHATSAPP_PHONE_NUMBER_ID: '111', WHATSAPP_WABA_ID: '222', META_APP_ID: 'app-1',
  META_APP_SECRET: 'app-secret', WEBHOOK_VERIFY_TOKEN: 'verify-me', WHATSAPP_API_KEY: 'k'.repeat(32),
  WHATSAPP_CREDIT_LINE_ID: 'credit-9', WHATSAPP_BOT: '',
});
const { normalizePhone, WhatsAppClient, exchangeCode } = await import('../server/whatsapp/client.mjs');
const { parseWebhook, verifySignature, bus } = await import('../server/whatsapp/webhook.mjs');
const { whatsappRoute } = await import('../server/whatsapp/routes.mjs');

const sign = body => 'sha256=' + createHmac('sha256', 'app-secret').update(body).digest('hex');
const inbound = {
  object: 'whatsapp_business_account',
  entry: [{ id: '222', changes: [{ field: 'messages', value: {
    metadata: { display_phone_number: '919800000000', phone_number_id: '111' },
    contacts: [{ profile: { name: 'Ravi' }, wa_id: '919876543210' }],
    messages: [
      { from: '919876543210', id: 'wamid.A', timestamp: '1762150000', type: 'text', text: { body: 'hi' } },
      { from: '919876543210', id: 'wamid.B', timestamp: '1762150001', type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'svc_web', title: 'Website / App' } } },
    ],
    statuses: [{ id: 'wamid.C', status: 'delivered', recipient_id: '919876543210', timestamp: '1762150002' }],
  } }] }],
};

// Replaces fetch for the length of fn and returns the calls made.
async function withFetch(respond, fn) {
  const calls = [], real = global.fetch;
  global.fetch = async (url, opts) => {
    if (String(url).startsWith('http://127.0.0.1')) return real(url, opts); // the test's own server
    calls.push({ url: String(url), opts });
    return respond(String(url), opts);
  };
  try { await fn(calls); } finally { global.fetch = real; }
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('normalizePhone handles Indian formats', () => {
  assert.equal(normalizePhone('98765 43210'), '919876543210');
  assert.equal(normalizePhone('+91-98765-43210'), '919876543210');
  assert.equal(normalizePhone('09876543210'), '919876543210');
  assert.equal(normalizePhone('0091 98765 43210'), '919876543210');
  assert.throws(() => normalizePhone('123'));
});

test('verifySignature', () => {
  const body = Buffer.from('{"a":1}');
  assert.ok(verifySignature(body, sign(body), 'app-secret'));
  assert.ok(!verifySignature(body, sign(Buffer.from('{"a":2}')), 'app-secret'));
  assert.ok(!verifySignature(body, undefined, 'app-secret'));
  assert.ok(!verifySignature(body, 'sha1=abc', 'app-secret'));
});

test('parseWebhook flattens messages and statuses', () => {
  const ev = parseWebhook(inbound);
  assert.equal(ev.length, 3);
  assert.deepEqual({ kind: ev[0].kind, from: ev[0].from, name: ev[0].name, text: ev[0].text, waba: ev[0].wabaId }, { kind: 'message', from: '919876543210', name: 'Ravi', text: 'hi', waba: '222' });
  assert.equal(ev[1].replyId, 'svc_web');
  assert.equal(ev[2].status, 'delivered');
  assert.equal(parseWebhook({ object: 'page' }).length, 0);
});

test('client builds correct payloads and surfaces Meta errors', async () => {
  await withFetch(() => json({ messages: [{ id: 'wamid.X' }], contacts: [{ wa_id: '919876543210' }] }), async calls => {
    const wa = new WhatsAppClient();
    const r = await wa.sendTemplate('9876543210', 'booking_confirmation', 'en', { bodyParams: ['Ravi', '12 Nov'] });
    assert.equal(r.messageId, 'wamid.X');
    assert.equal(calls[0].url, 'https://graph.facebook.com/v26.0/111/messages');
    assert.equal(calls[0].opts.headers.Authorization, 'Bearer test-token');
    const body = JSON.parse(calls[0].opts.body);
    assert.equal(body.to, '919876543210');
    assert.deepEqual(body.template.components[0].parameters.map(p => p.text), ['Ravi', '12 Nov']);
    // A client's number is reached by passing its id.
    await new WhatsAppClient({ phoneNumberId: '555' }).sendText('9876543210', 'hi');
    assert.equal(calls[1].url, 'https://graph.facebook.com/v26.0/555/messages');
    assert.throws(() => wa.sendButtons('9876543210', { body: 'x', buttons: [1, 2, 3, 4].map(i => ({ id: i, title: i })) }));
  });
  await withFetch(() => json({ error: { message: 'Re-engagement message', code: 131047, fbtrace_id: 'T1' } }, 400), async () => {
    await assert.rejects(new WhatsAppClient().sendText('919876543210', 'hello'), e => e.code === 131047 && e.status === 400);
  });
});

test('exchangeCode sends the app id, secret and code', async () => {
  await withFetch(() => json({ access_token: 'biz-token' }), async calls => {
    assert.equal(await exchangeCode('the-code'), 'biz-token');
    assert.match(calls[0].url, /client_id=app-1&client_secret=app-secret&code=the-code/);
  });
});

async function serve(fn) {
  const server = createServer((req, res) => {
    const { pathname, searchParams } = new URL(req.url, 'http://x');
    whatsappRoute(req, res, pathname, searchParams);
  }).listen(0);
  try { await fn(`http://127.0.0.1:${server.address().port}/api/whatsapp`); } finally { server.close(); }
}
const post = (url, body, headers = {}) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('HTTP: webhook handshake, signature, de-duplication', async () => serve(async base => {
  let r = await fetch(`${base}/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=4242`);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), '4242');
  assert.equal((await fetch(`${base}/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1`)).status, 403);

  const body = JSON.stringify(inbound);
  assert.equal((await post(`${base}/webhook`, body, { 'x-hub-signature-256': 'sha256=deadbeef' })).status, 401);
  const got = [], on = m => got.push(m.id);
  bus.on('message', on);
  try {
    assert.equal((await post(`${base}/webhook`, body, { 'x-hub-signature-256': sign(body) })).status, 200);
    await post(`${base}/webhook`, body, { 'x-hub-signature-256': sign(body) }); // delivered twice
    await new Promise(r => setTimeout(r, 50));
    assert.deepEqual(got, ['wamid.A', 'wamid.B']);
  } finally { bus.off('message', on); }
}));

test('HTTP: API needs the key, validates input, and reports status', async () => serve(async base => {
  assert.equal((await post(`${base}/send/text`, {})).status, 401);
  assert.equal((await post(`${base}/send/text`, {}, { 'x-api-key': 'wrong' })).status, 401);
  const key = { 'x-api-key': 'k'.repeat(32) };
  assert.equal((await post(`${base}/send/text`, { to: '9876543210' }, key)).status, 400);
  assert.equal((await post(`${base}/send/nothing`, {}, key)).status, 404);
  assert.equal((await post(`${base}/partner/onboard`, { code: 'c' }, key)).status, 400);
  await withFetch(() => json({ messages: [{ id: 'wamid.Z' }] }), async calls => {
    const r = await post(`${base}/send/text`, { to: '9876543210', text: 'Your order has shipped', phoneNumberId: '555' }, key);
    assert.equal(r.status, 200);
    assert.equal((await r.json()).messageId, 'wamid.Z');
    assert.match(calls[0].url, /\/555\/messages$/);
  });
  // Onboarding a client: token for the code, webhooks on their WABA, number registered, credit line shared.
  await withFetch(url => url.includes('oauth/access_token') ? json({ access_token: 'biz-token' }) : json({ success: true }), async calls => {
    const r = await post(`${base}/partner/onboard`, { code: 'c1', wabaId: 'W1', phoneNumberId: 'P1', pin: '123456' }, key);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { wabaId: 'W1', phoneNumberId: 'P1', webhooks: 'subscribed', phone: 'registered', creditLine: 'shared' });
    assert.deepEqual(calls.map(c => c.url.replace(/\?.*/, '').replace('https://graph.facebook.com/v26.0/', '')),
      ['oauth/access_token', 'W1/subscribed_apps', 'P1/register', 'credit-9/whatsapp_credit_sharing_and_attach']);
    assert.equal(calls[1].opts.headers.Authorization, 'Bearer biz-token');   // the client's token for their own assets
    assert.equal(calls[3].opts.headers.Authorization, 'Bearer test-token');  // our System User for the credit line
    assert.match(calls[3].url, /waba_currency=INR&waba_id=W1/);
  });
  assert.equal((await post(`${base}/partner/onboard`, { code: 'c1', wabaId: 'W1', phoneNumberId: 'P1', pin: '12' }, key)).status, 400);
  const status = await (await fetch(base)).json();
  assert.equal(status.enabled, true);
  assert.equal(status.partner, true);
  assert.equal(status.bot, false);
}));
