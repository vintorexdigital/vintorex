// Site header and footer, shared by the single-page app and the static blog
// pages. `base` is '' inside the app (hash links) and '/' on static pages.
import { BUSINESS, SERVICES } from './data.js';
import { esc, icon } from './ui.js';
import { POLICIES } from './policies.js';

export const logoMark = () => `<img src="/images/vintorex-logo.png" class="logo-mark" alt="Vintorex brand logo" width="44" height="44" decoding="async">`;

const NAV = [['/services', 'Services'], ['/pricing', 'Pricing'], ['/compare', 'Compare'], ['blog', 'Blog'], ['/shop', 'Shop'], ['/about', 'About'], ['/contact', 'Contact']];
// Static pages (base '/') link to the crawlable services index; the app keeps hash routes.
const to = (base, path) => path === 'blog' ? '/blog/' : base && path === '/services' ? '/services/' : base + '#' + path;
const svcLink = id => `/services/${id}/`;

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
    <div class="foot-links"><h4>Services</h4>${services.slice(0, 7).map(s => `<a href="${svcLink(s.id)}">${esc(s.name)}</a>`).join('')}<a href="/services/">All services &amp; prices</a></div>
    <div class="foot-links"><h4>Company</h4><a href="${to(base, '/about')}">About</a><a href="${to(base, '/pricing')}">Pricing</a><a href="${to(base, '/compare')}">Competitor analysis</a><a href="/blog/">Blog & guides</a><a href="/faq/">FAQ</a><a href="${to(base, '/shop')}">Shop</a><a href="${to(base, '/contact')}">Contact</a></div>
    <div class="foot-contact"><h4>Get in Touch</h4>
      <a class="f-pill" href="${BUSINESS.maps}" target="_blank" rel="noopener">${icon('pin')}<span>${esc(BUSINESS.address)}</span></a>
      <a class="f-pill" href="tel:+918667209838">${icon('phoneCall')}<span>${esc(BUSINESS.phone)}</span></a>
      <a class="f-pill" href="mailto:${BUSINESS.email}">${icon('mail')}<span>${esc(BUSINESS.email)}</span></a>
      <a class="f-pill" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">${icon('wa')}<span>WhatsApp</span></a>
      <a class="f-pill" href="${BUSINESS.google}" target="_blank" rel="noopener">${icon('star')}<span>Reviews on Google</span></a></div>
  </div>
  <div class="shell foot-payments">
    <div class="foot-pay-chips">
      <span class="pay-chip">⚡ Instant UPI (GPay, PhonePe, Paytm)</span>
      <span class="pay-chip">💳 RuPay, Visa, Mastercard</span>
      <span class="pay-chip">🏦 Net Banking</span>
      <span class="pay-chip">🛡️ 18% GST Invoicing &amp; Input Tax Credit</span>
    </div>
  </div>
  <div class="shell fine">© ${esc(BUSINESS.name)}. All prices exclude GST.
    <nav class="fine-links" aria-label="Policies">${POLICIES.map(p => `<a href="${p.path}">${esc(p.label)}</a>`).join('')}</nav></div></footer>
  <a class="wa-float" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${icon('wa')}</a>`;
}
