// WhatsApp Business Cloud API client (Meta Graph API). Native fetch, no dependencies.
// Docs: https://developers.facebook.com/documentation/business-messaging/whatsapp
import { config } from './config.mjs';

export class WhatsAppError extends Error {
  constructor(message, { status, code, subcode, type, details, fbtraceId, raw } = {}) {
    super(message);
    this.name = 'WhatsAppError';
    Object.assign(this, { status, code, subcode, type, details, fbtraceId, raw });
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Country code + number, digits only. A 10-digit number gets the default country code (91 = India).
export function normalizePhone(input, countryCode = config.countryCode) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = countryCode + digits;
  if (digits.length < 8 || digits.length > 15) throw new WhatsAppError(`Invalid phone number: "${input}"`, { status: 400 });
  return digits;
}

// One client per phone number. `phoneNumberId` and `wabaId` can point at a client's number and account,
// which the System User can reach once the client has shared them through Embedded Signup.
export class WhatsAppClient {
  constructor(opts = {}) {
    this.token = opts.token || config.token;
    this.phoneNumberId = opts.phoneNumberId || config.phoneNumberId;
    this.wabaId = opts.wabaId || config.wabaId;
    this.version = opts.version || config.graphVersion;
    this.baseUrl = `https://graph.facebook.com/${this.version}`;
    this.maxRetries = opts.maxRetries ?? 2;
  }

