import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.APP_DB_PATH = join(mkdtempSync(join(tmpdir(), 'vx-integrations-')), 'app.sqlite');
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.ADMIN_PASSWORD = 'test-password-with-24-characters';
delete process.env.INTEGRATIONS_API_KEY;
delete process.env.N8N_WEBHOOK_BASE;
delete process.env.N8N_WEBHOOK_SECRET;

const flow = await import('../server/integrations/flow.mjs');

const req = key => ({ headers: key ? { authorization: 'Bearer ' + key } : {} });

test('status and MCP tools list every ad and social platform without secrets', async () => {
  const status = flow.integrationStatus();
  assert.equal(status.spend, 'disabled');
  assert.equal(status.configured.n8nWebhook, false);
  assert.ok(status.platforms.some(p => p.id === 'google-ads' && p.manager === 'Google Ads'));
  assert.ok(status.platforms.some(p => p.id === 'meta-ads' && p.manager === 'Meta Business Manager'));
  for (const id of ['facebook', 'instagram', 'youtube', 'x', 'linkedin', 'tiktok', 'whatsapp']) {
    assert.ok(status.platforms.some(p => p.id === id));
  }
  const init = await flow.handleMcp(req(), { jsonrpc: '2.0', id: 1, method: 'initialize' });
  assert.equal(init.result.serverInfo.name, 'vintorex');
  const tools = await flow.handleMcp(req(), { jsonrpc: '2.0', id: 2, method: 'tools/list' });
  const names = tools.result.tools.map(t => t.name);
  assert.ok(names.includes('request_campaign') && names.includes('request_social_post'));
  assert.equal(await flow.handleMcp(req(), { jsonrpc: '2.0', method: 'notifications/initialized' }), null);
});

test('campaign and social requests queue locally and do not call a network', async () => {
  process.env.INTEGRATIONS_API_KEY = 'integration-test-key';
  const denied = await flow.handleMcp(req(), { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'request_campaign', arguments: { platform: 'google-ads', name: 'Asha', email: 'asha@example.test' } } });
  assert.equal(denied.result.isError, true);
  const unapproved = await flow.handleMcp(req('integration-test-key'), { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'request_campaign', arguments: { platform: 'google-ads', name: 'Asha', email: 'asha@example.test', approved: false } } });
  assert.equal(unapproved.result.isError, true);
  const queued = await flow.handleMcp(req('integration-test-key'), { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'request_campaign', arguments: { platform: 'meta-ads', name: 'Asha', email: 'asha@example.test', approved: true, dailyBudget: 500 } } });
  const body = JSON.parse(queued.result.content[0].text);
  assert.equal(body.spend, false);
  assert.equal(body.flow, 'meta-business');
  assert.equal(body.delivery.delivered, false);
  const social = await flow.handleMcp(req('integration-test-key'), { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'request_social_post', arguments: { platform: 'linkedin', name: 'Asha', email: 'asha@example.test', text: 'Hello from Vintorex' } } });
  assert.equal(JSON.parse(social.result.content[0].text).spend, false);
});

test('n8n callbacks require a signature and shipped workflows keep spend nodes disabled', () => {
  process.env.N8N_WEBHOOK_SECRET = 'webhook-secret';
  const raw = Buffer.from(JSON.stringify({ flow: 'google-ads', status: 'received' }));
  assert.throws(() => flow.acceptN8n(raw, 'nope'), { status: 401 });
  assert.deepEqual(flow.acceptN8n(raw, flow.signBody(raw)), { ok: true });
  for (const name of flow.workflowFiles()) {
    const workflow = flow.loadWorkflow(name);
    assert.equal(workflow.meta.vintorex.spends, false);
    const http = workflow.nodes.filter(node => node.type === 'n8n-nodes-base.httpRequest');
    assert.ok(http.every(node => node.disabled === true));
  }
  const social = flow.loadWorkflow('social-publish.json');
  const url = social.nodes.find(node => node.disabled).parameters.url;
  for (const host of ['graph.facebook.com', 'googleapis.com', 'api.x.com', 'api.linkedin.com', 'tiktokapis.com']) assert.ok(url.includes(host));
});

test('a configured n8n webhook receives the signed lead and a bad response is reported', async () => {
  process.env.N8N_WEBHOOK_BASE = 'https://n8n.example/webhook';
  process.env.N8N_WEBHOOK_SECRET = 'webhook-secret';
  let seen;
  const delivery = await flow.dispatch('lead-intake', { id: 'l_test' }, async (url, options) => {
    seen = { url, signature: options.headers['x-vintorex-signature'], body: options.body };
    return { ok: true, status: 200 };
  });
  assert.equal(delivery.delivered, true);
  assert.equal(seen.url, 'https://n8n.example/webhook/lead-intake');
  assert.equal(seen.signature, flow.signBody(seen.body));
  const failed = await flow.dispatch('google-ads', {}, async () => ({ ok: false, status: 503 }));
  assert.equal(failed.delivered, false);
  delete process.env.N8N_WEBHOOK_BASE;
});

test('Google Sheets fan-out skips when unset and signs Apps Script bodies', async () => {
  delete process.env.GOOGLE_SHEETS_WEBAPP_URL;
  delete process.env.GOOGLE_SHEETS_SECRET;
  delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  const skipped = await flow.pushSheet('lead.created', { id: 'l1' });
  assert.equal(skipped.delivered, false);
  process.env.GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/example/exec';
  process.env.GOOGLE_SHEETS_SECRET = 'sheet-secret';
  let seen;
  const delivery = await flow.pushSheet('offer.claimed', { uid: 'u1', code: 'VX-TEST' }, async (url, options) => {
    seen = { url, signature: options.headers['x-vintorex-signature'], body: options.body };
    return { ok: true, status: 200 };
  });
  assert.equal(delivery.delivered, true);
  assert.equal(delivery.via, 'apps-script');
  assert.equal(seen.url, 'https://script.google.com/macros/s/example/exec');
  assert.equal(seen.signature, flow.signBody(seen.body, 'sheet-secret'));
  assert.equal(JSON.parse(seen.body).payload.uid, 'u1');
  delete process.env.GOOGLE_SHEETS_WEBAPP_URL;
  delete process.env.GOOGLE_SHEETS_SECRET;
});
