// Admin panel: dashboard, lead CRM + pipeline, customers, orders, subscriptions,
// catalog & pricing editor, support tickets and settings.
import * as D from './db.js';
import { LEAD_STAGES, LEAD_SOURCES, ORDER_STATUSES } from './data.js';
import { esc, icon, toast, field, per, date, dateTime, ago, badge, empty, modal, confirmBox, barChart, initials, $, $$ } from './ui.js';
import { thread, bindThread } from './account.js';

const inr = D.inr;
const k = n => n >= 100000 ? '₹' + (n / 100000).toFixed(1) + 'L' : n >= 1000 ? '₹' + Math.round(n / 1000) + 'k' : '₹' + n;

export const NAV = [
  ['', 'Dashboard', 'chart'],
  ['leads', 'Leads', 'funnel'],
  ['pipeline', 'Pipeline', 'board'],
  ['customers', 'Customers', 'users'],
  ['orders', 'Orders', 'bag'],
  ['subscriptions', 'Subscriptions', 'repeat'],
  ['catalog', 'Services & pricing', 'tag'],
  ['tickets', 'Support', 'help'],
  ['settings', 'Settings', 'settings'],
];

let rerender = () => {};
export const setRerender = fn => { rerender = fn; };

const customers = () => D.db().users.filter(u => u.role === 'customer');
const userById = id => D.db().users.find(u => u.id === id);

export function view({ tab = '', id }, query, user) {
  const tabs = { '': dashboard, leads: id ? leadDetail : leads, pipeline, customers: id ? customerDetail : customerList, orders, subscriptions, catalog, tickets, settings };
  const fn = Object.hasOwn(tabs, tab) && tabs[tab];
  if (!fn) return { redirect: '/admin' };
  return { shell: 'admin', tab, ...fn(user, query, id) };
}

// ---------------- Dashboard ----------------
function dashboard() {
  const d = D.db();
  const now = new Date();
  const months = [...Array(6)].map((_, i) => { const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); return { key: m.getFullYear() + '-' + m.getMonth(), label: m.toLocaleString('en-IN', { month: 'short' }), value: 0 }; });
  d.orders.filter(o => o.status !== 'Cancelled').forEach(o => { const t = new Date(o.createdAt); const m = months.find(m => m.key === t.getFullYear() + '-' + t.getMonth()); if (m) m.value += o.total; });
  const thisMonth = months.at(-1).value;
  const outstanding = d.orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + D.orderBalance(o), 0);
  const activeSubs = d.subscriptions.filter(s => s.status === 'Active');
  const mrr = activeSubs.reduce((s, x) => s + D.subscriptionMonthly(x), 0);
  const leads30 = d.leads.filter(l => Date.now() - new Date(l.createdAt) < 30 * 864e5);
  const closed = d.leads.filter(l => ['Won', 'Lost'].includes(l.stage));
  const winRate = closed.length ? Math.round(d.leads.filter(l => l.stage === 'Won').length / closed.length * 100) : 0;
  const openPipe = d.leads.filter(l => !['Won', 'Lost'].includes(l.stage));
  const bySource = LEAD_SOURCES.map(s => ({ label: s, value: d.leads.filter(l => l.source === s).length })).filter(x => x.value).sort((a, b) => b.value - a.value);
  const due = openPipe.filter(l => l.followUp && new Date(l.followUp) < Date.now() + 2 * 864e5).sort((a, b) => new Date(a.followUp) - new Date(b.followUp));
  const svcRev = {};
  d.orders.forEach(o => o.items.forEach(i => { const key = i.type === 'package' ? D.service(i.ref)?.name : i.type === 'plan' ? 'Memberships' : i.type === 'addon' ? 'Add-ons' : 'Downloads'; svcRev[key] = (svcRev[key] || 0) + i.total; }));
  const top = Object.entries(svcRev).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topMax = top[0]?.[1] || 1;

  return {
    title: 'Admin dashboard',
    html: `
    <div class="dash-head"><div><h1>Dashboard</h1><p class="muted">${now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
      <div class="row gap"><button class="btn ghost" data-newlead>${icon('plus')} Add lead</button><a class="btn primary" href="#/admin/orders">Orders</a></div></div>
    <div class="kpis">
      <div class="kpi"><small>Bookings this month</small><b>${inr(thisMonth)}</b><span>${outstanding ? `<a href="#/admin/orders">${inr(outstanding)} milestone balance due</a>` : 'incl. GST · nothing outstanding'}</span></div>
      <div class="kpi"><small>Monthly recurring (MRR)</small><b>${inr(mrr)}</b><span>${activeSubs.length} active subscriptions</span></div>
      <div class="kpi"><small>New leads (30d)</small><b>${leads30.length}</b><span>${openPipe.length} open · ${k(openPipe.reduce((s, l) => s + (l.value || 0), 0))} pipeline</span></div>
      <div class="kpi"><small>Win rate</small><b>${winRate}%</b><span>${closed.length} closed leads</span></div>
    </div>
    <div class="dash-grid">
      <section class="card span2"><div class="card-head"><h3>Bookings — last 6 months</h3></div>${barChart(months, { fmt: k })}</section>
      <section class="card"><div class="card-head"><h3>Follow-ups due</h3><a class="link" href="#/admin/pipeline">Pipeline</a></div>
        ${due.length ? due.slice(0, 6).map(l => `<a class="list-row link-row" href="#/admin/leads/${l.id}"><div><b>${esc(l.name)}</b><small class="muted">${esc(l.company || l.source)} · ${esc(l.stage)}</small></div><span class="${new Date(l.followUp) < Date.now() ? 'overdue' : 'muted'}">${ago(l.followUp)}</span></a>`).join('') : empty('No follow-ups due.')}</section>
      <section class="card"><div class="card-head"><h3>Lead funnel</h3></div>
        <div class="funnel">${LEAD_STAGES.map(s => { const n = d.leads.filter(l => l.stage === s).length; return `<div><span>${s}</span><i style="width:${Math.max(4, n / Math.max(1, d.leads.length) * 100)}%" class="st-${s.toLowerCase()}"></i><b>${n}</b></div>`; }).join('')}</div></section>
      <section class="card"><div class="card-head"><h3>Leads by source</h3></div>
        <div class="funnel">${bySource.map(s => `<div><span>${esc(s.label)}</span><i style="width:${s.value / bySource[0].value * 100}%"></i><b>${s.value}</b></div>`).join('')}</div></section>
      <section class="card"><div class="card-head"><h3>Top services by revenue</h3></div>
        <div class="funnel">${top.map(([n, v]) => `<div><span>${esc(n)}</span><i style="width:${v / topMax * 100}%" class="st-won"></i><b>${k(v)}</b></div>`).join('')}</div></section>
      <section class="card span2"><div class="card-head"><h3>Recent orders</h3><a class="link" href="#/admin/orders">All</a></div>${orderTable(d.orders.slice(0, 5), true)}</section>
      <section class="card"><div class="card-head"><h3>Activity</h3></div>
        <ul class="feed">${d.activity.slice(0, 8).map(a => `<li><span class="muted">${ago(a.at)}</span>${esc(a.text)}</li>`).join('')}</ul></section>
    </div>`,
    bind: root => $('[data-newlead]', root).addEventListener('click', editLead),
  };
}