  async request(method, path, { json, form, query } = {}) {
    const url = new URL(`${this.baseUrl}/${path.replace(/^\//, '')}`);
    for (const [k, v] of Object.entries(query || {})) if (v != null) url.searchParams.set(k, v);
    const headers = { Authorization: `Bearer ${this.token}` };
    let body;
    if (json) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
    else if (form) body = form; // fetch sets the multipart boundary itself

    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(30000) });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
      if (res.ok) return data;
      const err = data.error || {};
      const retryable = res.status === 429 || res.status >= 500 || [130429, 131056, 131000].includes(err.code);
      if (retryable && attempt < this.maxRetries && !form) { await sleep(500 * 2 ** attempt + Math.random() * 250); continue; }
      throw new WhatsAppError(err.message || `Graph API error ${res.status}`, {
        status: res.status, code: err.code, subcode: err.error_subcode, type: err.type,
        details: err.error_data?.details, fbtraceId: err.fbtrace_id, raw: data,
      });
    }
  }

  // ---------- sending ----------
  // `replyTo` is the wamid of a message to quote.
  async send(to, type, payload, { replyTo } = {}) {
    const body = { messaging_product: 'whatsapp', recipient_type: 'individual', to: normalizePhone(to), type, [type]: payload };
    if (replyTo) body.context = { message_id: replyTo };
    const data = await this.request('POST', `${this.phoneNumberId}/messages`, { json: body });
    return { messageId: data.messages?.[0]?.id, waId: data.contacts?.[0]?.wa_id, raw: data };
  }

  sendText(to, text, { previewUrl = false, replyTo } = {}) {
    if (!text || text.length > 4096) throw new WhatsAppError('Text must be 1–4096 chars', { status: 400 });
    return this.send(to, 'text', { body: text, preview_url: previewUrl }, { replyTo });
  }

  // Templates start a conversation outside the 24-hour window.
  //   bodyParams ['Ravi', '12 Nov'] · headerParams ['ORD-1'] · headerMedia { type, link|id, filename? }
  //   buttonParams [{ index: 0, sub_type: 'url', text: 'abc' }] · components: raw array that overrides all of these
  sendTemplate(to, name, language = 'en', opts = {}) {
    let components = opts.components;
    if (!components) {
      components = [];
      if (opts.headerMedia) {
        const { type, ...media } = opts.headerMedia;
        components.push({ type: 'header', parameters: [{ type, [type]: media }] });
      } else if (opts.headerParams?.length) {
        components.push({ type: 'header', parameters: opts.headerParams.map(t => ({ type: 'text', text: String(t) })) });
      }
      if (opts.bodyParams?.length) components.push({ type: 'body', parameters: opts.bodyParams.map(t => ({ type: 'text', text: String(t) })) });
      for (const b of opts.buttonParams || []) {
        components.push({
          type: 'button', sub_type: b.sub_type || 'url', index: String(b.index ?? 0),
          parameters: [b.sub_type === 'quick_reply' ? { type: 'payload', payload: b.payload } : { type: 'text', text: String(b.text) }],
        });
      }
    }
    const template = { name, language: { code: language } };
    if (components.length) template.components = components;
    return this.send(to, 'template', template);
  }

  _media(to, type, { link, id, caption, filename }, opts) {
    if (!link && !id) throw new WhatsAppError('Provide media "link" or "id"', { status: 400 });
    const p = link ? { link } : { id };
    if (caption && type !== 'audio' && type !== 'sticker') p.caption = caption;
    if (filename && type === 'document') p.filename = filename;
    return this.send(to, type, p, opts);
  }
  sendImage(to, media, opts) { return this._media(to, 'image', media, opts); }
  sendDocument(to, media, opts) { return this._media(to, 'document', media, opts); }
  sendVideo(to, media, opts) { return this._media(to, 'video', media, opts); }
  sendAudio(to, media, opts) { return this._media(to, 'audio', media, opts); }
  sendSticker(to, media, opts) { return this._media(to, 'sticker', media, opts); }

  sendLocation(to, { latitude, longitude, name, address }, opts) { return this.send(to, 'location', { latitude, longitude, name, address }, opts); }
  sendReaction(to, messageId, emoji) { return this.send(to, 'reaction', { message_id: messageId, emoji }); } // "" removes it

  // Up to 3 reply buttons, titles up to 20 characters.
  sendButtons(to, { body, buttons, header, footer }, opts) {
    if (!buttons?.length || buttons.length > 3) throw new WhatsAppError('1–3 buttons required', { status: 400 });
    const interactive = {
      type: 'button', body: { text: body },
      action: { buttons: buttons.map(b => ({ type: 'reply', reply: { id: String(b.id), title: String(b.title).slice(0, 20) } })) },
    };
    if (header) interactive.header = typeof header === 'string' ? { type: 'text', text: header } : header;
    if (footer) interactive.footer = { text: footer };
    return this.send(to, 'interactive', interactive, opts);
  }

  // List message, at most 10 rows in all.
  sendList(to, { body, buttonText, sections, header, footer }, opts) {
    const rows = (sections || []).reduce((n, s) => n + (s.rows?.length || 0), 0);
    if (!rows || rows > 10) throw new WhatsAppError('List needs 1–10 rows in total', { status: 400 });
    const interactive = {
      type: 'list', body: { text: body },
      action: {
        button: String(buttonText || 'View options').slice(0, 20),
        sections: sections.map(s => ({
          title: s.title ? String(s.title).slice(0, 24) : undefined,
          rows: s.rows.map(r => ({ id: String(r.id), title: String(r.title).slice(0, 24), ...(r.description ? { description: String(r.description).slice(0, 72) } : {}) })),
        })),
      },
    };
    if (header) interactive.header = { type: 'text', text: header };
    if (footer) interactive.footer = { text: footer };
    return this.send(to, 'interactive', interactive, opts);
  }

  sendCtaUrl(to, { body, displayText, url, header, footer }, opts) {
    const interactive = { type: 'cta_url', body: { text: body }, action: { name: 'cta_url', parameters: { display_text: String(displayText).slice(0, 20), url } } };
    if (header) interactive.header = { type: 'text', text: header };
    if (footer) interactive.footer = { text: footer };
    return this.send(to, 'interactive', interactive, opts);
  }

  markAsRead(messageId, { showTyping = false } = {}) {
    const json = { messaging_product: 'whatsapp', status: 'read', message_id: messageId };
    if (showTyping) json.typing_indicator = { type: 'text' };
    return this.request('POST', `${this.phoneNumberId}/messages`, { json });
  }

  // ---------- media ----------
  // A media id lasts about 30 days.
  async uploadMedia(buffer, mimeType, filename = 'file') {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    form.append('file', new Blob([buffer], { type: mimeType }), filename);
    return (await this.request('POST', `${this.phoneNumberId}/media`, { form })).id;
  }
  getMediaInfo(mediaId) { return this.request('GET', mediaId); } // the url lasts about 5 minutes
  async downloadMedia(mediaId) {
    const info = await this.getMediaInfo(mediaId);
    const res = await fetch(info.url, { headers: { Authorization: `Bearer ${this.token}` }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new WhatsAppError(`Media download failed (${res.status})`, { status: res.status });
    return { buffer: Buffer.from(await res.arrayBuffer()), mimeType: info.mime_type, size: info.file_size };
  }
  deleteMedia(mediaId) { return this.request('DELETE', mediaId); }

  // ---------- templates (need the WABA id) ----------
  listTemplates({ limit = 100, status } = {}) {
    return this.request('GET', `${this.wabaId}/message_templates`, { query: { limit, status, fields: 'name,status,category,language,components,quality_score' } });
  }
  createTemplate(template) { return this.request('POST', `${this.wabaId}/message_templates`, { json: template }); }
  deleteTemplate(name) { return this.request('DELETE', `${this.wabaId}/message_templates`, { query: { name } }); }

  // ---------- phone number health ----------
  getPhoneNumberInfo() {
    return this.request('GET', this.phoneNumberId, {
      query: { fields: 'display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,throughput,messaging_limit_tier' },
    });
  }
}

// ---------- partner: onboarding a client's WhatsApp Business Account ----------
// The client finishes Embedded Signup in the browser, which hands back a short-lived code (30 seconds)
// plus their WABA and phone number ids. These calls run on the server only.

// Step 1. The code becomes a token for that client's assets. It needs the app secret, not a bearer token.
export async function exchangeCode(code, { appId = config.appId, appSecret = config.appSecret, version = config.graphVersion } = {}) {
  const url = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  url.search = new URLSearchParams({ client_id: appId, client_secret: appSecret, code }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new WhatsAppError(data.error?.message || 'Code exchange failed', { status: res.status || 502, code: data.error?.code, raw: data });
  return data.access_token;
}

// Step 2. Send the client WABA's webhooks to this app. Uses the client's business token.
export function subscribeApp(wabaId, businessToken) {
  return new WhatsAppClient({ token: businessToken }).request('POST', `${wabaId}/subscribed_apps`);
}

// Step 3. Register the client's number for Cloud API. The 6-digit PIN becomes its two-step verification PIN.
export function registerPhone(phoneNumberId, pin, businessToken) {
  if (!/^\d{6}$/.test(String(pin))) throw new WhatsAppError('pin must be 6 digits', { status: 400 });
  return new WhatsAppClient({ token: businessToken }).request('POST', `${phoneNumberId}/register`, { json: { messaging_product: 'whatsapp', pin: String(pin) } });
}

// Step 4 (Solution Partners only). Share our credit line so Meta bills us, not the client. Uses the System User token.
// Only AUD, EUR, GBP, IDR, INR and USD are supported, and an attached credit line cannot be changed.
export function shareCreditLine(wabaId, currency = 'INR', { creditLineId = config.creditLineId } = {}) {
  if (!creditLineId) throw new WhatsAppError('WHATSAPP_CREDIT_LINE_ID is not set', { status: 503 });
  return new WhatsAppClient().request('POST', `${creditLineId}/whatsapp_credit_sharing_and_attach`, { query: { waba_currency: currency, waba_id: wabaId } });
}
