// Hash router and page shells (public site, customer dashboard, admin panel).
import * as D from './db.js';
import * as Pub from './public.js';
import * as Acc from './account.js';
import * as Adm from './admin.js';
import * as Blog from './blogpages.js';
import * as Pay from './pay.js';
import { BUSINESS } from './data.js';
import { siteHeader, siteFooter } from './chrome.js';
import { esc, icon, initials, responsiveTables, $, $$ } from './ui.js';

const routes = [
  ['/', Pub.home], ['/services', Pub.services], ['/services/:id', Pub.serviceDetail],
  ['/pricing', Pub.pricing], ['/compare', Pub.compare], ['/blog', Blog.blogIndex], ['/blog/:slug', Blog.article], ['/shop', Pub.shop], ['/cart', Pub.cart], ['/checkout', Pub.checkout],
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
    try {
      if (a.every((seg, i) => seg.startsWith(':') ? (params[seg.slice(1)] = decodeURIComponent(b[i]), true) : seg === b[i])) return [fn, params];
    } catch { return [Pub.notFound, {}]; } // malformed %-escape in the URL
  }
  return [Pub.notFound, {}];
}

const app = () => $('#app');
const DEFAULT_DESCRIPTION = $('meta[name=description]')?.getAttribute('content') || '';
const DEFAULT_KEYWORDS = $('meta[name=keywords]')?.getAttribute('content') || '';
const DEFAULT_OG_IMAGE = $('meta[property="og:image"]')?.getAttribute('content') || 'https://vintorex.com/images/og-cover.svg';
let lastPath = null;

function setMeta(selector, attr, value, fallback = '') {
  let el = $(selector);
  if (!el && selector.includes('=')) {
    const [tag, pair] = selector.split('[');
    const [name, val] = pair.replace(']', '').split('=');
    el = document.createElement(tag);
    el.setAttribute(name, val.replace(/['"]/g, ''));
    document.head.appendChild(el);
  }
  el?.setAttribute(attr, value || fallback);
}

function render() {
  const raw = (location.hash.slice(1) || '/').split('#')[0];
  const [path, qs = ''] = raw.split('?');
  const [fn, params] = match(path.replace(/\/$/, '') || '/');
  const v = fn(params, new URLSearchParams(qs)) || Pub.notFound();
  if (v.redirect) { location.replace('#' + v.redirect); return; }
  const pageTitle = `${v.title} · ${BUSINESS.short}`;
  document.title = pageTitle;
  const desc = v.description || DEFAULT_DESCRIPTION;
  const kw = v.keywords || DEFAULT_KEYWORDS;
  const img = v.image || DEFAULT_OG_IMAGE;
  const imgAlt = v.imageAlt || `${v.title} - ${BUSINESS.name}`;

  setMeta('meta[name=description]', 'content', desc);
  setMeta('meta[name=keywords]', 'content', kw);
  setMeta('meta[property="og:title"]', 'content', pageTitle);
  setMeta('meta[property="og:description"]', 'content', desc);
  setMeta('meta[property="og:image"]', 'content', img);
  setMeta('meta[property="og:image:alt"]', 'content', imgAlt);
  const photo = /\.jpe?g($|\?)/i.test(img);
  setMeta('meta[property="og:image:type"]', 'content', photo ? 'image/jpeg' : 'image/png');
  setMeta('meta[property="og:image:width"]', 'content', photo ? '1600' : '1200');
  setMeta('meta[property="og:image:height"]', 'content', photo ? '900' : '630');
  setMeta('meta[name="twitter:title"]', 'content', pageTitle);
  setMeta('meta[name="twitter:description"]', 'content', desc);
  setMeta('meta[name="twitter:image"]', 'content', img);
  setMeta('meta[name="twitter:image:alt"]', 'content', imgAlt);

  const user = D.currentUser();
  if (v.shell) app().innerHTML = dashShell(v, user);
  else app().innerHTML = v.bare ? `<main id="main">${v.html}</main>` : `${header(user)}<main id="main">${v.html}</main>${footer()}`;
  responsiveTables(app());
  v.bind?.(app());
  bindChrome();
  if (path !== lastPath) { window.scrollTo(0, 0); lastPath = path; }
  const anchor = location.hash.split('#')[2];
  if (anchor) document.getElementById(anchor)?.scrollIntoView();
}
[Pub, Acc, Adm].forEach(m => m.setRerender(safeRender));

function cartCount() { return D.getCart().reduce((s, i) => s + (i.qty || 1), 0); }

function header(user) {
  const here = (location.hash.slice(1) || '/').split('?')[0];
  const account = user && `<a class="btn sm ghost" href="#/${user.role === 'admin' ? 'admin' : 'account'}">${icon('user')} ${user.role === 'admin' ? 'Admin' : 'Dashboard'}</a>`;
  return siteHeader({ here, cart: cartCount(), account });
}

const footer = () => siteFooter({ services: D.catalog().services });

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
window.addEventListener('hashchange', safeRender);
// Liquid Glass: let the light on cards and buttons follow the pointer.
document.addEventListener('pointermove', e => {
  const el = e.pointerType === 'mouse' && e.target.closest?.('.card, .btn, .chip, .icon-btn');
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });
window.addEventListener('storage', e => { if (e.key === 'vx_db_v1') location.reload(); });

function showError(err) {
  console.error(err);
  app().innerHTML = `<div class="shell section"><h1>Something went wrong</h1><p>${esc(err.message)}</p><p><a class="btn primary" href="#/">Go home</a></p></div>`;
}
// A broken view shows the error page instead of leaving the old page half-updated.
function safeRender() { try { render(); } catch (err) { showError(err); } }

Promise.all([D.init(), Pay.load()]).then(safeRender).catch(showError);
