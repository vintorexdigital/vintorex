// Hash router and page shells (public site, customer dashboard, admin panel).
import * as D from './db.js';
import * as Pub from './public.js';
import * as Acc from './account.js';
import * as Adm from './admin.js';
import { BUSINESS } from './data.js';
import { esc, icon, initials, $, $$ } from './ui.js';

const routes = [
  ['/', Pub.home], ['/services', Pub.services], ['/services/:id', Pub.serviceDetail],
  ['/pricing', Pub.pricing], ['/shop', Pub.shop], ['/cart', Pub.cart], ['/checkout', Pub.checkout],
  ['/order/:id', Pub.orderDone], ['/invoice/:id', Pub.invoice], ['/contact', Pub.contact], ['/about', Pub.about],
  ['/terms', Pub.terms], ['/login', Pub.login], ['/register', Pub.register],
  ['/account', guard('customer', Acc.view)], ['/account/:tab', guard('customer', Acc.view)],
  ['/admin', guard('admin', Adm.view)], ['/admin/:tab', guard('admin', Adm.view)], ['/admin/:tab/:id', guard('admin', Adm.view)],
];

function guard(role, fn) {
  return (params, query) => {
    const u = D.currentUser();
    if (!u) return { redirect: '/login?next=' + location.hash.slice(2).split('?')[0] };
    if (u.role !== role) return { redirect: u.role === 'admin' ? '/admin' : '/account' };
    return fn(params, query, u);
  };
}

function match(path) {
  for (const [pattern, fn] of routes) {
    const a = pattern.split('/'), b = path.split('/');
    if (a.length !== b.length) continue;
    const params = {};
    if (a.every((seg, i) => seg.startsWith(':') ? (params[seg.slice(1)] = decodeURIComponent(b[i]), true) : seg === b[i])) return [fn, params];
  }
  return [Pub.notFound, {}];
}

const app = () => $('#app');
let lastPath = null;

function render() {
  const raw = (location.hash.slice(1) || '/').split('#')[0];
  const [path, qs = ''] = raw.split('?');
  const [fn, params] = match(path.replace(/\/$/, '') || '/');
  const v = fn(params, new URLSearchParams(qs)) || Pub.notFound();
  if (v.redirect) { location.replace('#' + v.redirect); return; }
  document.title = `${v.title} · ${BUSINESS.short}`;
  const user = D.currentUser();
  if (v.shell) app().innerHTML = dashShell(v, user);
  else app().innerHTML = v.bare ? `<main id="main">${v.html}</main>` : `${header(user)}<main id="main">${v.html}</main>${footer()}`;
  v.bind?.(app());
  bindChrome();
  if (path !== lastPath) { window.scrollTo(0, 0); lastPath = path; }
  const anchor = location.hash.split('#')[2];
  if (anchor) document.getElementById(anchor)?.scrollIntoView();
}
[Pub, Acc, Adm].forEach(m => m.setRerender(render));

function cartCount() { return D.getCart().reduce((s, i) => s + (i.qty || 1), 0); }

function header(user) {
  const here = (location.hash.slice(1) || '/').split('?')[0];
  const nav = [['/services', 'Services'], ['/pricing', 'Pricing'], ['/shop', 'Shop'], ['/about', 'About'], ['/contact', 'Contact']];
  return `<a class="skip" href="#main">Skip to content</a>
  <header class="topbar"><div class="shell nav">
    <a class="logo" href="#/">${Pub.logoMark()}<span>Vintorex<small>Digital Solutions</small></span></a>
    <nav class="nav-links" id="nav-links" aria-label="Primary">${nav.map(([h, l]) => `<a href="#${h}" class="${here.startsWith(h) ? 'on' : ''}">${l}</a>`).join('')}</nav>
    <div class="nav-actions">
      <a class="icon-btn cart-btn" href="#/cart" aria-label="Cart">${icon('cart')}<span class="count" ${cartCount() ? '' : 'hidden'}>${cartCount()}</span></a>
      ${user ? `<a class="btn sm ghost" href="#/${user.role === 'admin' ? 'admin' : 'account'}">${icon('user')} ${user.role === 'admin' ? 'Admin' : 'Dashboard'}</a>` : `<a class="btn sm ghost hide-sm" href="#/login">Sign in</a>`}
      <a class="btn sm primary hide-sm" href="#/contact">Get a quote</a>
      <button class="icon-btn menu-btn" aria-expanded="false" aria-controls="nav-links" aria-label="Menu">${icon('menu')}</button>
    </div>
  </div></header>`;
}

