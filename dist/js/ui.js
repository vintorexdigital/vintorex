// Small rendering helpers shared by every view.
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const date = iso => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const dateTime = iso => iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
export function ago(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 0) return 'in ' + Math.ceil(-s / 86400) + 'd';
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
export const per = b => b === 'month' ? '/mo' : b === 'year' ? '/yr' : '';
export const initials = n => String(n || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

const P = {
  web: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M7 21h10"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L21 8H6"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  social: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  ads: '<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  brand: '<path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/>',
  cube: '<path d="m21 16-9 5-9-5V8l9-5 9 5Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 6 17.8"/><path d="M6 19h11.5"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
  bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2Z"/><path d="M9 8h6M9 12h6"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  funnel: '<path d="M3 4h18l-7 8v7l-4 2v-9Z"/>',
  board: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="8" cy="8" r="1.5"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  wa: '<path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-.9.8a4 4 0 0 1-2.2-2.2l.8-.9-1-2Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  phoneCall: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
};
export const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.star}</svg>`;

export function toast(msg, kind = 'ok') {
  let host = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.setAttribute('role', 'status');
  t.textContent = msg;
  host.append(t);
  setTimeout(() => t.classList.add('out'), 2800);
  setTimeout(() => t.remove(), 3200);
}

// Modal returns a promise resolved with FormData (or null when dismissed).
export function modal({ title, body, submit = 'Save', wide = false, danger = false }) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.className = 'modal' + (wide ? ' wide' : '');
    d.innerHTML = `<form method="dialog" class="modal-card">
      <header><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Close">${icon('x')}</button></header>
      <div class="modal-body">${body}</div>
      ${submit ? `<footer><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" value="ok">${esc(submit)}</button></footer>` : ''}
    </form>`;
    document.body.append(d);
    const form = d.querySelector('form');
    let result = null;
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      result = new FormData(form);
      d.close();
    });
    d.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => d.close()));
    d.addEventListener('close', () => { d.remove(); resolve(result); });
    d.showModal();
    d.querySelector('input,select,textarea')?.focus();
  });
}
export const confirmBox = (title, text, submit = 'Confirm') => modal({ title, body: `<p>${esc(text)}</p>`, submit, danger: true }).then(Boolean);

export const field = (label, name, { type = 'text', value = '', required = false, placeholder = '', options, rows, attrs = '' } = {}) => {
  const id = 'f_' + name + Math.random().toString(36).slice(2, 6);
  let input;
  if (options) input = `<select id="${id}" name="${name}" ${required ? 'required' : ''} ${attrs}>${options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
  else if (rows) input = `<textarea id="${id}" name="${name}" rows="${rows}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''} ${attrs}>${esc(value)}</textarea>`;
  else input = `<input id="${id}" name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''} ${attrs}>`;
  return `<label class="field" for="${id}"><span>${esc(label)}${required ? ' <i>*</i>' : ''}</span>${input}</label>`;
};

export const badge = (text, tone) => `<span class="badge ${tone || toneFor(text)}">${esc(text)}</span>`;
function toneFor(t) {
  return ({ New: 'blue', Contacted: 'violet', Qualified: 'teal', Proposal: 'amber', Won: 'green', Lost: 'grey', Pending: 'amber', 'In progress': 'blue', Review: 'violet', Delivered: 'green', Cancelled: 'grey', Active: 'green', Paused: 'amber', Replaced: 'grey', Open: 'blue', Closed: 'grey', High: 'red', Normal: 'blue', Low: 'grey', Blocked: 'red' })[t] || 'grey';
}

// Simple bar chart (SVG) — values in rupees.
export function barChart(rows, { height = 180, fmt = v => v } = {}) {
  const max = Math.max(1, ...rows.map(r => r.value));
  const w = 100 / rows.length;
  return `<div class="bars" style="height:${height}px">${rows.map(r => `
    <div class="bar" style="width:${w}%" title="${esc(r.label)}: ${esc(fmt(r.value))}">
      <span class="bar-val">${esc(fmt(r.value))}</span>
      <i style="height:${Math.max(2, r.value / max * 100)}%"></i>
      <small>${esc(r.label)}</small>
    </div>`).join('')}</div>`;
}

export const empty = (text, cta = '') => `<div class="empty">${icon('star')}<p>${esc(text)}</p>${cta}</div>`;