// ---------------- Leads ----------------
async function editLead(lead) {
  const isNew = !lead || lead instanceof Event;
  const l = isNew ? {} : lead;
  const f = await modal({ title: isNew ? 'Add lead' : 'Edit lead', submit: isNew ? 'Add lead' : 'Save', wide: true, body: `<div class="grid2">
    ${field('Name', 'name', { value: l.name, required: true })}
    ${field('Company', 'company', { value: l.company })}
    ${field('Email', 'email', { type: 'email', value: l.email, required: true })}
    ${field('Phone', 'phone', { type: 'tel', value: l.phone })}
    ${field('Service interest', 'service', { value: l.service, options: [['', '—'], ...D.catalog().services.map(s => [s.id, s.name])] })}
    ${field('Deal value (₹)', 'value', { type: 'number', value: l.value || 0, attrs: 'min="0" step="500"' })}
    ${field('Source', 'source', { value: l.source || 'Walk-in', options: LEAD_SOURCES })}
    ${field('Stage', 'stage', { value: l.stage || 'New', options: LEAD_STAGES })}
    ${field('Next follow-up', 'followUp', { type: 'date', value: l.followUp ? l.followUp.slice(0, 10) : '' })}
    ${field('Owner', 'owner', { value: l.owner || 'Ranjith Kumar' })}
    </div>${field('Requirement', 'message', { rows: 3, value: l.message })}` });
  if (!f) return;
  const data = Object.fromEntries(f);
  data.value = Number(data.value) || 0; data.budget = data.value;
  data.followUp = data.followUp ? new Date(data.followUp + 'T10:00').toISOString() : null;
  if (isNew) D.addLead(data);
  else { Object.assign(lead, data); lead.score = D.scoreLead(lead); D.save(); }
  toast(isNew ? 'Lead added' : 'Lead updated'); rerender();
}

