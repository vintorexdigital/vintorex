// Router and page shells (public site, customer dashboard, admin panel). Pages have real URLs such as
// /contact and /account/orders; routes.js lists them and router.js moves between them without a reload.
import * as D from './db.js';
import * as Pub from './public.js';
import * as Pay from './pay.js';
import * as Auth from './auth.js';
import { BUSINESS } from './data.js';
import { siteHeader, siteFooter, brandLogo } from './chrome.js';
import { esc, icon, initials, responsiveTables, $, $$ } from './ui.js';
import { matchRoute, trimPath, isPrivate, canonicalPath, ROBOTS_INDEX } from './routes.js';
import { navigate, interceptLinks, legacyUrl, NAVIGATE } from './router.js';

// One view per pattern in routes.js.
const views = {
  '/': Pub.home, '/pricing': Pub.pricing, '/compare': Pub.compare, '/shop': Pub.shop, '/cart': Pub.cart, '/checkout': Pub.checkout,
  '/contact': Pub.contact, '/about': Pub.about, '/login': Pub.login, '/register': Pub.register, '/connect-whatsapp': async (params, query) => (await import('./connect-whatsapp.js')).connectWhatsapp(params, query),
  '/services/:id/packages': Pub.serviceDetail, '/order/:id': Pub.orderDone, '/invoice/:id': Pub.invoice,
  '/account': guard('customer', () => import('./account.js')), '/account/:tab': guard('customer', () => import('./account.js')),
  '/admin': guard('admin', () => import('./admin.js')), '/admin/:tab': guard('admin', () => import('./admin.js')), '/admin/:tab/:id': guard('admin', () => import('./admin.js')),
};

function guard(role, loadDashboard) {
  return async (params, query) => {
    const u = D.currentUser();
    if (!u) return { redirect: '/login?next=' + location.pathname.slice(1) };
    if (u.role !== role) return { redirect: u.role === 'admin' ? '/admin' : '/account' };
    const [dashboard] = await Promise.all([loadDashboard(), Pay.load()]);
    dashboard.setRerender(safeRender);
    return { ...dashboard.view(params, query, u), nav: dashboard.NAV };
  };
}

function match(path) {
  const m = matchRoute(path);
  return m ? [views[m.pattern], m.params] : [Pub.notFound, {}];
}

const app = () => $('#app');
// The server writes each page's own description into its HTML and keeps the shared one in data-default.
const DEFAULT_DESCRIPTION = $('meta[name=description]')?.dataset.default || $('meta[name=description]')?.getAttribute('content') || '';
const DEFAULT_KEYWORDS = $('meta[name=keywords]')?.getAttribute('content') || '';
const DEFAULT_OG_IMAGE = $('meta[property="og:image"]')?.getAttribute('content') || 'https://vintorex.com/images/og-cover.svg';
const SITE = new URL($('link[rel=canonical]')?.href || location.href).origin;
let lastPath = null, shown = '';

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

// Scrolls to the #fragment of the address, for links such as /#audit or /pricing#addons.
function scrollToFragment() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id) document.getElementById(id)?.scrollIntoView();
}

let renderVersion = 0;
async function render(version) {
  const path = trimPath(location.pathname);
  const [fn, params] = match(path);
  if (path === '/checkout') await Pay.load();
  const v = await fn(params, new URLSearchParams(location.search)) || Pub.notFound();
  if (version !== renderVersion) return;
  if (v.redirect) { navigate(v.redirect, { replace: true }); return; }
  shown = location.pathname + location.search;
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
  // Every page is its own address now: say which one it is, and keep private and missing pages out of search.
  const canonical = SITE + canonicalPath(path);
  setMeta('link[rel=canonical]', 'href', canonical);
  setMeta('meta[property="og:url"]', 'content', canonical);
  $$('link[rel=alternate][hreflang]').forEach(l => l.setAttribute('href', canonical));
  setMeta('meta[name=robots]', 'content', v.noindex || isPrivate(path) ? 'noindex, nofollow' : ROBOTS_INDEX);

  const user = D.currentUser();
  if (v.shell) app().innerHTML = dashShell(v, user);
  else app().innerHTML = v.bare ? `<main id="main" tabindex="-1">${v.html}</main>` : `${header(user)}<main id="main" tabindex="-1">${v.html}</main>${footer()}`;
  responsiveTables(app());
  v.bind?.(app());
  bindChrome();
  if (path !== lastPath) { window.scrollTo(0, 0); lastPath = path; }
  scrollToFragment();
}
Pub.setRerender(safeRender);

function cartCount() { return D.getCart().reduce((s, i) => s + (i.qty || 1), 0); }

