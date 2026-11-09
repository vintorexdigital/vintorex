// Vintorex is the system of record. n8n is the workflow runner. OpenClaw and Paperclip
// are MCP clients. Ad and social API calls live in n8n and stay disabled until a person enables them.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVICES } from '../../dist/js/data.js';
import { appendLead, noteActivity, readStore } from '../store.mjs';
import { appendEvent as appendSheetRow, sheetsConfigured } from './sheets.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../integrations/n8n');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const digest = value => createHash('sha256').update(String(value)).digest();
const same = (a, b) => { const x = digest(a), y = digest(b); return x.length === y.length && timingSafeEqual(x, y); };
const esc = value => String(value).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

export const PLATFORMS = [
  { id: 'google-ads', group: 'ads', name: 'Google Ads', manager: 'Google Ads' },
  { id: 'meta-ads', group: 'ads', name: 'Meta Ads', manager: 'Meta Business Manager' },
  { id: 'facebook', group: 'social', name: 'Facebook', manager: 'Meta Business Manager' },
  { id: 'instagram', group: 'social', name: 'Instagram', manager: 'Meta Business Manager' },
  { id: 'youtube', group: 'social', name: 'YouTube', manager: 'YouTube' },
  { id: 'x', group: 'social', name: 'X', manager: 'X' },
  { id: 'linkedin', group: 'social', name: 'LinkedIn', manager: 'LinkedIn' },
  { id: 'tiktok', group: 'social', name: 'TikTok', manager: 'TikTok' },
  { id: 'whatsapp', group: 'social', name: 'WhatsApp', manager: 'Meta Business Manager' },
];

export const FLOWS = [
  { id: 'lead-intake', event: 'lead.created', workflow: 'lead-intake.json', platforms: PLATFORMS.map(p => p.id), spends: false },
  { id: 'google-ads', event: 'campaign.requested', workflow: 'google-ads.json', platforms: ['google-ads'], spends: false },
  { id: 'meta-business', event: 'campaign.requested', workflow: 'meta-business.json', platforms: ['meta-ads', 'facebook', 'instagram', 'whatsapp'], spends: false },
  { id: 'social-publish', event: 'social.requested', workflow: 'social-publish.json', platforms: ['facebook', 'instagram', 'youtube', 'x', 'linkedin', 'tiktok', 'whatsapp'], spends: false },
];

const set = name => Boolean(process.env[name]);
function sheetsSecret() {
  return process.env.GOOGLE_SHEETS_SECRET || process.env.N8N_WEBHOOK_SECRET || '';
}

export function integrationStatus() {
  return {
    mcp: '/api/mcp',
    page: '/integrations',
    clients: ['OpenClaw', 'Paperclip', 'n8n', 'Google Sheets'],
    configured: {
      mcpKey: set('INTEGRATIONS_API_KEY'),
      n8nWebhook: set('N8N_WEBHOOK_BASE') && set('N8N_WEBHOOK_SECRET'),
      n8nMcp: set('N8N_MCP_URL'),
      openclaw: set('OPENCLAW_GATEWAY_URL'),
      paperclip: set('PAPERCLIP_URL'),
      googleSheets: (set('GOOGLE_SHEETS_WEBAPP_URL') && Boolean(sheetsSecret())) || sheetsConfigured(),
    },
    platforms: PLATFORMS,
    flows: FLOWS,
    spend: 'disabled',
  };
}

export function signBody(raw, secret = process.env.N8N_WEBHOOK_SECRET || '') {
  return createHmac('sha256', secret).update(raw).digest('hex');
}

export async function dispatch(flow, payload, fetchImpl = globalThis.fetch) {
  const base = process.env.N8N_WEBHOOK_BASE;
  if (!base || !process.env.N8N_WEBHOOK_SECRET) return { delivered: false, reason: 'n8n webhook is not configured' };
  const known = FLOWS.some(item => item.id === flow);
  if (!known) fail(400, 'Unknown flow.');
  const body = JSON.stringify({ flow, payload, at: new Date().toISOString() });
  const response = await fetchImpl(base.replace(/\/$/, '') + '/' + flow, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vintorex-signature': signBody(body) },
    body,
  });
  return { delivered: response.ok, status: response.status };
}

/**
 * Write a CRM event to Google Sheets.
 * Prefer a service account (works with Advanced Protection). Fall back to the Apps Script web app.
 */
export async function pushSheet(event, payload, fetchImpl = globalThis.fetch) {
  if (sheetsConfigured()) {
    try { return await appendSheetRow(event, payload, fetchImpl); }
    catch (error) { return { delivered: false, reason: error.message }; }
  }
  const url = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  const secret = sheetsSecret();
  if (!url || !secret) {
    return { delivered: false, reason: 'Google Sheets is not configured (service account or Apps Script web app)' };
  }
  const body = JSON.stringify({ event, payload, at: new Date().toISOString() });
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-vintorex-signature': signBody(body, secret) },
    body,
    redirect: 'follow',
  });
  return { delivered: response.ok, status: response.status, via: 'apps-script' };
}

