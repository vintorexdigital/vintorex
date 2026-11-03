// Webhook handling: signature check, flattening Meta's nested payload into events, and an event bus.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { EventEmitter } from 'node:events';

// X-Hub-Signature-256 is an HMAC of the raw request body, so check it before parsing.
export function verifySignature(rawBody, header, appSecret) {
  if (!appSecret || !rawBody || !/^sha256=[0-9a-f]{64}$/i.test(header || '')) return false;
  const received = header.slice(7);
  const a = Buffer.from(received, 'hex'), b = createHmac('sha256', appSecret).update(rawBody).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

const safeJson = s => { try { return JSON.parse(s); } catch { return s; } };

function extractContent(msg) {
  switch (msg.type) {
    case 'text': return { text: msg.text?.body };
    case 'interactive': {
      const i = msg.interactive || {};
      if (i.type === 'button_reply') return { replyId: i.button_reply.id, text: i.button_reply.title, interactiveType: 'button' };
      if (i.type === 'list_reply') return { replyId: i.list_reply.id, text: i.list_reply.title, description: i.list_reply.description, interactiveType: 'list' };
      if (i.type === 'nfm_reply') return { flowResponse: safeJson(i.nfm_reply.response_json), interactiveType: 'flow' };
      return { interactive: i };
    }
    case 'button': return { replyId: msg.button?.payload, text: msg.button?.text, interactiveType: 'template_button' };
    case 'image': case 'video': case 'audio': case 'document': case 'sticker': {
      const m = msg[msg.type] || {};
      return { mediaId: m.id, mimeType: m.mime_type, caption: m.caption, filename: m.filename, voice: m.voice };
    }
    case 'location': return { location: msg.location };
    case 'contacts': return { contacts: msg.contacts };
    case 'reaction': return { reaction: msg.reaction };
    case 'order': return { order: msg.order };
    case 'system': return { system: msg.system };
    default: return { unsupported: msg.errors || true };
  }
}

// Events, each carrying wabaId (and phoneNumberId for messages), so one server can serve client accounts too:
//   { kind: 'message', from, name, id, type, text, replyId, mediaId, context, ... }
//   { kind: 'status', id, status: 'sent' | 'delivered' | 'read' | 'failed', recipient, errors, ... }
//   { kind: 'other', field, wabaId, value }   template approvals, quality changes, account_update, ...
export function parseWebhook(body) {
  const events = [];
  if (body?.object !== 'whatsapp_business_account') return events;
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      if (change.field !== 'messages') { events.push({ kind: 'other', field: change.field, wabaId: entry.id, value }); continue; }
      const meta = { wabaId: entry.id, phoneNumberId: value.metadata?.phone_number_id, displayPhoneNumber: value.metadata?.display_phone_number };
      const names = Object.fromEntries((value.contacts || []).map(c => [c.wa_id, c.profile?.name]));
      for (const msg of value.messages || []) {
        events.push({
          kind: 'message', ...meta, id: msg.id, from: msg.from, name: names[msg.from], type: msg.type,
          timestamp: new Date(Number(msg.timestamp) * 1000), context: msg.context, referral: msg.referral,
          ...extractContent(msg), raw: msg,
        });
      }
      for (const st of value.statuses || []) {
        events.push({
          kind: 'status', ...meta, id: st.id, status: st.status, recipient: st.recipient_id,
          timestamp: new Date(Number(st.timestamp) * 1000), conversation: st.conversation, pricing: st.pricing, errors: st.errors, raw: st,
        });
      }
      for (const error of value.errors || []) events.push({ kind: 'error', ...meta, error });
    }
  }
  return events;
}

// Meta may deliver the same webhook more than once.
export class SeenCache {
  constructor(max = 5000) { this.max = max; this.set = new Set(); }
  has(id) { return this.set.has(id); }
  add(id) {
    this.set.add(id);
    if (this.set.size > this.max) this.set.delete(this.set.values().next().value);
  }
}

// bus.on('message' | 'status' | 'other' | 'error', fn)
export const bus = new EventEmitter();
bus.setMaxListeners(50);