function header(user) {
  const here = trimPath(location.pathname);
  const account = user && `<a class="btn sm ghost" href="/${user.role === 'admin' ? 'admin' : 'account'}">${icon('user')} ${user.role === 'admin' ? 'Admin' : 'Dashboard'}</a>`;
  return siteHeader({ here, cart: cartCount(), account });
}

const footer = () => siteFooter({ services: D.catalog().services });

function dashShell(v, user) {
  const admin = v.shell === 'admin';
  const nav = v.nav;
  const base = admin ? '/admin' : '/account';
  const badges = admin ? { leads: D.db().leads.filter(l => l.stage === 'New').length, tickets: D.db().tickets.filter(t => t.status === 'Open').length } : {};
  return `<a class="skip" href="#main">Skip to content</a>
  <div class="dash ${admin ? 'is-admin' : ''}">
    <aside class="side" id="side">
      <a class="logo" href="/">${brandLogo({ dark: admin, label: admin ? 'Admin · CRM' : 'Client portal' })}</a>
      <nav aria-label="Dashboard">${nav.map(([t, l, ic]) => `<a href="${base}${t ? '/' + t : ''}" class="${v.tab === t ? 'on' : ''}">${icon(ic)}<span>${l}</span>${badges[t] ? `<em>${badges[t]}</em>` : ''}</a>`).join('')}</nav>
      <div class="side-foot">
        ${admin ? '<a href="/">' + icon('home') + '<span>View storefront</span></a>' : '<a href="/services/">' + icon('bag') + '<span>Shop services</span></a>'}
        <button data-logout>${icon('logout')}<span>Sign out</span></button>
      </div>
    </aside>
    <div class="dash-main">
      <header class="dash-top"><button class="icon-btn side-toggle" aria-label="Menu" aria-controls="side" aria-expanded="false">${icon('menu')}</button>
        <div class="grow"></div>
        ${admin ? '' : `<a class="icon-btn cart-btn" href="/cart" aria-label="Cart">${icon('cart')}<span class="count" ${cartCount() ? '' : 'hidden'}>${cartCount()}</span></a>`}
        <div class="who"><span class="avatar">${initials(user.name)}</span><div><b>${esc(user.name)}</b><small class="muted">${esc(user.email)}</small></div></div></header>
      <main id="main" class="dash-content" tabindex="-1">${v.html}</main>
    </div>
  </div>`;
}

function bindChrome() {
  const mb = $('.menu-btn'), menu = $('#nav-links');
  // The menu sits before its button in the page, so opening it moves focus to the first link.
  mb?.addEventListener('click', () => { const open = !menu.classList.contains('open'); setMenu(open); if (open) menu.querySelector('a')?.focus(); });
  menu?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  const st = $('.side-toggle');
  st?.addEventListener('click', () => { const open = $('#side').classList.toggle('open'); st.setAttribute('aria-expanded', open); });
  $('[data-logout]')?.addEventListener('click', () => { Auth.logout(); navigate('/'); });
  markScrolled();
}

function setMenu(open) {
  $('#nav-links')?.classList.toggle('open', open);
  $('.menu-btn')?.setAttribute('aria-expanded', open);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#nav-links.open')) { setMenu(false); $('.menu-btn').focus(); } });
// The floating header firms up once the page scrolls under it.
const markScrolled = () => $('.topbar')?.classList.toggle('scrolled', scrollY > 20);
window.addEventListener('scroll', markScrolled, { passive: true });

document.addEventListener('cart', () => $$('.cart-btn .count').forEach(c => { const n = cartCount(); c.textContent = n; c.hidden = !n; }));
// Back and forward, links and redirects all land here. A change of #fragment alone keeps the view and scrolls.
function onNavigate() {
  if (location.pathname + location.search !== shown) return safeRender();
  ++renderVersion;
  scrollToFragment();
}
window.addEventListener('popstate', onNavigate);
window.addEventListener(NAVIGATE, onNavigate);
interceptLinks();
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
  app().innerHTML = `<div class="shell section"><h1>Something went wrong</h1><p>${esc(err.message)}</p><p><a class="btn primary" href="/">Go home</a></p></div>`;
}
// A broken view shows the error page instead of leaving the old page half-updated.
async function safeRender() {
  const version = ++renderVersion;
  try { await render(version); } catch (err) { if (version === renderVersion) showError(err); }
}

// Old links such as /#/contact open the real address instead.
const legacy = legacyUrl();
if (legacy) location.replace(legacy);
else D.init().then(safeRender).then(() => {
  window.setTimeout(() => import('./firebase/analytics.js').catch(() => {}), 0);
}).catch(showError);
