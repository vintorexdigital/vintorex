import * as D from './db.js';
import { SERVICES, PLANS, ADDONS, PRODUCTS, COUPONS, LEAD_STAGES, ORDER_STATUSES } from './data.js';
import { POSTS } from './blog/index.js';
import { records, recordId } from './shared-store.js';
import { esc, toast, confirmBox, empty } from './ui.js';

const labels = { services: 'Services', plans: 'Membership plans', addons: 'Add-ons', products: 'Products', coupons: 'Coupons', posts: 'Blog posts', users: 'Accounts', leads: 'Leads', orders: 'Orders', subscriptions: 'Subscriptions', tickets: 'Support tickets' };
const examples = { services: SERVICES[0], plans: PLANS[1], addons: ADDONS[0], products: PRODUCTS[0], coupons: { ...COUPONS[0], active: true }, posts: { ...POSTS[0], published: true } };
const copy = value => JSON.parse(JSON.stringify(value));
const label = key => key.replace(/([A-Z])/g, ' $1').replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
const now = () => new Date().toISOString();
function initial(name) {
  const common = { id: D.uid(name + '_'), createdAt: now() };
  const customerId = D.db().users.find(u => u.role === 'customer')?.id || '';
  const defaults = {
    users: { ...common, name: '', email: '', phone: '', company: '', role: 'customer', status: 'Active', plan: 'free', tags: [] },
    leads: { ...common, name: '', email: '', phone: '', company: '', source: 'Walk-in', service: '', stage: 'New', owner: '', value: 0, budget: 0, notes: [], followUp: null, message: '', score: 0 },
    orders: { ...common, invoice: 'MANUAL-' + Date.now(), customerId, status: 'Pending', paid: false, method: 'Offline', items: [], payments: [], subtotal: 0, discount: 0, gst: 0, total: 0 },
    subscriptions: { ...common, customerId, plan: 'free', cycle: 'month', status: 'Active', startedAt: now(), renewsAt: new Date(Date.now() + 30 * 864e5).toISOString(), addons: [] },
    tickets: { ...common, customerId, subject: '', orderId: null, status: 'Open', priority: 'Normal', messages: [{ at: now(), from: D.currentUser().name, staff: true, text: '' }] },
  };
  if (defaults[name]) return defaults[name];
  const record = copy(examples[name]);
  if (name === 'posts') Object.assign(record, { slug: D.uid('guide-'), title: '', excerpt: '', body: '', takeaways: [], faqs: [], published: false });
  else if (name === 'coupons') Object.assign(record, { code: D.uid('SAVE').toUpperCase(), pct: 10, desc: '', active: true });
  else {
    record.id = D.uid(name + '-'); record.name = '';
    if (name === 'services') Object.assign(record, { summary: '', overview: '', idealFor: [], works: [], competitors: [], process: [], excludes: [], split: [] });
    if (name === 'products') record.active = true;
  }
  return record;
}
const itemExamples = {
  notes: { at: now(), by: '', text: '' },
  items: { type: 'product', ref: PRODUCTS[0].id, qty: 1, title: '', unit: 0, billing: 'once', total: 0, progress: 0 },
  payments: { label: 'Full payment', amount: 0, paid: false, paidAt: null, method: 'Offline' },
  messages: { at: now(), from: '', staff: true, text: '' },
  tags: '', addons: '', takeaways: '', faqs: ['', ''], features: '', for: '', includes: '', extras: '',
};
export function recordManager(query, rerender) {
  const name = Object.hasOwn(labels, query.get('collection')) ? query.get('collection') : 'services';
  const term = (query.get('q') || '').toLowerCase();
  const list = records(D.db(), name).filter(row => JSON.stringify(row).toLowerCase().includes(term));
  return {
    title: 'Manage records',
    html: `<div class="dash-head"><div><h1>Manage records</h1><p class="muted">Shared records. Changes are saved for every device.</p></div><button class="btn primary" data-create>Add ${esc(labels[name].toLowerCase())}</button></div>
      <nav class="chips">${Object.entries(labels).map(([key, text]) => `<a class="chip ${key === name ? 'on' : ''}" href="/admin/records?collection=${key}">${text}</a>`).join('')}</nav>
      <form class="row gap" action="/admin/records"><input type="hidden" name="collection" value="${name}"><input aria-label="Search records" name="q" value="${esc(query.get('q') || '')}" placeholder="Search records"><button class="btn ghost">Search</button></form>
      <p class="muted">${list.length} records</p>
      <section class="card">${list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Record</th><th>Status / type</th><th>Actions</th></tr></thead><tbody>${list.map(row => {
        const id = recordId(name, row);
        return `<tr><td><b>${esc(row.name || row.title || row.subject || row.invoice || row.code || id)}</b><small class="muted" style="display:block">${esc(row.email || id)}</small></td><td>${esc(row.status || row.role || row.billing || (row.published === false ? 'Draft' : 'Published'))}</td><td><div class="row gap"><button class="btn sm ghost" data-view="${esc(id)}">View</button><button class="btn sm ghost" data-edit="${esc(id)}">Edit</button><button class="btn sm danger-ghost" data-delete="${esc(id)}">Delete</button></div></td></tr>`;
      }).join('')}</tbody></table></div>` : empty('No matching records.')}</section>`,
    bind(root) {
      root.querySelector('[data-create]').onclick = () => editor(name, null, rerender);
      for (const button of root.querySelectorAll('[data-view], [data-edit]')) button.onclick = () => {
        const row = records(D.db(), name).find(r => recordId(name, r) === (button.dataset.view || button.dataset.edit));
        editor(name, row, rerender, Boolean(button.dataset.view));
      };
      for (const button of root.querySelectorAll('[data-delete]')) button.onclick = async () => {
        if (!await confirmBox('Delete this record?', 'Related records may prevent deletion. This change applies to all devices.', 'Delete')) return;
        try {
          await D.flush();
          const rows = records(D.db(), name), index = rows.findIndex(r => recordId(name, r) === button.dataset.delete);
          if (index < 0) throw Error('Record no longer exists.');
          rows.splice(index, 1);
          await D.save(); await D.flush();
          toast('Record deleted'); rerender();
        } catch (error) { toast(error.message, 'err'); rerender(); }
      };
    },
  };
}
function editor(name, original, rerender, readOnly = false) {
  const draft = original ? copy(original) : initial(name);
  delete draft.pass;
  if (name === 'posts') draft.published ??= true;
  if (name === 'products') draft.active ??= true;
  const dialog = document.createElement('dialog');
  dialog.className = 'modal wide record-editor';
  let nodes = [], accountPassword = '';
  const defaultExample = examples[name] || initial(name);
  const primaryKey = name === 'posts' ? 'slug' : name === 'coupons' ? 'code' : 'id';
  function renderValue(parent, key, example, depth = 0) {
    const value = parent[key], index = nodes.push({ parent, key, example }) - 1;
    if (Array.isArray(value)) {
      const itemExample = example?.[0] ?? itemExamples[key] ?? value[0] ?? '';
      return `<details class="record-group" ${depth < 1 ? 'open' : ''}><summary>${esc(label(String(key)))} (${value.length})</summary>${value.map((_, i) => `<div class="record-item">${renderValue(value, i, itemExample, depth + 1)}${readOnly ? '' : `<button type="button" class="btn sm danger-ghost" data-remove="${index}|${i}">Remove item ${i + 1}</button>`}</div>`).join('')}${readOnly ? '' : `<button type="button" class="btn sm ghost" data-add="${index}">Add item</button>`}</details>`;
    }
    if (value && typeof value === 'object') return `<fieldset class="record-group"><legend>${esc(typeof key === 'number' ? 'Item ' + (key + 1) : label(key))}</legend>${Object.keys(value).map(k => renderValue(value, k, example?.[k], depth + 1)).join('')}</fieldset>`;
    const title = typeof key === 'number' ? 'Item ' + (key + 1) : label(key);
    const disabled = readOnly || original && key === primaryKey ? 'disabled' : '';
    let options;
    if (key === 'customerId') options = D.db().users.filter(u => u.role === 'customer').map(u => [u.id, u.name + ' · ' + u.email]);
    if (key === 'service') options = [['', 'Choose service'], ...D.catalog().services.map(s => [s.id, s.name])];
    if (key === 'plan') options = D.catalog().plans.map(p => [p.id, p.name]);
    if (key === 'role') options = [['customer', 'Customer'], ['admin', 'Administrator']];
    if (key === 'billing') options = [['once', 'One-time'], ['month', 'Monthly']];
    if (key === 'cycle') options = [['month', 'Monthly'], ['year', 'Yearly']];
    if (key === 'stage') options = LEAD_STAGES.map(s => [s, s]);
    if (key === 'status') {
      const states = { users: ['Active', 'Blocked'], orders: ORDER_STATUSES, subscriptions: ['Active', 'Paused', 'Cancelled', 'Replaced'], tickets: ['Open', 'Pending', 'Closed'] }[name];
      if (states) options = states.map(s => [s, s]);
    }
    const attrs = `data-field="${index}" ${disabled}`;
    let input;
    if (typeof value === 'boolean') input = `<input type="checkbox" ${attrs} ${value ? 'checked' : ''}>`;
    else if (options) input = `<select ${attrs}>${options.map(([v, text]) => `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select>`;
    else if (typeof value === 'number') input = `<input type="number" step="any" ${attrs} value="${value}">`;
    else if (['body', 'overview', 'summary', 'excerpt', 'message', 'text', 'desc'].includes(key) || String(value || '').length > 150) input = `<textarea rows="${key === 'body' ? 12 : 3}" ${attrs}>${esc(value || '')}</textarea>`;
    else input = `<input type="${key === 'email' ? 'email' : 'text'}" ${attrs} value="${esc(value ?? '')}">`;
    return `<label class="field"><span>${esc(title)}</span>${input}</label>`;
  }
  function render() {
    nodes = [];
    const content = Object.keys(draft).filter(k => !['minutes', 'keywords'].includes(k)).map(key => renderValue(draft, key, defaultExample[key])).join('');
    dialog.innerHTML = `<form class="modal-card"><header><h3>${readOnly ? 'View' : original ? 'Edit' : 'Create'} ${esc(labels[name].toLowerCase())}</h3><button type="button" class="btn sm ghost" data-close>Close</button></header><div class="modal-body">${content}${!readOnly && name === 'users' ? '<label class="field"><span>New password (optional, at least 12 characters)</span><input type="password" name="password" minlength="12" maxlength="256" autocomplete="new-password"></label>' : ''}<p role="alert" class="overdue" data-error></p></div><footer><button type="button" class="btn ghost" data-close>Cancel</button>${readOnly ? '' : '<button class="btn primary" type="submit">Save record</button>'}</footer></form>`;
    dialog.querySelectorAll('[data-close]').forEach(b => b.onclick = () => dialog.close());
    dialog.querySelectorAll('[data-field]').forEach(input => input.oninput = () => {
      const { parent, key } = nodes[Number(input.dataset.field)];
      parent[key] = input.type === 'checkbox' ? input.checked : input.type === 'number' ? Number(input.value) : input.value;
    });
    dialog.querySelectorAll('[data-add]').forEach(button => button.onclick = () => {
      const { parent, key, example } = nodes[Number(button.dataset.add)];
      parent[key].push(copy(example?.[0] ?? itemExamples[key] ?? parent[key][0] ?? ''));
      render();
    });
    dialog.querySelectorAll('[data-remove]').forEach(button => button.onclick = () => {
      const [index, item] = button.dataset.remove.split('|').map(Number);
      const { parent, key } = nodes[index];
      parent[key].splice(item, 1); render();
    });
    const passwordInput = dialog.querySelector('[name=password]');
    if (passwordInput) { passwordInput.value = accountPassword; passwordInput.oninput = () => { accountPassword = passwordInput.value; }; }
    dialog.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      const submit = dialog.querySelector('[type=submit]');
      submit.disabled = true;
      try {
        await D.flush();
        const saved = copy(draft);
        if (name === 'users' && accountPassword) saved._password = accountPassword;
        const list = records(D.db(), name);
        const index = original ? list.findIndex(r => recordId(name, r) === recordId(name, original)) : -1;
        if (original && index < 0) throw Error('Record no longer exists.');
        if (!original && list.some(r => recordId(name, r) === recordId(name, draft))) throw Error('This identifier already exists.');
        if (index < 0) list.unshift(saved); else list[index] = saved;
        await D.save(); await D.flush();
        dialog.close(); toast('Record saved'); rerender();
      } catch (error) { dialog.querySelector('[data-error]').textContent = error.message; submit.disabled = false; }
    };
  }
  render();
  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.showModal();
}
