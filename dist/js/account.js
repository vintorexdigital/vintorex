// Customer dashboard: plan, add-ons, orders, downloads, invoices, support, profile.
import * as D from './db.js';
import { esc, icon, toast, field, per, date, dateTime, ago, badge, empty, modal, confirmBox, $, $$ } from './ui.js';
import { paymentSchedule } from './public.js';
import * as Pay from './pay.js';

const inr = D.inr;
export const NAV = [
  ['', 'Overview', 'home'],
  ['subscription', 'My plan & add-ons', 'repeat'],
  ['orders', 'Projects & orders', 'bag'],
  ['downloads', 'Downloads', 'download'],
  ['invoices', 'Invoices', 'receipt'],
  ['support', 'Support', 'help'],
  ['profile', 'Profile', 'user'],
];

let rerender = () => {};
export const setRerender = fn => { rerender = fn; };

const mine = (coll, user) => D.db()[coll].filter(x => x.customerId === user.id);

export function view({ tab = '' }, query, user) {
  const tabs = { '': overview, subscription, orders, downloads, invoices, support, profile };
  const fn = Object.hasOwn(tabs, tab) && tabs[tab];
  if (!fn) return { redirect: '/account' };
  const v = fn(user, query);
  return { shell: 'account', tab, ...v };
}