export async function fanoutLead(lead) {
  const payload = {
    type: 'lead', id: lead.id, name: lead.name, email: lead.email, phone: lead.phone || '',
    service: lead.service || '', source: lead.source || '', message: lead.message || '', stage: lead.stage || '',
  };
  const [n8n, sheets] = await Promise.all([
    dispatch('lead-intake', payload),
    pushSheet('lead.created', payload),
  ]);
  return { delivered: Boolean(n8n.delivered || sheets.delivered), n8n, sheets };
}

export async function fanoutOffer(claim) {
  const payload = {
    type: 'offer', uid: claim.uid, code: claim.code, email: claim.email, name: claim.name,
    business: claim.business || '', goal: claim.goal || '', service: claim.service, tier: claim.tier,
    amount: claim.amount, price: claim.price, total: claim.total, followup: claim.followup || '', paid: Boolean(claim.paid),
  };
  return pushSheet('offer.claimed', payload);
}

function authorised(req) {
  const key = process.env.INTEGRATIONS_API_KEY;
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return Boolean(key) && same(token, key);
}

function platform(id) {
  const found = PLATFORMS.find(item => item.id === id);
  if (!found) fail(400, 'Unknown platform.');
  return found;
}

export async function queueRequest(kind, input, req) {
  if (!authorised(req)) fail(401, 'Integrations API key required.');
  const chosen = platform(input.platform);
  if (kind === 'campaign' && chosen.group !== 'ads') fail(400, 'Choose google-ads or meta-ads.');
  if (kind === 'social' && chosen.group !== 'social') fail(400, 'Choose a social platform.');
  if (kind === 'campaign' && input.approved !== true) fail(409, 'Campaign requests stay queued until approved is true. Nothing is sent to the ad account.');
  const lead = appendLead({
    name: input.name, email: input.email, phone: input.phone, company: input.company,
    source: kind === 'campaign' ? 'Ad request' : 'Social request', service: chosen.id,
    message: String(input.message || input.objective || '').slice(0, 2000),
    budget: Number(input.dailyBudget) || 0,
  });
  const flow = kind === 'campaign' ? (chosen.id === 'google-ads' ? 'google-ads' : 'meta-business') : 'social-publish';
  const delivery = await dispatch(flow, { leadId: lead.id, platform: chosen.id, objective: input.objective || '', text: input.text || '', approved: input.approved === true, spend: false });
  return { leadId: lead.id, flow, platform: chosen.id, spend: false, delivery };
}

export function acceptN8n(raw, signature) {
  if (!process.env.N8N_WEBHOOK_SECRET || !same(signature || '', signBody(raw))) fail(401, 'Bad signature.');
  let body;
  try { body = JSON.parse(raw.toString('utf8')); } catch { fail(400, 'Invalid JSON.'); }
  const text = 'n8n ' + String(body.flow || 'callback') + ': ' + String(body.status || 'received').slice(0, 160);
  noteActivity(text);
  return { ok: true };
}

const TOOLS = [
  { name: 'integration_status', description: 'Which Vintorex, n8n, OpenClaw and Paperclip connections are configured. No secrets.', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_services', description: 'Published Vintorex services and starting prices.', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_flows', description: 'n8n workflows for Google Ads, Meta Business Manager and social platforms. Spend nodes ship disabled.', inputSchema: { type: 'object', properties: {} } },
  { name: 'recent_leads', description: 'Latest enquiries. Requires the integrations API key.', inputSchema: { type: 'object', properties: {} } },
  { name: 'record_lead', description: 'Save an enquiry and fan it out to the n8n lead-intake workflow when n8n is configured.', inputSchema: { type: 'object', required: ['name', 'email'], properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, service: { type: 'string' }, message: { type: 'string' } } } },
  { name: 'request_campaign', description: 'Queue a Google Ads or Meta Ads request. Does not create or spend. The n8n HTTP node stays disabled until a person enables it.', inputSchema: { type: 'object', required: ['platform', 'name', 'email'], properties: { platform: { type: 'string', enum: ['google-ads', 'meta-ads'] }, name: { type: 'string' }, email: { type: 'string' }, objective: { type: 'string' }, dailyBudget: { type: 'number' }, approved: { type: 'boolean' } } } },
  { name: 'request_social_post', description: 'Queue a social post for Facebook, Instagram, YouTube, X, LinkedIn, TikTok or WhatsApp. Does not publish.', inputSchema: { type: 'object', required: ['platform', 'name', 'email', 'text'], properties: { platform: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' }, text: { type: 'string' } } } },
];

function toolResult(data, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(data) }], isError };
}