function leads(user, query) {
  const d = D.db();
  const q = (query.get('q') || '').toLowerCase();
  const stage = query.get('stage') || '';
  const source = query.get('source') || '';
  const sort = query.get('sort') || 'new';
  let list = d.leads.filter(l => (!stage || l.stage === stage) && (!source || l.source === source) && (!q || [l.name, l.company, l.email, l.phone].join(' ').toLowerCase().includes(q)));
  list = list.sort(sort === 'score' ? (a, b) => b.score - a.score : sort === 'value' ? (a, b) => (b.value || 0) - (a.value || 0) : (a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return {
    title: 'Leads',
    html: `<div class="dash-head"><div><h1>Leads</h1><p class="muted">${d.leads.length} total · captured from website forms, audits, quotes and manual entry</p></div>
      <div class="row gap"><button class="btn ghost" data-export>${icon('download')} Export CSV</button><button class="btn primary" data-newlead>${icon('plus')} Add lead</button></div></div>
    <form class="filters card" id="lf">
      <input type="search" name="q" value="${esc(q)}" placeholder="Search name, company, phone…" aria-label="Search leads">
      <select name="stage" aria-label="Stage"><option value="">All stages</option>${LEAD_STAGES.map(s => `<option ${s === stage ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <select name="source" aria-label="Source"><option value="">All sources</option>${LEAD_SOURCES.map(s => `<option ${s === source ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <select name="sort" aria-label="Sort"><option value="new">Newest</option><option value="score" ${sort === 'score' ? 'selected' : ''}>Highest score</option><option value="value" ${sort === 'value' ? 'selected' : ''}>Highest value</option></select>
    </form>
    <div class="card table-wrap">${list.length ? `<table class="table hover"><thead><tr><th>Lead</th><th>Service</th><th>Source</th><th>Value</th><th>Score</th><th>Stage</th><th>Created</th></tr></thead><tbody>
      ${list.map(l => `<tr data-href="#/admin/leads/${l.id}"><td><div class="who"><span class="avatar">${initials(l.name)}</span><div><b>${esc(l.name)}</b><small class="muted">${esc(l.company || l.email)}</small></div></div></td>
        <td>${esc(D.service(l.service)?.name || '—')}</td><td>${esc(l.source)}</td><td>${l.value ? inr(l.value) : '—'}</td>
        <td><span class="score s${Math.floor(l.score / 34)}">${l.score}</span></td><td>${badge(l.stage)}</td><td class="muted">${ago(l.createdAt)}</td></tr>`).join('')}
    </tbody></table>` : empty('No leads match these filters.')}</div>`,
    bind: root => {
      const f = $('#lf', root);
      const apply = () => { const p = new URLSearchParams([...new FormData(f)].filter(([, v]) => v)); history.replaceState(null, '', '#/admin/leads' + (p.toString() ? '?' + p : '')); rerender(); };
      f.addEventListener('change', apply);
      f.addEventListener('submit', e => { e.preventDefault(); apply(); });
      $('[data-newlead]', root).addEventListener('click', () => editLead());
      $('[data-export]', root).addEventListener('click', () => csv('vintorex-leads.csv', ['Name', 'Company', 'Email', 'Phone', 'Service', 'Source', 'Stage', 'Value', 'Score', 'Created'], list.map(l => [l.name, l.company, l.email, l.phone, D.service(l.service)?.name, l.source, l.stage, l.value, l.score, l.createdAt])));
      bindRows(root);
    },
  };
}

function leadDetail(user, query, id) {
  const l = D.db().leads.find(l => l.id === id);
  if (!l) return { redirect: '/admin/leads' };
  const cust = l.customerId && userById(l.customerId);
  const s = D.service(l.service);
  return {
    title: l.name,
    html: `<a class="link back" href="#/admin/leads">← Leads</a>
    <div class="dash-head"><div class="who lg"><span class="avatar lg">${initials(l.name)}</span><div><h1>${esc(l.name)}</h1><p class="muted">${esc(l.company || 'Individual')} · ${esc(l.source)} · created ${date(l.createdAt)}</p></div></div>
      <div class="row gap wrap">
        ${l.phone ? `<a class="btn ghost" href="tel:${esc(l.phone)}">${icon('phoneCall')} Call</a><a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(l.phone.replace(/\D/g, ''))}">${icon('wa')} WhatsApp</a>` : ''}
        <a class="btn ghost" href="mailto:${esc(l.email)}">${icon('mail')} Email</a>
        <button class="btn ghost" data-edit>Edit</button>
        ${cust ? `<a class="btn primary" href="#/admin/customers/${cust.id}">View customer</a>` : `<button class="btn primary" data-convert>Convert to customer</button>`}
      </div></div>
    <div class="stagebar">${LEAD_STAGES.map(st => `<button class="${st === l.stage ? 'on' : ''} st-${st.toLowerCase()}" data-stage="${st}">${st}</button>`).join('')}</div>
    <div class="dash-grid">
      <section class="card"><h3>Details</h3><dl class="kv">
        <div><dt>Email</dt><dd>${esc(l.email)}</dd></div><div><dt>Phone</dt><dd>${esc(l.phone || '—')}</dd></div>
        <div><dt>Service</dt><dd>${s ? `<a href="#/services/${s.id}">${esc(s.name)}</a>` : '—'}</dd></div>
        <div><dt>Deal value</dt><dd>${l.value ? inr(l.value) : '—'}</dd></div>
        <div><dt>Lead score</dt><dd><span class="score s${Math.floor(l.score / 34)}">${l.score}</span></dd></div>
        <div><dt>Owner</dt><dd>${esc(l.owner)}</dd></div>
        <div><dt>Next follow-up</dt><dd>${l.followUp ? `${date(l.followUp)} (${ago(l.followUp)})` : '—'}</dd></div>
      </dl>${l.message ? `<h4>Requirement</h4><p class="pre">${esc(l.message)}</p>` : ''}
      ${s ? `<h4>Suggested packages</h4>${s.tiers.map(t => `<div class="list-row"><span>${esc(t.name)}</span><b>${inr(t.price)}${per(s.billing)}</b></div>`).join('')}` : ''}</section>
      <section class="card span2"><h3>Notes & activity</h3>
        <form class="reply" id="note"><textarea name="text" rows="2" required placeholder="Log a call, meeting or note…" aria-label="Note"></textarea>
          <div class="row gap"><input type="date" name="follow" aria-label="Next follow-up date"><button class="btn primary">Add note</button></div></form>
        <ul class="feed">${l.notes.map(n => `<li><span class="muted">${dateTime(n.at)} · ${esc(n.by)}</span>${esc(n.text)}</li>`).join('') || '<li class="muted">No notes yet.</li>'}</ul>
      </section>
    </div>`,
    bind: root => {
      $('[data-edit]', root).addEventListener('click', () => editLead(l));
      $$('[data-stage]', root).forEach(b => b.addEventListener('click', () => setStage(l, b.dataset.stage, user)));
      $('#note', root).addEventListener('submit', e => {
        e.preventDefault();
        const f = new FormData(e.target);
        l.notes.unshift({ at: new Date().toISOString(), by: user.name, text: f.get('text') });
        if (f.get('follow')) l.followUp = new Date(f.get('follow') + 'T10:00').toISOString();
        if (l.stage === 'New') l.stage = 'Contacted';
        D.save(); toast('Note added'); rerender();
      });
      $('[data-convert]', root)?.addEventListener('click', () => convert(l));
    },
  };
}

function setStage(l, stage, user) {
  if (l.stage === stage) return;
  l.notes.unshift({ at: new Date().toISOString(), by: user.name, text: `Stage changed ${l.stage} → ${stage}` });
  l.stage = stage;
  if (['Won', 'Lost'].includes(stage)) l.followUp = null;
  D.logActivity(`Lead ${l.name} moved to ${stage}`);
  D.save(); rerender();
}

async function convert(l) {
  const f = await modal({ title: 'Convert to customer', submit: 'Create customer', body: `<p>Creates a customer account for <b>${esc(l.name)}</b> (${esc(l.email)}) and marks the lead as Won.</p>
    ${field('Temporary password', 'pw', { value: 'welcome123', required: true, attrs: 'minlength="6"' })}
    <p class="hint">Share the login with the customer. They can subscribe to a paid plan from their dashboard, or you can set one from the customer page.</p>` });
  if (!f) return;
  let u = D.db().users.find(u => u.email.toLowerCase() === l.email.toLowerCase());
  if (!u) {
    u = { id: D.uid('u_'), role: 'customer', name: l.name, email: l.email, phone: l.phone, company: l.company, pass: await D.hash(f.get('pw')), plan: 'free', status: 'Active', createdAt: new Date().toISOString(), tags: [] };
    D.db().users.push(u);
  }
  l.customerId = u.id; l.stage = 'Won'; l.followUp = null;
  l.notes.unshift({ at: new Date().toISOString(), by: 'System', text: 'Converted to customer account' });
  D.logActivity(`Lead ${l.name} converted to customer`);
  D.save(); toast('Customer created'); location.hash = '#/admin/customers/' + u.id;
}

// ---------------- Pipeline (kanban) ----------------
function pipeline() {
  const d = D.db();
  return {
    title: 'Pipeline',
    html: `<div class="dash-head"><div><h1>Sales pipeline</h1><p class="muted">Drag cards between stages.</p></div><button class="btn primary" data-newlead>${icon('plus')} Add lead</button></div>
    <div class="kanban">${LEAD_STAGES.map(st => {
      const list = d.leads.filter(l => l.stage === st);
      return `<section class="kcol" data-col="${st}"><header class="st-${st.toLowerCase()}"><b>${st}</b><span>${list.length} · ${k(list.reduce((s, l) => s + (l.value || 0), 0))}</span></header>
        <div class="kcol-body">${list.map(l => `<article class="kcard" draggable="true" data-id="${l.id}" tabindex="0">
          <b>${esc(l.name)}</b><small class="muted">${esc(l.company || l.source)}</small>
          <div class="row between"><span>${l.value ? k(l.value) : '—'}</span><span class="score s${Math.floor(l.score / 34)}">${l.score}</span></div>
          ${l.followUp ? `<small class="${new Date(l.followUp) < Date.now() ? 'overdue' : 'muted'}">Follow-up ${ago(l.followUp)}</small>` : ''}
        </article>`).join('')}</div></section>`;
    }).join('')}</div>`,
    bind: (root, user) => {
      $('[data-newlead]', root).addEventListener('click', () => editLead());
      let dragId = null;
      $$('.kcard', root).forEach(c => {
        c.addEventListener('dragstart', e => { dragId = c.dataset.id; e.dataTransfer.effectAllowed = 'move'; c.classList.add('dragging'); });
        c.addEventListener('dragend', () => c.classList.remove('dragging'));
        c.addEventListener('click', () => { location.hash = '#/admin/leads/' + c.dataset.id; });
        c.addEventListener('keydown', e => { if (e.key === 'Enter') location.hash = '#/admin/leads/' + c.dataset.id; });
      });
      $$('[data-col]', root).forEach(col => {
        col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
        col.addEventListener('dragleave', () => col.classList.remove('over'));
        col.addEventListener('drop', e => {
          e.preventDefault(); col.classList.remove('over');
          const l = D.db().leads.find(l => l.id === dragId);
          if (l) setStage(l, col.dataset.col, D.currentUser());
        });
      });
    },
  };
}

// ---------------- Customers ----------------
function customerList(user, query) {
  const q = (query.get('q') || '').toLowerCase();
  const list = customers().filter(c => !q || [c.name, c.company, c.email, c.phone].join(' ').toLowerCase().includes(q));
  const d = D.db();
  return {
    title: 'Customers',
    html: `<div class="dash-head"><div><h1>Customers</h1><p class="muted">${customers().length} accounts</p></div><button class="btn primary" data-new>${icon('plus')} Add customer</button></div>
    <form class="filters card" id="cf"><input type="search" name="q" value="${esc(q)}" placeholder="Search customers…" aria-label="Search customers"></form>
    <div class="card table-wrap"><table class="table hover"><thead><tr><th>Customer</th><th>Plan</th><th>Orders</th><th>Lifetime value</th><th>MRR</th><th>Status</th><th>Since</th></tr></thead><tbody>
    ${list.map(c => {
      const os = d.orders.filter(o => o.customerId === c.id);
      const mrr = d.subscriptions.filter(s => s.customerId === c.id && s.status === 'Active').reduce((s, x) => s + D.subscriptionMonthly(x), 0);
      return `<tr data-href="#/admin/customers/${c.id}"><td><div class="who"><span class="avatar">${initials(c.name)}</span><div><b>${esc(c.name)}</b><small class="muted">${esc(c.company || c.email)}</small></div></div></td>
      <td>${esc(D.plan(c.plan || 'free')?.name)}</td><td>${os.length}</td><td>${inr(os.reduce((s, o) => s + o.total, 0))}</td><td>${mrr ? inr(mrr) : '—'}</td><td>${badge(c.status)}</td><td class="muted">${date(c.createdAt)}</td></tr>`;
    }).join('')}</tbody></table></div>`,
    bind: root => {
      $('#cf', root).addEventListener('submit', e => { e.preventDefault(); const v = e.target.q.value; history.replaceState(null, '', '#/admin/customers' + (v ? '?q=' + encodeURIComponent(v) : '')); rerender(); });
      $('[data-new]', root).addEventListener('click', async () => {
        const f = await modal({ title: 'Add customer', submit: 'Create', body: `${field('Name', 'name', { required: true })}${field('Email', 'email', { type: 'email', required: true })}${field('Phone', 'phone', { type: 'tel' })}${field('Company', 'company')}${field('Temporary password', 'password', { value: 'welcome123', required: true, attrs: 'minlength="6"' })}` });
        if (!f) return;
        const sess = D.currentUser();
        try {
          const u = await D.register(Object.fromEntries(f));
          localStorage.setItem('vx_session', sess.id); // register signs in; keep the admin session
          toast('Customer created'); location.hash = '#/admin/customers/' + u.id;
        } catch (err) { localStorage.setItem('vx_session', sess.id); toast(err.message, 'err'); }
      });
      bindRows(root);
    },
  };
}

function customerDetail(user, query, id) {
  const c = userById(id);
  if (!c || c.role !== 'customer') return { redirect: '/admin/customers' };
  const d = D.db();
  const os = d.orders.filter(o => o.customerId === c.id);
  const subs = d.subscriptions.filter(s => s.customerId === c.id);
  const ts = d.tickets.filter(t => t.customerId === c.id);
  const lead = d.leads.find(l => l.customerId === c.id);
  return {
    title: c.name,
    html: `<a class="link back" href="#/admin/customers">← Customers</a>
    <div class="dash-head"><div class="who lg"><span class="avatar lg">${initials(c.name)}</span><div><h1>${esc(c.name)}</h1><p class="muted">${esc(c.company || '')} · ${esc(c.email)} · ${esc(c.phone || '')}</p></div></div>
      <div class="row gap wrap">${lead ? `<a class="btn ghost" href="#/admin/leads/${lead.id}">Lead history</a>` : ''}
      <button class="btn ghost" data-plan>Change plan</button>
      <button class="btn ${c.status === 'Blocked' ? 'primary' : 'danger-ghost'}" data-block>${c.status === 'Blocked' ? 'Unblock' : 'Block'}</button></div></div>
    <div class="kpis">
      <div class="kpi"><small>Plan</small><b>${esc(D.plan(c.plan || 'free')?.name)}</b></div>
      <div class="kpi"><small>Lifetime value</small><b>${inr(os.reduce((s, o) => s + o.total, 0))}</b></div>
      <div class="kpi"><small>MRR</small><b>${inr(subs.filter(s => s.status === 'Active').reduce((s, x) => s + D.subscriptionMonthly(x), 0))}</b></div>
      <div class="kpi"><small>Open tickets</small><b>${ts.filter(t => t.status !== 'Closed').length}</b></div>
    </div>
    <section class="card"><h3>Orders</h3>${os.length ? orderTable(os) : empty('No orders.')}</section>
    <section class="card"><h3>Subscriptions</h3>${subs.length ? subTable(subs) : empty('No subscriptions.')}</section>
    <section class="card"><h3>Support tickets</h3>${ts.length ? ts.map(t => `<a class="list-row link-row" href="#/admin/tickets?t=${t.id}"><span>#${t.number} ${esc(t.subject)}</span>${badge(t.status)}</a>`).join('') : empty('No tickets.')}</section>`,
    bind: root => {
      $('[data-block]', root).addEventListener('click', () => { c.status = c.status === 'Blocked' ? 'Active' : 'Blocked'; D.save(); toast(`Customer ${c.status.toLowerCase()}`); rerender(); });
      $('[data-plan]', root).addEventListener('click', async () => {
        const f = await modal({ title: 'Change membership', submit: 'Apply', body: `${field('Plan', 'plan', { value: c.plan || 'free', options: D.catalog().plans.map(p => [p.id, `${p.name} (${inr(p.price)}/mo)`]) })}<p class="hint">Applies immediately without payment (for offline or complimentary deals).</p>` });
        if (!f) return;
        const pid = f.get('plan');
        d.subscriptions.filter(s => s.customerId === c.id && s.plan && ['Active', 'Paused'].includes(s.status)).forEach(s => { s.status = 'Replaced'; });
        if (pid !== 'free') d.subscriptions.unshift({ id: D.uid('s_'), customerId: c.id, plan: pid, cycle: 'month', status: 'Active', startedAt: new Date().toISOString(), renewsAt: new Date(Date.now() + 30 * 864e5).toISOString(), addons: [] });
        c.plan = pid; D.logActivity(`${c.name} moved to ${D.plan(pid).name} by admin`); D.save(); toast('Plan updated'); rerender();
      });
      bindOrderControls(root); bindSubControls(root);
    },
  };
}

// ---------------- Orders ----------------
function orderTable(list, compact = false) {
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Invoice</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th>${compact ? '' : '<th>Progress</th><th></th>'}</tr></thead><tbody>
  ${list.map(o => {
    const c = userById(o.customerId);
    const proj = o.items.filter(i => i.type !== 'product' && i.billing === 'once');
    const prog = proj.length ? Math.round(proj.reduce((s, i) => s + i.progress, 0) / proj.length) : 100;
    const bal = D.orderBalance(o);
    const pays = D.orderPayments(o);
    return `<tr><td><b>${esc(o.invoice)}</b><small class="muted block">${date(o.createdAt)}</small></td>
    <td>${c ? `<a href="#/admin/customers/${c.id}">${esc(c.name)}</a>` : '—'}</td>
    <td class="muted">${o.items.map(i => esc(i.title)).join('<br>')}</td><td><b>${inr(o.total)}</b></td>
    <td>${bal ? `${badge(`${pays.filter(p => p.paid).length}/${pays.length} paid`, 'amber')}<small class="muted block">${inr(bal)} due</small>${compact ? '' : `<button class="btn sm ghost" data-record="${o.id}">Record payment</button>`}` : badge(pays.length > 1 ? 'Milestones paid' : 'Paid', 'green')}</td>
    <td>${compact ? badge(o.status) : `<select data-status="${o.id}" aria-label="Order status">${ORDER_STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>`}</td>
    ${compact ? '' : `<td>${proj.length ? `<input type="range" min="0" max="100" step="5" value="${prog}" data-progress="${o.id}" aria-label="Progress"> <span class="muted">${prog}%</span>` : '<span class="muted">—</span>'}</td>
    <td class="right"><a class="btn sm ghost" href="#/invoice/${o.id}">Invoice</a></td>`}</tr>`;
  }).join('')}</tbody></table></div>`;
}
function bindOrderControls(root) {
  $$('[data-record]', root).forEach(b => b.addEventListener('click', async () => {
    const o = D.db().orders.find(o => o.id === b.dataset.record);
    const next = D.orderPayments(o).find(p => !p.paid);
    const f = await modal({ title: `Record payment — ${o.invoice}`, submit: `Mark ${inr(next.amount)} paid`, body: `
      <p><b>${esc(next.label)}</b> · ${inr(next.amount)} (balance ${inr(D.orderBalance(o))})</p>
      ${field('Received via', 'method', { options: ['UPI', 'Bank transfer', 'Cash', 'Cheque', 'Card'] })}` });
    if (!f) return;
    D.payNext(o, f.get('method'), D.currentUser().name);
    toast('Payment recorded'); rerender();
  }));
  $$('[data-status]', root).forEach(s => s.addEventListener('change', () => {
    const o = D.db().orders.find(o => o.id === s.dataset.status);
    o.status = s.value;
    if (s.value === 'Delivered') o.items.forEach(i => { i.progress = 100; });
    D.logActivity(`${o.invoice} marked ${s.value}`); D.save(); toast(`${o.invoice} → ${s.value}`); rerender();
  }));
  $$('[data-progress]', root).forEach(r => r.addEventListener('change', () => {
    const o = D.db().orders.find(o => o.id === r.dataset.progress);
    o.items.filter(i => i.type !== 'product' && i.billing === 'once').forEach(i => { i.progress = Number(r.value); });
    if (o.status === 'Pending' && r.value > 0) o.status = 'In progress';
    D.save(); toast('Progress updated — visible on the customer dashboard'); rerender();
  }));
}

function orders(user, query) {
  const st = query.get('status') || '';
  const list = D.db().orders.filter(o => !st || o.status === st);
  const total = list.reduce((s, o) => s + o.total, 0);
  return {
    title: 'Orders',
    html: `<div class="dash-head"><div><h1>Orders</h1><p class="muted">${list.length} orders · ${inr(total)}</p></div><button class="btn ghost" data-export>${icon('download')} Export CSV</button></div>
    <nav class="chips"><a class="chip ${!st ? 'on' : ''}" href="#/admin/orders">All</a>${ORDER_STATUSES.map(s => `<a class="chip ${s === st ? 'on' : ''}" href="#/admin/orders?status=${encodeURIComponent(s)}">${s} <small>${D.db().orders.filter(o => o.status === s).length}</small></a>`).join('')}</nav>
    <section class="card">${list.length ? orderTable(list) : empty('No orders.')}</section>`,
    bind: root => {
      bindOrderControls(root);
      $('[data-export]', root).addEventListener('click', () => csv('vintorex-orders.csv', ['Invoice', 'Date', 'Customer', 'Items', 'Subtotal', 'Discount', 'GST', 'Total', 'Status'], list.map(o => [o.invoice, o.createdAt, userById(o.customerId)?.name, o.items.map(i => i.title).join('; '), o.subtotal, o.discount, o.gst, o.total, o.status])));
    },
  };
}

// ---------------- Subscriptions ----------------
function subTable(list) {
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Customer</th><th>Subscription</th><th>Add-ons</th><th>Monthly</th><th>Status</th><th>Renews</th><th></th></tr></thead><tbody>
  ${list.map(s => `<tr><td>${esc(userById(s.customerId)?.name || '—')}</td><td>${esc(D.subscriptionTitle(s))}</td>
    <td class="muted">${s.addons.map(a => esc(D.addon(a)?.name)).join(', ') || '—'}</td><td>${inr(D.subscriptionMonthly(s))}</td><td>${badge(s.status)}</td><td>${['Active', 'Paused'].includes(s.status) ? date(s.renewsAt) : '—'}</td>
    <td class="right">${s.status === 'Active' ? `<button class="btn sm ghost" data-sub="${s.id}|Paused">Pause</button>` : s.status === 'Paused' ? `<button class="btn sm ghost" data-sub="${s.id}|Active">Resume</button>` : ''}
    ${['Active', 'Paused'].includes(s.status) ? `<button class="btn sm danger-ghost" data-sub="${s.id}|Cancelled">Cancel</button>` : ''}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function bindSubControls(root) {
  $$('[data-sub]', root).forEach(b => b.addEventListener('click', async () => {
    const [id, st] = b.dataset.sub.split('|');
    const s = D.db().subscriptions.find(s => s.id === id);
    if (st === 'Cancelled' && !await confirmBox('Cancel subscription?', `${D.subscriptionTitle(s)} for ${userById(s.customerId)?.name}`, 'Cancel it')) return;
    s.status = st;
    if (st === 'Cancelled' && s.plan) { const u = userById(s.customerId); if (u) u.plan = 'free'; }
    D.logActivity(`${D.subscriptionTitle(s)} → ${st}`); D.save(); rerender();
  }));
}
function subscriptions() {
  const list = D.db().subscriptions.filter(s => s.status !== 'Replaced');
  const active = list.filter(s => s.status === 'Active');
  const mrr = active.reduce((s, x) => s + D.subscriptionMonthly(x), 0);
  const byPlan = D.catalog().plans.filter(p => p.price).map(p => ({ p, n: active.filter(s => s.plan === p.id).length }));
  return {
    title: 'Subscriptions',
    html: `<div class="dash-head"><h1>Subscriptions</h1></div>
    <div class="kpis"><div class="kpi"><small>MRR</small><b>${inr(mrr)}</b></div><div class="kpi"><small>ARR run-rate</small><b>${inr(mrr * 12)}</b></div>
    ${byPlan.map(({ p, n }) => `<div class="kpi"><small>${esc(p.name)} members</small><b>${n}</b></div>`).join('')}</div>
    <section class="card">${list.length ? subTable(list) : empty('No subscriptions.')}</section>`,
    bind: bindSubControls,
  };
}

// ---------------- Catalog & pricing ----------------
function catalog(user, query) {
  const c = D.catalog();
  const tab = query.get('t') || 'services';
  const tabs = [['services', 'Service packages'], ['plans', 'Membership plans'], ['addons', 'Add-ons'], ['products', 'Downloads'], ['coupons', 'Coupons']];
  let body = '';
  if (tab === 'services') body = c.services.map((s, si) => `<section class="card"><div class="card-head"><div><h3>${esc(s.name)}</h3><small class="muted">Market ${inr(s.market[0])}–${inr(s.market[1])}${per(s.billing)} · ${s.billing === 'month' ? 'Monthly' : 'One-time'}</small></div><a class="link" href="#/services/${s.id}" target="_blank" rel="noopener">View page</a></div>
    <div class="price-edit">${s.tiers.map((t, ti) => `<label><span>${esc(t.name)}</span><input type="number" min="0" step="1" value="${t.price}" data-price="services|${si}|${ti}" aria-label="${esc(s.name + ' ' + t.name)} price"><small class="${t.price < s.market[0] ? 'good' : t.price > s.market[1] ? 'overdue' : 'muted'}">${t.price < s.market[0] ? 'Below market' : t.price > s.market[1] ? 'Above market' : 'Within market'}</small></label>`).join('')}</div>
    ${s.competitors.length ? `<details class="comp-peek"><summary>Competitor prices (${s.competitors.length})</summary>${s.competitors.map(x => `<div class="list-row"><span><b>${esc(x.name)}</b> <small class="muted">${esc(x.kind)}</small></span><span>${esc(x.price)}</span></div>`).join('')}</details>` : ''}
    <p class="fine">${s.works.length} work items · price split scales with the price you set.</p></section>`).join('');
  if (tab === 'plans') body = c.plans.map((p, i) => `<section class="card"><div class="card-head"><h3>${esc(p.name)}</h3></div><div class="price-edit">
    <label><span>Monthly price</span><input type="number" min="0" value="${p.price}" data-price="plans|${i}|price"></label>
    <label><span>Member discount %</span><input type="number" min="0" max="50" value="${p.discount}" data-price="plans|${i}|discount"></label></div>
    <ul class="ticks col">${p.features.map(f => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul></section>`).join('');
  if (tab === 'addons') body = `<section class="card"><div class="price-edit">${c.addons.map((a, i) => `<label><span>${esc(a.name)} <small class="muted">${a.billing === 'month' ? '/mo' : 'once'}</small></span><input type="number" min="0" value="${a.price}" data-price="addons|${i}|price"></label>`).join('')}</div></section>`;
  if (tab === 'products') body = `<section class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>MRP</th><th>Price</th><th>Listed</th></tr></thead><tbody>${c.products.map((p, i) => `<tr><td>${esc(p.name)}</td><td><input type="number" min="0" value="${p.mrp}" data-price="products|${i}|mrp" aria-label="MRP"></td><td><input type="number" min="0" value="${p.price}" data-price="products|${i}|price" aria-label="Price"></td><td><input type="checkbox" ${p.active !== false ? 'checked' : ''} data-toggle="products|${i}" aria-label="Listed"></td></tr>`).join('')}</tbody></table></div></section>`;
  if (tab === 'coupons') body = `<section class="card"><div class="card-head"><h3>Coupons</h3><button class="btn sm primary" data-coupon>${icon('plus')} New coupon</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Code</th><th>Discount</th><th>Description</th><th>Active</th></tr></thead><tbody>${c.coupons.map((p, i) => `<tr><td><b>${esc(p.code)}</b></td><td>${p.pct}%</td><td>${esc(p.desc)}</td><td><input type="checkbox" ${p.active !== false ? 'checked' : ''} data-toggle="coupons|${i}" aria-label="Active"></td></tr>`).join('')}</tbody></table></div></section>`;
  return {
    title: 'Services & pricing',
    html: `<div class="dash-head"><div><h1>Services & pricing</h1><p class="muted">Changes go live on the storefront immediately.</p></div></div>
    <nav class="chips">${tabs.map(([id, n]) => `<a class="chip ${id === tab ? 'on' : ''}" href="#/admin/catalog?t=${id}">${n}</a>`).join('')}</nav>${body}`,
    bind: root => {
      $$('[data-price]', root).forEach(inp => inp.addEventListener('change', () => {
        const [coll, i, key] = inp.dataset.price.split('|');
        if (coll === 'services') c.services[i].tiers[key].price = Number(inp.value);
        else c[coll][i][key] = Number(inp.value);
        D.save(); toast('Price saved'); rerender();
      }));
      $$('[data-toggle]', root).forEach(inp => inp.addEventListener('change', () => { const [coll, i] = inp.dataset.toggle.split('|'); c[coll][i].active = inp.checked; D.save(); toast('Saved'); }));
      $('[data-coupon]', root)?.addEventListener('click', async () => {
        const f = await modal({ title: 'New coupon', submit: 'Create', body: `${field('Code', 'code', { required: true, attrs: 'pattern="[A-Za-z0-9]{3,20}"' })}${field('Discount %', 'pct', { type: 'number', required: true, attrs: 'min="1" max="90"' })}${field('Description', 'desc')}` });
        if (!f) return;
        const code = f.get('code').toUpperCase();
        if (c.coupons.some(x => x.code === code)) return toast('Coupon already exists', 'err');
        c.coupons.push({ code, pct: Number(f.get('pct')), desc: f.get('desc'), active: true }); D.save(); toast('Coupon created'); rerender();
      });
    },
  };
}

// ---------------- Tickets ----------------
function tickets(user, query) {
  const st = ['open', 'closed', 'all'].includes(query.get('s')) ? query.get('s') : 'open';
  const all = D.db().tickets;
  const list = all.filter(t => st === 'all' || (st === 'open' ? t.status !== 'Closed' : t.status === 'Closed'));
  const open = all.find(t => t.id === query.get('t')) || list[0];
  return {
    title: 'Support',
    html: `<div class="dash-head"><h1>Support tickets</h1></div>
    <nav class="chips">${[['open', 'Open'], ['closed', 'Closed'], ['all', 'All']].map(([id, n]) => `<a class="chip ${id === st ? 'on' : ''}" href="#/admin/tickets?s=${id}">${n}</a>`).join('')}</nav>
    ${list.length || open ? `<div class="inbox">
      <nav class="card inbox-list">${list.map(t => `<a href="#/admin/tickets?s=${st}&t=${t.id}" class="${t === open ? 'on' : ''}"><b>#${t.number} ${esc(t.subject)}</b><span class="row between"><small class="muted">${esc(userById(t.customerId)?.name)} · ${ago(t.messages.at(-1).at)}</small>${badge(t.priority)}</span></a>`).join('')}</nav>
      <div>${open ? `<div class="row gap ticket-tools">
        <select data-tprio aria-label="Priority">${['Low', 'Normal', 'High'].map(p => `<option ${p === open.priority ? 'selected' : ''}>${p}</option>`).join('')}</select>
        <button class="btn sm ghost" data-tclose>${open.status === 'Closed' ? 'Reopen' : 'Close ticket'}</button>
        <a class="btn sm ghost" href="#/admin/customers/${open.customerId}">Customer</a></div>${thread(open, user)}` : ''}</div>
    </div>` : empty('No tickets here.')}`,
    bind: root => {
      if (!open) return;
      bindThread(root, open, user, true);
      $('[data-tprio]', root).addEventListener('change', e => { open.priority = e.target.value; D.save(); toast('Priority updated'); rerender(); });
      $('[data-tclose]', root).addEventListener('click', () => { open.status = open.status === 'Closed' ? 'Open' : 'Closed'; D.save(); rerender(); });
    },
  };
}

// ---------------- Settings ----------------
function settings() {
  const s = D.db().settings;
  return {
    title: 'Settings',
    html: `<div class="dash-head"><h1>Settings</h1></div>
    <div class="cards2">
      <form class="card" id="biz"><h3>Business & invoicing</h3>
        ${field('Business name', 'businessName', { value: s.businessName, required: true })}
        ${field('Email', 'email', { type: 'email', value: s.email })}
        ${field('Phone', 'phone', { value: s.phone })}
        ${field('Address', 'address', { value: s.address, rows: 2 })}
        ${field('GSTIN', 'gstin', { value: s.gstin })}
        ${field('GST rate %', 'gst', { type: 'number', value: s.gst, attrs: 'min="0" max="28"' })}
        <button class="btn primary">Save</button></form>
      <div class="card"><h3>Payments & integrations</h3>
        <p class="muted">Checkout runs in demo mode. To accept real payments, connect a server that creates Razorpay orders and verifies the payment signature — the key secret must never be placed in this browser app.</p>
        <ul class="ticks col"><li>${icon('check')}Razorpay / UPI — server endpoint required</li><li>${icon('check')}WhatsApp Business API — for lead alerts</li><li>${icon('check')}Email (SMTP / Brevo) — for order mails</li></ul>
        <h3>Data</h3>
        <div class="row gap wrap"><button class="btn ghost" data-backup>${icon('download')} Backup JSON</button><button class="btn danger-ghost" data-reset>Reset demo data</button></div>
      </div>
    </div>`,
    bind: root => {
      $('#biz', root).addEventListener('submit', e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); f.gst = Number(f.gst); Object.assign(s, f); D.save(); toast('Settings saved'); });
      $('[data-backup]', root).addEventListener('click', () => download('vintorex-backup.json', JSON.stringify(D.db(), (k, v) => k === 'pass' ? undefined : v, 2), 'application/json'));
      $('[data-reset]', root).addEventListener('click', async () => {
        if (!await confirmBox('Reset all data?', 'Every lead, order and customer is replaced with demo data.', 'Reset')) return;
        await D.resetDemo(); localStorage.setItem('vx_session', 'u_admin'); toast('Demo data restored'); rerender();
      });
    },
  };
}

// ---------------- helpers ----------------
function bindRows(root) {
  $$('tr[data-href]', root).forEach(r => { r.tabIndex = 0; r.addEventListener('click', () => { location.hash = r.dataset.href; }); r.addEventListener('keydown', e => { if (e.key === 'Enter') location.hash = r.dataset.href; }); });
}
function download(name, text, type = 'text/csv') {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  a.click(); URL.revokeObjectURL(a.href);
}
function csv(name, head, rows) {
  // text starting with = + - @ would run as a formula in Excel or Sheets
  const cell = v => { let s = String(v ?? ''); if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  download(name, [head, ...rows].map(r => r.map(cell).join(',')).join('\n'));
}
