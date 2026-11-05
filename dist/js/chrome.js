// Site header and footer, shared by the single-page app and the static pages. Every link is a real
// address: the app takes over clicks on its own pages (js/router.js), the rest load as ordinary pages.
import { BUSINESS } from './site-data.js';
import { esc, icon } from './ui.js';
import { POLICY_LINKS as POLICIES } from './policy-links.js';

// Winged V emblem with the same gold/grey 3D echo as the wordmark (scripts/build-logo.py).
export const logoMark = (alt = 'Vintorex brand logo') => `<img src="/images/vintorex-emblem-144.webp" srcset="/images/vintorex-emblem-144.webp 144w, /images/vintorex-emblem-288.webp 288w, /images/vintorex-emblem-480.webp 480w" sizes="(max-width: 640px) 76px, 94px" class="logo-mark" alt="${alt}" width="144" height="91" decoding="async">`;

// Gold script name from vintorex-name-3d-source.jpg (scripts/build-wordmark.py), plus -dark for footer/admin.
const wordmarkImg = (part, alt, [w, h], sizes, dark) => {
  const src = width => `/images/vintorex-${part}${dark ? '-dark' : ''}-${width}.webp?v=3`;
  return `<img class="wm-${part}" src="${src(w)}" srcset="${src(w)} ${w}w, ${src(w * 2)} ${w * 2}w" sizes="${sizes}" width="${w}" height="${h}" alt="${alt}" decoding="async">`;
};
// Emblem + gold script lockup. A label such as "Client portal" replaces the tagline.
// Name box is the artwork ratio (800×225) so the script is not squeezed.
export const brandLogo = ({ dark = false, label = '' } = {}) => `<span class="brand-lockup">${logoMark('')}<span class="wordmark">${wordmarkImg('name', 'Vintorex', [400, 113], '(max-width: 640px) 120px, 180px', dark)}${label ? `<small>${label}</small>` : wordmarkImg('tagline', 'Digital Solutions', [300, 15], '(max-width: 640px) 70px, 104px', dark)}</span></span>`;

const NAV = [['/services', 'Services'], ['/pricing', 'Pricing'], ['/compare', 'Compare'], ['/blog', 'Blog'], ['/shop', 'Shop'], ['/about', 'About'], ['/contact', 'Contact']];
// The services index and the blog are static pages, which live at /services/ and /blog/.
const to = path => path === '/services' || path === '/blog' ? path + '/' : path;
const svcLink = id => `/services/${id}/`;

// An offer strip that scrolls away, then a floating bar that sticks. Below 1100px the links fold
// into a drop-down menu; Sign in (or the account button) moves into it, and Get a quote too on phones.
export function siteHeader({ here = '', cart = 0, account = '' } = {}) {
  const signIn = account || `<a class="btn sm ghost" href="${to('/login')}">Sign in</a>`;
  const quote = `<a class="btn sm primary" href="${to('/contact')}">Get a quote</a>`;
  return `<a class="skip" href="#main">Skip to content</a>
  <div class="announce"><div class="shell announce-row">
    <p><span class="live-dot" aria-hidden="true"></span>Free 15-point website &amp; SEO audit<span class="announce-more"> · fixed-price action plan</span></p>
    <a class="announce-cta" href="${to('/offer')}">Request my free audit <span aria-hidden="true">→</span></a>
  </div></div>
  <header class="topbar"><div class="nav">
    <a class="logo" href="${to('/')}">${brandLogo()}</a>
    <nav class="nav-links" id="nav-links" aria-label="Primary">${NAV.map(([h, l]) => `<a href="${to(h)}" class="${here.startsWith(h) ? 'on' : ''}">${l}</a>`).join('')}
      <div class="nav-menu-cta">${signIn}${quote}</div>
    </nav>
    <div class="nav-actions">
      <a class="icon-btn cart-btn" href="${to('/cart')}" aria-label="Cart">${icon('cart')}<span class="count" ${cart ? '' : 'hidden'}>${cart}</span></a>
      ${signIn}
      ${quote}
      <button class="icon-btn menu-btn" aria-expanded="false" aria-controls="nav-links" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </div></header>`;
}

export function siteFooter({ services = [] } = {}) {
  return `<footer class="footer"><div class="shell foot-grid">
    <div><a class="logo" href="${to('/')}">${brandLogo({ dark: true })}</a><p class="muted">${esc(BUSINESS.tagline)} Digital marketing, web and cloud services from Coimbatore.</p>
      <div class="row gap wrap">${Object.entries(BUSINESS.social).map(([n, u]) => `<a class="chip" href="${u}" target="_blank" rel="noopener">${n}</a>`).join('')}</div></div>
    <div class="foot-links"><h4>Services</h4>${services.slice(0, 7).map(s => `<a href="${svcLink(s.id)}">${esc(s.name)}</a>`).join('')}<a href="/services/">All services &amp; prices</a><a href="/vintorent">Vintorent downloads</a></div>
    <div class="foot-links"><h4>Company</h4><a href="${to('/about')}">About</a><a href="${to('/pricing')}">Pricing</a><a href="${to('/compare')}">Competitor analysis</a><a href="/blog/">Blog & guides</a><a href="/faq/">FAQ</a><a href="${to('/shop')}">Shop</a><a href="${to('/contact')}">Contact</a></div>
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