function overview(user) {
  const membership = D.activeMembership(user.id);
  const p = D.plan(membership?.plan || 'free');
  const orders = mine('orders', user);
  const active = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
  const subs = mine('subscriptions', user).filter(s => s.status === 'Active');
  const monthly = subs.reduce((s, x) => s + D.subscriptionMonthly(x), 0);
  const spent = orders.reduce((s, o) => s + D.orderPaid(o), 0);
  const due = orders.reduce((s, o) => s + D.orderBalance(o), 0);
  const tickets = mine('tickets', user).filter(t => t.status !== 'Closed');
  return {
    title: 'Dashboard',
    html: `
    <div class="dash-head"><div><h1>Hello, ${esc(user.name.split(' ')[0])} 👋</h1><p class="muted">${esc(user.company || 'Your account')} · Member since ${date(user.createdAt)}</p></div>
      <a class="btn primary" href="#/services">${icon('plus')} New project</a></div>
    <div class="kpis">
      <div class="kpi"><small>Current plan</small><b>${esc(p?.name || 'Basic')}</b><span>${membership ? 'Renews ' + date(membership.renewsAt) : '<a href="#/pricing">Upgrade for discounts</a>'}</span></div>
      <div class="kpi"><small>Active projects</small><b>${active.length}</b><span>${orders.length} orders total</span></div>
      <div class="kpi"><small>Monthly services</small><b>${inr(monthly)}</b><span>${subs.length} active subscriptions</span></div>
      <div class="kpi"><small>Total paid</small><b>${inr(spent)}</b><span>${due ? `<a href="#/account/orders">${inr(due)} milestone balance due</a>` : 'incl. GST · nothing due'}</span></div>
    </div>
    <div class="dash-grid">
      <section class="card">
        <div class="card-head"><h3>Project progress</h3><a class="link" href="#/account/orders">All</a></div>
        ${active.length ? active.flatMap(o => o.items.filter(i => i.type !== 'product' && i.billing === 'once').map(i => progressRow(o, i))).join('') || empty('No active one-time projects.') : empty('No active projects right now.', '<a class="btn sm ghost" href="#/services">Start one</a>')}
      </section>
      <section class="card">
        <div class="card-head"><h3>Your ${esc(p?.name || 'Basic')} benefits</h3><a class="link" href="#/account/subscription">Manage</a></div>
        <ul class="ticks col">${(p?.features || []).map(f => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>
        ${p?.id !== 'elite' ? `<a class="btn ghost block" href="#/pricing">${icon('star')} Upgrade plan</a>` : ''}
      </section>
      <section class="card">
        <div class="card-head"><h3>Open support tickets</h3><a class="link" href="#/account/support">All</a></div>
        ${tickets.length ? tickets.map(t => `<div class="list-row"><div><b>#${t.number} ${esc(t.subject)}</b><small class="muted">${ago(t.messages.at(-1).at)}</small></div>${badge(t.status)}</div>`).join('') : empty('No open tickets — all good!')}
      </section>
      <section class="card">
        <div class="card-head"><h3>Recommended for you</h3></div>
        ${recommend(user).map(s => `<a class="list-row link-row" href="#/services/${s.id}"><div><b>${esc(s.name)}</b><small class="muted">${esc(s.summary)}</small></div>${icon('arrow')}</a>`).join('')}
      </section>
    </div>`,
  };
}

function recommend(user) {
  const owned = new Set(mine('orders', user).flatMap(o => o.items.map(i => i.ref)));
  mine('subscriptions', user).forEach(s => owned.add(s.service));
  return D.catalog().services.filter(s => !owned.has(s.id)).slice(0, 3);
}

const STEPS = ['Brief', 'Design', 'Build', 'Review', 'Live'];
function progressRow(o, i) {
  const step = Math.min(STEPS.length - 1, Math.floor(i.progress / 25));
  return `<div class="progress-row">
    <div class="row between"><b>${esc(i.title)}</b><span class="muted">${i.progress}%</span></div>
    <div class="progress"><i style="width:${i.progress}%"></i></div>
    <ol class="steps">${STEPS.map((s, n) => `<li class="${n <= step ? 'done' : ''}">${s}</li>`).join('')}</ol>
    <small class="muted">${esc(o.invoice)} · ${badge(o.status)}</small>
  </div>`;
}

function subscription(user, query) {
  const subs = mine('subscriptions', user);
  const membership = D.activeMembership(user.id);
  const p = D.plan(membership?.plan || 'free');
  const others = subs.filter(s => !s.plan && s.status !== 'Replaced');
  const addons = D.catalog().addons.filter(a => a.billing === 'month');
  return {
    title: 'My plan',
    html: `
    <div class="dash-head"><h1>My plan & add-ons</h1></div>
    <section class="card plan-now">
      <div><small class="muted">Current membership</small><h2>${esc(p.name)}</h2>
        <p>${membership ? `${inr(D.subscriptionMonthly(membership))}/mo incl. add-ons · ${membership.cycle === 'year' ? 'Annual' : 'Monthly'} · ${membership.status === 'Paused' ? 'Paused' : 'Renews ' + date(membership.renewsAt)}` : 'Free plan — no billing'}</p></div>
      <div class="row gap wrap">
        ${D.catalog().plans.filter(x => x.id !== p.id && x.price).map(x => `<button class="btn ${x.price > (p.price || 0) ? 'primary' : 'ghost'}" data-switch="${x.id}">${x.price > (p.price || 0) ? 'Upgrade' : 'Switch'} to ${esc(x.name)}</button>`).join('')}
        ${membership ? `<button class="btn ghost" data-pause="${membership.id}">${membership.status === 'Paused' ? 'Resume' : 'Pause'}</button><button class="btn danger-ghost" data-cancel="${membership.id}">Cancel plan</button>` : ''}
      </div>
    </section>

    <h2 class="h3">Monthly add-ons</h2>
    ${membership ? '' : '<p class="hint">Add-ons attach to a membership. Subscribe to Premium or Elite to add them.</p>'}
    <div class="cards3">${addons.map(a => {
      const on = membership?.addons.includes(a.id);
      return `<article class="card addon ${on ? 'on' : ''}"><div><h4>${esc(a.name)}</h4><p>${esc(a.desc)}</p></div>
        <div class="addon-foot"><b>${inr(a.price)}<small>/mo</small></b>
        ${membership ? `<button class="btn sm ${on ? 'ghost' : 'primary'}" data-addon="${a.id}">${on ? 'Remove' : 'Add'}</button>` : ''}</div></article>`;
    }).join('')}</div>

    <h2 class="h3">Service subscriptions</h2>
    <div class="card table-wrap">${others.length ? `<table class="table"><thead><tr><th>Service</th><th>Price</th><th>Status</th><th>Renews</th><th></th></tr></thead><tbody>
      ${others.map(s => `<tr><td>${esc(D.subscriptionTitle(s))}</td><td>${inr(D.subscriptionMonthly(s))}/mo</td><td>${badge(s.status)}</td><td>${s.status === 'Active' ? date(s.renewsAt) : '—'}</td>
      <td class="right">${s.status === 'Active' ? `<button class="btn sm ghost" data-cancel="${s.id}">Cancel</button>` : ''}</td></tr>`).join('')}
    </tbody></table>` : empty('No monthly services yet.', '<a class="btn sm ghost" href="#/services?cat=grow">Browse growth services</a>')}</div>`,
    bind: root => {
      $$('[data-switch]', root).forEach(b => b.addEventListener('click', () => {
        D.addToCart({ type: 'plan', ref: b.dataset.switch, cycle: membership?.cycle || 'month' });
        location.hash = '#/cart';
      }));
      $$('[data-addon]', root).forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.addon; const i = membership.addons.indexOf(id);
        if (i >= 0) membership.addons.splice(i, 1); else membership.addons.push(id);
        D.logActivity(`${user.name} ${i >= 0 ? 'removed' : 'added'} add-on ${D.addon(id).name}`);
        D.save(); toast(i >= 0 ? 'Add-on removed from next bill' : 'Add-on added — billed from next cycle'); rerender();
      }));
      $$('[data-pause]', root).forEach(b => b.addEventListener('click', () => {
        const s = D.db().subscriptions.find(s => s.id === b.dataset.pause);
        s.status = s.status === 'Paused' ? 'Active' : 'Paused'; D.save(); toast(`Plan ${s.status === 'Paused' ? 'paused' : 'resumed'}`); rerender();
      }));
      $$('[data-cancel]', root).forEach(b => b.addEventListener('click', async () => {
        if (!await confirmBox('Cancel subscription?', 'It stays active until the end of the current billing period.', 'Cancel subscription')) return;
        const s = D.db().subscriptions.find(s => s.id === b.dataset.cancel);
        s.status = 'Cancelled'; if (s.plan) user.plan = 'free';
        D.logActivity(`${user.name} cancelled ${D.subscriptionTitle(s)}`);
        D.save(); toast('Subscription cancelled'); rerender();
      }));
    },
  };
}

function orders(user) {
  const list = mine('orders', user);
  return {
    title: 'Orders',
    html: `<div class="dash-head"><h1>Projects & orders</h1></div>
    ${list.length ? list.map(o => `<section class="card order">
      <div class="card-head"><div><h3>${esc(o.invoice)}</h3><small class="muted">${date(o.createdAt)} · ${esc(o.method)}</small></div><div class="row gap">${badge(o.status)}<b>${inr(o.total)}</b></div></div>
      ${o.items.map(i => i.type === 'product' || i.billing !== 'once' ? `<div class="list-row"><span>${esc(i.title)}</span><small class="muted">${i.type === 'product' ? 'Ready to download' : 'Recurring — see My plan'}</small></div>` : progressRow(o, i)).join('')}
      ${D.orderPayments(o).length > 1 ? `<h4 class="pay-head">Payment schedule <small class="muted">${inr(D.orderPaid(o))} of ${inr(o.total)} paid</small></h4>${paymentSchedule(o)}` : ''}
      <div class="row gap wrap">${D.orderBalance(o) ? `<button class="btn sm primary" data-paynext="${o.id}">Pay next instalment · ${inr(D.orderPayments(o).find(p => !p.paid).amount)}</button>` : ''}<a class="btn sm ghost" href="#/invoice/${o.id}">${icon('receipt')} Invoice</a><button class="btn sm ghost" data-help="${o.id}">${icon('help')} Get help</button></div>
    </section>`).join('') : empty('You have no orders yet.', '<a class="btn primary" href="#/services">Browse services</a>')}`,
    bind: root => {
      $$('[data-help]', root).forEach(b => b.addEventListener('click', () => newTicket(user, b.dataset.help)));
      bindPayNext(root);
    },
  };
}

function bindPayNext(root) {
  $$('[data-paynext]', root).forEach(b => b.addEventListener('click', async () => {
    const o = D.db().orders.find(o => o.id === b.dataset.paynext);
    const next = D.orderPayments(o).find(p => !p.paid);
    if (Pay.live()) return payInstalment(o, next);
    const f = await modal({ title: `Pay ${next.label.toLowerCase()}`, submit: `Pay ${inr(next.amount)}`, body: `
      <p>${esc(o.invoice)} · ${inr(next.amount)} of ${inr(D.orderBalance(o))} balance.</p>
      ${field('Payment method', 'method', { options: ['UPI', 'Card', 'Net banking', 'Bank transfer'] })}
      <p class="hint">${icon('shield')} Demo mode: payment is simulated.</p>` });
    if (!f) return;
    D.payNext(o, f.get('method'));
    toast(`Paid ${inr(next.amount)} — thank you!`); rerender();
  }));
}

// Live payments: the order's server-signed balance token says what is still due.
async function payInstalment(o, next) {
  const user = D.currentUser();
  if (!o.balanceToken) return toast('This order can’t be paid online. Please contact us to pay the balance.', 'err');
  try {
    const order = await Pay.createOrder({ balanceToken: o.balanceToken, account: user.email, customer: { name: user.name, email: user.email, phone: user.phone || '' } });
    if (order.due !== next.amount && !await modal({ title: 'Amount updated', body: `<p>The instalment due is <b>${inr(order.due)}</b>, not ${inr(next.amount)}.</p>`, submit: `Pay ${inr(order.due)}` })) return;
    const paid = await Pay.pay(order, { name: user.name, email: user.email, phone: user.phone || '', description: `${o.invoice} · ${next.label}` });
    if (!paid) return;
    D.payNext(o, 'Razorpay', null, { paymentId: paid.paymentId, balanceToken: paid.balanceToken });
    toast(`Paid ${inr(order.due)} — thank you!`); rerender();
  } catch (err) {
    if (err.paymentId) modal({ title: 'Payment not confirmed', body: `<p>${esc(err.message)}</p>`, submit: '' });
    else toast(err.message, 'err');
  }
}

function downloads(user) {
  const items = mine('orders', user).flatMap(o => o.items.filter(i => i.type === 'product').map(i => ({ ...i, order: o })));
  return {
    title: 'Downloads',
    html: `<div class="dash-head"><h1>Downloads</h1></div>
    ${items.length ? `<div class="cards3">${items.map(i => `<article class="card addon"><div><h4>${esc(i.title)}</h4><p class="muted">Purchased ${date(i.order.createdAt)} · ${esc(i.order.invoice)}</p></div>
      <div class="addon-foot"><span class="badge green">Licensed</span><button class="btn sm primary" data-dl="${esc(i.ref)}">${icon('download')} Download</button></div></article>`).join('')}</div>` : empty('Purchased digital products appear here.', '<a class="btn ghost" href="#/shop">Visit shop</a>')}`,
    bind: root => $$('[data-dl]', root).forEach(b => b.addEventListener('click', () => {
      const p = D.product(b.dataset.dl);
      const blob = new Blob([`${p.name}\nLicensed to ${user.name} (${user.email})\nVintorex Digital Solutions\n\nThis demo file stands in for the purchased download.`], { type: 'text/plain' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: p.id + '.txt' });
      a.click(); URL.revokeObjectURL(a.href);
    })),
  };
}

function invoices(user) {
  const list = mine('orders', user);
  return {
    title: 'Invoices',
    html: `<div class="dash-head"><h1>Invoices</h1></div>
    <div class="card table-wrap">${list.length ? `<table class="table"><thead><tr><th>Invoice</th><th>Date</th><th>Items</th><th>GST</th><th>Total</th><th>Balance</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map(o => { const bal = D.orderBalance(o); return `<tr><td><b>${esc(o.invoice)}</b></td><td>${date(o.createdAt)}</td><td>${o.items.length}</td><td>${inr(o.gst)}</td><td><b>${inr(o.total)}</b></td><td>${bal ? inr(bal) : '—'}</td><td>${badge(bal ? 'Part-paid' : 'Paid', bal ? 'amber' : 'green')}</td>
        <td class="right">${bal ? `<button class="btn sm primary" data-paynext="${o.id}">Pay</button> ` : ''}<a class="btn sm ghost" href="#/invoice/${o.id}">View</a></td></tr>`; }).join('')}
    </tbody></table>` : empty('No invoices yet.')}</div>`,
    bind: bindPayNext,
  };
}

async function newTicket(user, orderId = '') {
  const orders = mine('orders', user);
  const f = await modal({ title: 'New support ticket', submit: 'Submit ticket', body: `
    ${field('Subject', 'subject', { required: true })}
    ${field('Related order', 'order', { value: orderId, options: [['', 'General question'], ...orders.map(o => [o.id, o.invoice])] })}
    ${field('Message', 'body', { rows: 4, required: true })}` });
  if (!f) return;
  D.openTicket(user, f.get('subject'), f.get('body'), f.get('order'));
  toast('Ticket submitted — we usually reply within a few hours');
  location.hash = '#/account/support';
  rerender();
}

function support(user, query) {
  const list = mine('tickets', user);
  const open = list.find(t => t.id === query.get('t')) || list[0];
  return {
    title: 'Support',
    html: `<div class="dash-head"><h1>Support</h1><button class="btn primary" data-new>${icon('plus')} New ticket</button></div>
    ${list.length ? `<div class="inbox">
      <nav class="card inbox-list">${list.map(t => `<a href="#/account/support?t=${t.id}" class="${t === open ? 'on' : ''}"><b>#${t.number} ${esc(t.subject)}</b><span class="row between"><small class="muted">${ago(t.messages.at(-1).at)}</small>${badge(t.status)}</span></a>`).join('')}</nav>
      ${thread(open, user)}
    </div>` : empty('No tickets yet. Need help? Open one and we’ll respond quickly.')}`,
    bind: root => {
      $('[data-new]', root).addEventListener('click', () => newTicket(user));
      bindThread(root, open, user, false);
    },
  };
}

export function thread(t, viewer) {
  return `<section class="card thread">
    <div class="card-head"><div><h3>#${t.number} ${esc(t.subject)}</h3><small class="muted">Opened ${dateTime(t.createdAt)}</small></div>${badge(t.status)}</div>
    <div class="msgs">${t.messages.map(m => `<div class="msg ${m.staff ? 'staff' : 'cust'}"><small><b>${esc(m.from)}</b> · ${dateTime(m.at)}</small><p>${esc(m.text)}</p></div>`).join('')}</div>
    ${t.status === 'Closed' ? '<p class="muted center">This ticket is closed.</p>' : `<form class="reply"><textarea name="text" rows="2" required placeholder="Write a reply…" aria-label="Reply"></textarea><button class="btn primary">Send</button></form>`}
  </section>`;
}
export function bindThread(root, t, viewer, staff) {
  const f = $('form.reply', root);
  if (!f || !t) return;
  f.addEventListener('submit', e => {
    e.preventDefault();
    t.messages.push({ at: new Date().toISOString(), from: viewer.name, staff, text: f.text.value.trim() });
    t.status = staff ? 'Pending' : 'Open';
    D.save(); rerender();
  });
}

function profile(user) {
  return {
    title: 'Profile',
    html: `<div class="dash-head"><h1>Profile</h1></div>
    <div class="cards2">
      <form class="card" id="prof"><h3>Business details</h3>
        ${field('Full name', 'name', { value: user.name, required: true })}
        ${field('Email', 'email', { type: 'email', value: user.email, required: true })}
        ${field('Phone', 'phone', { type: 'tel', value: user.phone || '' })}
        ${field('Business name', 'company', { value: user.company || '' })}
        ${field('GSTIN', 'gstin', { value: user.gstin || '' })}
        ${field('City', 'city', { value: user.city || '' })}
        <button class="btn primary">Save changes</button></form>
      <form class="card" id="pw"><h3>Change password</h3>
        ${field('New password', 'pw', { type: 'password', required: true, attrs: 'minlength="6" autocomplete="new-password"' })}
        <button class="btn ghost">Update password</button></form>
    </div>`,
    bind: root => {
      $('#prof', root).addEventListener('submit', e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target));
        if (D.db().users.some(u => u !== user && u.email.toLowerCase() === f.email.toLowerCase())) return toast('That email is used by another account', 'err');
        Object.assign(user, f); D.save(); toast('Profile saved'); rerender();
      });
      $('#pw', root).addEventListener('submit', async e => { e.preventDefault(); await D.changePassword(user, e.target.pw.value); e.target.reset(); toast('Password updated'); });
    },
  };
}