function footer() {
  return `<footer class="footer"><div class="shell foot-grid">
    <div><a class="logo" href="#/">${Pub.logoMark()}<span>Vintorex<small>Digital Solutions</small></span></a><p class="muted">${esc(BUSINESS.tagline)} Digital marketing, web and cloud services from Coimbatore.</p>
      <div class="row gap wrap">${Object.entries(BUSINESS.social).map(([n, u]) => `<a class="chip" href="${u}" target="_blank" rel="noopener">${n}</a>`).join('')}</div></div>
    <div><h4>Services</h4>${D.catalog().services.slice(0, 7).map(s => `<a href="#/services/${s.id}">${esc(s.name)}</a>`).join('')}</div>
    <div><h4>Company</h4><a href="#/about">About</a><a href="#/pricing">Pricing</a><a href="#/shop">Shop</a><a href="#/contact">Contact</a><a href="#/terms">Terms & refunds</a></div>
    <div><h4>Contact</h4><a href="tel:+918667209838">${esc(BUSINESS.phone)}</a><a href="mailto:${BUSINESS.email}">${esc(BUSINESS.email)}</a><a href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">WhatsApp</a><p class="muted">${esc(BUSINESS.address)}</p></div>
  </div><div class="shell fine">© ${new Date().getFullYear()} ${esc(BUSINESS.name)}. All prices exclude GST.</div></footer>
  <a class="wa-float" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${icon('wa')}</a>`;
}

function dashShell(v, user) {
  const admin = v.shell === 'admin';
  const nav = admin ? Adm.NAV : Acc.NAV;
  const base = admin ? '/admin' : '/account';
  const badges = admin ? { leads: D.db().leads.filter(l => l.stage === 'New').length, tickets: D.db().tickets.filter(t => t.status === 'Open').length } : {};
  return `<a class="skip" href="#main">Skip to content</a>
  <div class="dash ${admin ? 'is-admin' : ''}">
    <aside class="side" id="side">
      <a class="logo" href="#/">${Pub.logoMark()}<span>Vintorex<small>${admin ? 'Admin · CRM' : 'Client portal'}</small></span></a>
      <nav aria-label="Dashboard">${nav.map(([t, l, ic]) => `<a href="#${base}${t ? '/' + t : ''}" class="${v.tab === t ? 'on' : ''}">${icon(ic)}<span>${l}</span>${badges[t] ? `<em>${badges[t]}</em>` : ''}</a>`).join('')}</nav>
      <div class="side-foot">
        ${admin ? '<a href="#/">' + icon('home') + '<span>View storefront</span></a>' : '<a href="#/services">' + icon('bag') + '<span>Shop services</span></a>'}
        <button data-logout>${icon('logout')}<span>Sign out</span></button>
      </div>
    </aside>
    <div class="dash-main">
      <header class="dash-top"><button class="icon-btn side-toggle" aria-label="Menu" aria-controls="side" aria-expanded="false">${icon('menu')}</button>
        <div class="grow"></div>
        ${admin ? '' : `<a class="icon-btn cart-btn" href="#/cart" aria-label="Cart">${icon('cart')}<span class="count" ${cartCount() ? '' : 'hidden'}>${cartCount()}</span></a>`}
        <div class="who"><span class="avatar">${initials(user.name)}</span><div><b>${esc(user.name)}</b><small class="muted">${esc(user.email)}</small></div></div></header>
      <main id="main" class="dash-content">${v.html}</main>
    </div>
  </div>`;
}

function bindChrome() {
  const mb = $('.menu-btn');
  mb?.addEventListener('click', () => { const open = $('#nav-links').classList.toggle('open'); mb.setAttribute('aria-expanded', open); });
  const st = $('.side-toggle');
  st?.addEventListener('click', () => { const open = $('#side').classList.toggle('open'); st.setAttribute('aria-expanded', open); });
  $('[data-logout]')?.addEventListener('click', () => { D.logout(); location.hash = '#/'; });
}

document.addEventListener('cart', () => $$('.cart-btn .count').forEach(c => { const n = cartCount(); c.textContent = n; c.hidden = !n; }));
window.addEventListener('hashchange', render);
window.addEventListener('storage', e => { if (e.key === 'vx_db_v1') location.reload(); });

D.init().then(render).catch(err => {
  console.error(err);
  app().innerHTML = `<div class="shell section"><h1>Something went wrong</h1><p>${esc(err.message)}</p></div>`;
});
