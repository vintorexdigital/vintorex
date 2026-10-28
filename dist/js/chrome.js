// Site header and footer, shared by the single-page app and the static blog
// pages. `base` is '' inside the app (hash links) and '/' on static pages.
import { BUSINESS, SERVICES } from './data.js';
import { esc, icon } from './ui.js';

export const logoMark = () => `<svg viewBox="0 0 32 32" class="logo-mark" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor"/><path d="m8 9 8 15 8-15" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const NAV = [['/services', 'Services'], ['/pricing', 'Pricing'], ['/compare', 'Compare'], ['blog', 'Blog'], ['/shop', 'Shop'], ['/about', 'About'], ['/contact', 'Contact']];
const to = (base, path) => path === 'blog' ? '/blog/' : base + '#' + path;

export function siteHeader({ base = '', here = '', cart = 0, account = '' } = {}) {
  return `<a class="skip" href="#main">Skip to content</a>
  <header class="topbar"><div class="shell nav">
    <a class="logo" href="${to(base, '/')}">${logoMark()}<span>Vintorex<small>Digital Solutions</small></span></a>
    <nav class="nav-links" id="nav-links" aria-label="Primary">${NAV.map(([h, l]) => `<a href="${to(base, h)}" class="${here.startsWith(h) ? 'on' : ''}">${l}</a>`).join('')}</nav>
    <div class="nav-actions">
      <a class="icon-btn cart-btn" href="${to(base, '/cart')}" aria-label="Cart">${icon('cart')}<span class="count" ${cart ? '' : 'hidden'}>${cart}</span></a>
      ${account || `<a class="btn sm ghost hide-sm" href="${to(base, '/login')}">Sign in</a>`}
      <a class="btn sm primary hide-sm" href="${to(base, '/contact')}">Get a quote</a>
      <button class="icon-btn menu-btn" aria-expanded="false" aria-controls="nav-links" aria-label="Menu">${icon('menu')}</button>
    </div>
  </div></header>`;
}

export function siteFooter({ base = '', services = SERVICES } = {}) {
  return `<footer class="footer"><div class="shell foot-grid">
    <div><a class="logo" href="${to(base, '/')}">${logoMark()}<span>Vintorex<small>Digital Solutions</small></span></a><p class="muted">${esc(BUSINESS.tagline)} Digital marketing, web and cloud services from Coimbatore.</p>
      <div class="row gap wrap">${Object.entries(BUSINESS.social).map(([n, u]) => `<a class="chip" href="${u}" target="_blank" rel="noopener">${n}</a>`).join('')}</div></div>
    <div><h4>Services</h4>${services.slice(0, 7).map(s => `<a href="${to(base, '/services/' + s.id)}">${esc(s.name)}</a>`).join('')}</div>
    <div><h4>Company</h4><a href="${to(base, '/about')}">About</a><a href="${to(base, '/pricing')}">Pricing</a><a href="${to(base, '/compare')}">Competitor analysis</a><a href="/blog/">Blog & guides</a><a href="${to(base, '/shop')}">Shop</a><a href="${to(base, '/contact')}">Contact</a><a href="${to(base, '/terms')}">Terms & refunds</a></div>
    <div class="foot-contact"><h4>Get in Touch</h4>
      <a class="f-pill" href="${BUSINESS.maps}" target="_blank" rel="noopener">${icon('pin')}<span>${esc(BUSINESS.address)}</span></a>
      <a class="f-pill" href="tel:+918667209838">${icon('phoneCall')}<span>${esc(BUSINESS.phone)}</span></a>
      <a class="f-pill" href="mailto:${BUSINESS.email}">${icon('mail')}<span>${esc(BUSINESS.email)}</span></a>
      <a class="f-pill" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">${icon('wa')}<span>WhatsApp</span></a>
      <a class="f-pill" href="${BUSINESS.google}" target="_blank" rel="noopener">${icon('star')}<span>Reviews on Google</span></a></div>
  </div><div class="shell fine">© ${esc(BUSINESS.name)}. All prices exclude GST.</div></footer>
  <a class="wa-float" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${icon('wa')}</a>`;
}