async function callTool(name, args, req) {
  if (name === 'integration_status') return integrationStatus();
  if (name === 'list_services') return SERVICES.map(s => ({ id: s.id, name: s.name, from: Math.min(...s.tiers.map(t => t.price)), billing: s.billing }));
  if (name === 'list_flows') return FLOWS;
  if (name === 'recent_leads') {
    if (!authorised(req)) fail(401, 'Integrations API key required.');
    return readStore().state.leads.slice(0, 10).map(l => ({ id: l.id, name: l.name, email: l.email, source: l.source, stage: l.stage, service: l.service }));
  }
  if (name === 'record_lead') {
    if (!authorised(req)) fail(401, 'Integrations API key required.');
    const lead = appendLead({ ...args, source: 'MCP' });
    return { leadId: lead.id, delivery: await fanoutLead(lead) };
  }
  if (name === 'request_campaign') return queueRequest('campaign', args, req);
  if (name === 'request_social_post') return queueRequest('social', { ...args, message: args.text }, req);
  fail(404, 'Unknown tool.');
}

export async function handleMcp(req, message) {
  const id = message?.id ?? null;
  const method = message?.method;
  const result = data => ({ jsonrpc: '2.0', id, result: data });
  try {
    if (method === 'initialize') return result({ protocolVersion: '2025-03-26', capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'vintorex', version: '1.0.0' }, instructions: 'Campaign and social tools queue work for n8n. They do not spend or publish.' });
    if (method === 'notifications/initialized' || method === 'initialized') return null;
    if (method === 'ping') return result({});
    if (method === 'tools/list') return result({ tools: TOOLS });
    if (method === 'tools/call') {
      const data = await callTool(message.params?.name, message.params?.arguments || {}, req);
      return result(toolResult(data));
    }
    return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } };
  } catch (error) {
    if (method === 'tools/call') return result(toolResult({ error: error.message }, true));
    return { jsonrpc: '2.0', id, error: { code: -32000, message: error.message || 'Request failed' } };
  }
}

export function workflowFiles() {
  return readdirSync(ROOT).filter(name => name.endsWith('.json')).sort();
}

export function integrationsHtml() {
  const status = integrationStatus();
  const flag = (on, label) => `<li>${on ? '<span class="yes" aria-label="Configured">✓</span>' : '<span class="no" aria-label="Not configured">—</span>'} ${esc(label)}</li>`;
  const rows = PLATFORMS.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.manager)}</td><td>${esc(p.group)}</td><td>Queued</td></tr>`).join('');
  return `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Integrations · Vintorex</title>
  <link rel="stylesheet" href="/css/typography.css">
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <main class="shell section">
    <p class="eyebrow"><span></span>n8n · MCP · OpenClaw · Paperclip · Sheets</p>
    <h1>Marketing integration flow</h1>
    <p class="lead">Vintorex keeps the catalogue, enquiries and orders. n8n runs the durable workflows. OpenClaw and Paperclip connect over MCP and call the same tools. Google Sheets receives lead and offer rows through an Apps Script web app. Google Ads, Meta Business Manager and social publishing stay queued: the HTTP nodes in the shipped workflows are disabled, so nothing spends or posts until you enable them.</p>
    <div class="cards2">
      <section class="card pad"><h2>Connections</h2><ul class="ticks col">
        ${flag(status.configured.mcpKey, 'Vintorex MCP key')}
        ${flag(status.configured.n8nWebhook, 'n8n webhooks')}
        ${flag(status.configured.n8nMcp, 'n8n MCP server')}
        ${flag(status.configured.openclaw, 'OpenClaw gateway')}
        ${flag(status.configured.paperclip, 'Paperclip')}
        ${flag(status.configured.googleSheets, 'Google Sheets (Apps Script)')}
      </ul></section>
      <section class="card pad"><h2>How a request moves</h2>
        <ol class="steps-list">
          <li><b>Enquiry</b><span>The site, OpenClaw or Paperclip calls record_lead on /api/mcp.</span></li>
          <li><b>n8n</b><span>Vintorex signs the payload and posts it to the lead-intake webhook.</span></li>
          <li><b>Approval</b><span>request_campaign refuses to queue until approved is true.</span></li>
          <li><b>Channels</b><span>Google Ads, Meta Business Manager, Facebook, Instagram, YouTube, X, LinkedIn, TikTok and WhatsApp each have a workflow. Spend and publish nodes are disabled.</span></li>
        </ol>
      </section>
    </div>
    <section class="card pad"><h2>Platforms</h2>
      <div class="table-wrap scroll"><table class="table"><thead><tr><th>Platform</th><th>Manager</th><th>Kind</th><th>Publish</th></tr></thead><tbody>${rows}</tbody></table></div>
    </section>
  </main>
</body>
</html>`;
}

export function loadWorkflow(name) {
  return JSON.parse(readFileSync(join(ROOT, name), 'utf8'));
}
