// Public storefront: home, services, pricing, shop, cart, checkout, contact, auth.
import { BUSINESS, CATEGORIES, ANNUAL_MONTHS_PAID, SOURCES, LEAD_SOURCES, COMPETITOR_SOURCES, MILESTONE_MIN } from './data.js';
import * as D from './db.js';
import { esc, icon, toast, field, per, date, empty, $, $$ } from './ui.js';
import { serviceGuides, featuredPosts, postCard } from './blogpages.js';
import { logoMark } from './chrome.js';
import { serviceArt, serviceCardArt, ART, CATALOG_KEYWORDS, serviceImagePath } from './service-art.js';
import { SHOP_ART } from './shop-art.js';
import { WORK_PROJECTS, renderWorkCard } from './work-art.js';
export { logoMark };

const inr = D.inr;
const go = path => { location.hash = '#' + path; };
const fromPrice = s => Math.min(...s.tiers.map(t => t.price));

const PRODUCT_ALT = {
  'cosmic-galaxy': 'Cosmic galaxy art print with an indigo nebula, coral star clusters, and cream dust lanes',
  'celestial-night': 'Dreamy celestial night art print with a soft moon, indigo sky, and coral clouds over distant hills',
  'enchanted-castle': 'Enchanted castle landscape art print with a misty hilltop castle and warm lit windows',
  'funky-floral': 'Funky floral fantasy art print of oversized coral, cream, and indigo flowers',
  'mythical-creatures': 'Mythical creatures art print of a gentle dragon and phoenix among moonlit trees',
  'underwater': 'Underwater wonderland art print with sunbeams, coral reefs, and soft fish silhouettes',
  'forest-adventure': 'Whimsical forest adventure art print of a sunlit path through giant trees and fireflies',
  'social-templates': 'Social media template pack laid out as blank indigo, coral, and cream post cards',
  'seo-checklist': 'Printed local SEO checklist booklet with tick marks, a magnifying glass, and a map pin',
  'content-calendar': 'Twelve-month content calendar spread as a grid of empty indigo, coral, and cream cells',
};

function art(p, cls = '') {
  const h = p.hue;
  const copy = SHOP_ART[p.id];
  const altText = copy?.alt || PRODUCT_ALT[p.id] || `${p.name}, a ${p.kind} printable download from the Vintorex shop`;
  return `<div class="art ${cls}" style="--h:${h}">
    <img class="product-img" src="/images/shop/${p.id}.jpg" alt="${esc(altText)}" width="1200" height="900" loading="lazy" decoding="async">
    <span class="art-kind-tag">${esc(p.kind)}</span>
  </div>`;
}



function marketBar(s, price) {
  const [lo, hi] = s.market;
  const max = hi * 1.1;
  const pos = Math.min(100, price / max * 100);
  return `<div class="market">
    <div class="market-track"><span class="market-range" style="left:${lo / max * 100}%;width:${(hi - lo) / max * 100}%"></span><b style="left:${pos}%"></b></div>
    <div class="market-legend"><span><i class="dot us"></i>Vintorex from ${inr(price)}${per(s.billing)}</span><span><i class="dot mk"></i>Market ${inr(lo)}–${inr(hi)}${per(s.billing)}</span></div>
  </div>`;
}

function leadForm({ source, service = '', compact = false, title = 'Get a free proposal' }) {
  const services = D.catalog().services;
  return `<form class="lead-form card" data-lead="${esc(source)}">
    <h3>${esc(title)}</h3>
    <div class="grid2">
      ${field('Your name', 'name', { required: true, attrs: 'autocomplete="name"' })}
      ${field('Phone / WhatsApp', 'phone', { type: 'tel', required: true, attrs: 'autocomplete="tel"' })}
      ${field('Email', 'email', { type: 'email', required: true, attrs: 'autocomplete="email"' })}
      ${field('Business name', 'company', { attrs: 'autocomplete="organization"' })}
      ${field('Service', 'service', { value: service, options: [['', 'Not sure yet'], ...services.map(s => [s.id, s.name])] })}
      ${field('Monthly / project budget', 'budget', { options: [['0', 'Select budget'], ['10000', 'Under ₹10,000'], ['30000', '₹10,000 – ₹30,000'], ['100000', '₹30,000 – ₹1,00,000'], ['250000', 'Above ₹1,00,000']] })}
    </div>
    ${compact ? '' : field('What do you need?', 'message', { rows: 3, placeholder: 'Tell us about your goals…' })}
    ${field('Website (for free audit)', 'website', { type: 'url', placeholder: 'https://' })}
    <button class="btn primary block">${icon('arrow')} Send enquiry</button>
    <p class="fine">We reply within 2 working hours · No spam</p>
  </form>`;
}

function bindLeadForms(root) {
  $$('form[data-lead]', root).forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f));
    data.source = f.dataset.lead;
    data.budget = Number(data.budget) || 0;
    if (data.website) data.message = `${data.message || ''}\nWebsite: ${data.website}`.trim();
    delete data.website;
    D.addLead(data);
    f.reset();
    f.innerHTML = `<div class="success-box">${icon('check')}<h3>Thank you, ${esc(data.name.split(' ')[0])}!</h3><p>Our team will call you on ${esc(data.phone)} shortly. Prefer chat? <a href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">WhatsApp us</a>.</p></div>`;
    toast('Enquiry received — we’ll be in touch soon');
  }));
}

function bindCartButtons(root) {
  $$('[data-add]', root).forEach(b => b.addEventListener('click', () => {
    const [type, ref, tier] = b.dataset.add.split('|');
    const item = { type, ref };
    if (tier) item.tier = tier;
    if (type === 'plan') item.cycle = $('[data-cycle].on', root)?.dataset.cycle || 'month';
    D.addToCart(item);
    toast('Added to cart');
    if (b.dataset.go) go(b.dataset.go);
  }));
}

// ---------------- Home ----------------
function partnersStrip() {
  const partners = [
    { name: 'Google Partner', desc: 'Search & Maps Certified', ic: 'search' },
    { name: 'Meta Business', desc: 'Ads & Instagram Verified', ic: 'social' },
    { name: 'Shopify Partner', desc: 'E-commerce Specialist', ic: 'bag' },
    { name: 'WordPress', desc: 'Enterprise CMS & Woo', ic: 'web' },
    { name: 'Razorpay', desc: 'Secure UPI & Cards', ic: 'shield' },
    { name: 'AWS Cloud', desc: 'High-Availability Hosting', ic: 'cloud' },
    { name: 'OpenAI', desc: 'AI Agents & Automation', ic: 'spark' },
  ];
  return `<section class="shell partner-strip">
    <span class="partner-label">Certified Partners &amp; Tech Stack</span>
    <div class="partner-row">
      ${partners.map(p => `
        <div class="partner-item">
          <span class="partner-ic">${icon(p.ic)}</span>
          <div class="partner-text"><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></div>
        </div>
      `).join('')}
    </div>
  </section>`;
}

export function home() {
  const c = D.catalog();
  const featured = ['web-design', 'ecommerce', 'seo', 'social-media', 'advertising', 'branding'].map(D.service).filter(Boolean);
  return {
    title: 'Digital Marketing & Web Development in Coimbatore',
    description: 'Websites, online stores, SEO, social media, ads, branding and AI automation in Coimbatore with 100% published prices set below typical agency rates.',
    keywords: CATALOG_KEYWORDS,
    image: 'https://vintorex.com/images/hero-dashboard.jpg',
    imageAlt: 'Studio monitor showing a client growth dashboard with rising campaign bars at Vintorex Digital Solutions',
    html: `
    <section class="hero">
      <div class="shell hero-grid">
        <div>
          <p class="eyebrow"><span></span>Digital marketing company · Coimbatore</p>
          <h1>Boost your business with <em>Vintorex Digital</em></h1>
          <p class="lead">Websites, online stores, SEO, social media and ads — with transparent prices set below typical agency rates. ${esc(BUSINESS.tagline)}</p>
          <div class="row gap wrap">
            <a class="btn primary lg" href="#/services">Explore services ${icon('arrow')}</a>
            <a class="btn ghost lg" href="#/pricing">See pricing</a>
            <a class="btn ghost lg" href="#audit">Free audit</a>
          </div>
          <ul class="ticks">
            <li>${icon('check')}Fixed, published prices</li>
            <li>${icon('check')}18% GST tax invoices</li>
            <li>${icon('check')}Live client reporting dashboard</li>
            <li>${icon('check')}2-hour average response time</li>
          </ul>
        </div>
        <div class="hero-card-wrap">
          <div class="hero-photo-card">
            <div class="hero-float float-top"><span class="dot-live"></span><b>Google &amp; Meta Partner</b></div>
            <div class="hero-float float-bottom"><span class="h-spark">${icon('spark')}</span><b>3.4× Average Client ROI</b></div>
            <img class="hero-photo" src="/images/hero-dashboard.jpg" alt="Studio monitor showing a client growth dashboard with rising coral and indigo campaign bars" width="1600" height="900" decoding="async">
          </div>
        </div>
      </div>
    </section>

    ${partnersStrip()}

    <section class="shell stats">
      <div class="stat-card"><span class="stat-ic">${icon('spark')}</span><div><b>${c.services.length}+</b><span>Services Under One Roof</span></div></div>
      <div class="stat-card"><span class="stat-ic">${icon('target')}</span><div><b>15–40%</b><span>Below Metro Agency Pricing</span></div></div>
      <div class="stat-card"><span class="stat-ic">${icon('zap')}</span><div><b>2 Hours</b><span>Average Reply Time</span></div></div>
      <div class="stat-card"><span class="stat-ic">${icon('receipt')}</span><div><b>18% GST</b><span>Compliant Tax Invoicing</span></div></div>
    </section>

    <section class="shell section">
      <div class="sec-head"><div><h2>Everything you need to grow online</h2><p class="muted">Fixed scopes, published packages and transparent delivery timelines.</p></div><a href="#/services" class="link">All ${c.services.length} services ${icon('arrow')}</a></div>
      <div class="cards3">${featured.map((s, i) => serviceCard(s, i)).join('')}</div>
    </section>

    <section class="shell section">
      <div class="sec-head"><div><h2>AI & Automation for your business</h2><p class="muted">Chatbots, voice agents, workflows, content and AI search, with human review at every step.</p></div><a href="#/services?cat=ai" class="link">All AI services ${icon('arrow')}</a></div>
      <div class="cards3">${c.services.filter(s => s.cat === 'ai').slice(0, 6).map((s, i) => serviceCard(s, i + 6)).join('')}</div>
    </section>

    <section class="band">
      <div class="shell section">
        <div class="sec-head"><div><h2>Memberships that pay for themselves</h2><p class="muted">Full-funnel digital team retainer with bundled services and priority support.</p></div><a href="#/pricing" class="link">Compare plans ${icon('arrow')}</a></div>
        <div class="cards3">${c.plans.map(p => planCard(p, 'month')).join('')}</div>
      </div>
    </section>

    <section class="shell section" id="work">
      <div class="sec-head">
        <div>
          <h2>Real work that drives measurable revenue</h2>
          <p class="muted">Explore real client projects engineered in Coimbatore — from bespoke e-commerce to 3D CAD platforms.</p>
        </div>
        <a href="#/contact" class="link">Start your project ${icon('arrow')}</a>
      </div>
      <div class="cards2 work-grid">
        ${WORK_PROJECTS.map(renderWorkCard).join('')}
      </div>
    </section>

    <section class="band">
      <div class="shell section">
        <div class="sec-head">
          <div>
            <h2>What business owners say</h2>
            <p class="muted">100% verified reviews from Tamil Nadu manufacturers, retailers and founders.</p>
          </div>
          <a href="${BUSINESS.google}" target="_blank" rel="noopener" class="link">Google Reviews (4.9★) ${icon('arrow')}</a>
        </div>
        <div class="cards3 reviews-grid">
          ${[
            ['Siva Prakash', 'Prakash Textiles', 'Coimbatore', 'The live dashboard shows exactly what is being done every month. Leads from Google doubled in 90 days and our wholesale inquiries are at an all-time high.', 215],
            ['Kailash Sundaram', 'The World of Idols', 'Coimbatore', 'Our online store went live in under a month and online sales grew 300%. The instant Razorpay checkout and WhatsApp dispatch alerts made all the difference.', 38],
            ['Yamuna Natarajan', 'E&M Solutions', 'Coimbatore', 'The 3D interactive renders and technical catalogue made our product pitch far more professional to multinational clients. Best digital investment we’ve made.', 160],
          ].map(([n, c, city, q, h]) => `
            <figure class="card quote-card" style="--h:${h}">
              <div class="quote-stars">${icon('star')}${icon('star')}${icon('star')}${icon('star')}${icon('star')}</div>
              <blockquote>“${esc(q)}”</blockquote>
              <figcaption>
                <span class="quote-avatar" style="--h:${h}">${esc(n.split(' ').map(w => w[0]).join(''))}</span>
                <div class="quote-who">
                  <b>${esc(n)}</b>
                  <small>${esc(c)} · ${esc(city)}</small>
                </div>
                <span class="quote-verified" title="Verified Google Review">${icon('check')} Verified</span>
              </figcaption>
            </figure>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="shell section">
      <div class="sec-head"><div><h2>Guides from our blog</h2><p class="muted">Evergreen playbooks on SEO, web design, e-commerce and local growth.</p></div><a href="/blog/" class="link">All guides ${icon('arrow')}</a></div>
      <div class="cards3">${featuredPosts().map(postCard).join('')}</div>
    </section>

    <section class="shell section split audit-split" id="audit">
      <div class="audit-info">
        <p class="eyebrow"><span></span>Free website & SEO audit</p>
        <h2>Find out what’s holding your business back online</h2>
        <p class="lead">Get a free 15-point audit of your website speed, Google ranking, social presence and ad setup — with a fixed-price action plan.</p>
        <ul class="ticks col">
          <li>${icon('check')}Speed & Core Web Vitals (Mobile + Desktop)</li>
          <li>${icon('check')}Local SEO & Google Business Profile (Coimbatore pack)</li>
          <li>${icon('check')}Competitor keyword gaps & high-intent opportunities</li>
          <li>${icon('check')}Social media & paid ads conversion quick wins</li>
        </ul>

        <div class="audit-preview card">
          <div class="audit-preview-head">
            <span class="dot-live"></span>
            <b>Live 15-Point Digital Health Score</b>
            <span class="audit-pill">Free Audit</span>
          </div>
          <div class="audit-preview-body">
            <img class="audit-scorecard-img" src="/images/audit-scorecard.jpg" alt="Printed website and SEO health report with score rings and green checklist ticks beside a laptop" width="1600" height="900" loading="lazy" decoding="async">
            <ol class="audit-flow" aria-label="How the free audit works">
              <li><span class="af-n">1</span><div><b>Share your details</b><small>Website, business and goals</small></div></li>
              <li><span class="af-n">2</span><div><b>Speed & Web Vitals</b><small>Mobile and desktop scan</small></div></li>
              <li><span class="af-n">3</span><div><b>Local SEO check</b><small>Google Business Profile and Maps</small></div></li>
              <li><span class="af-n">4</span><div><b>Competitor & ads review</b><small>Keyword gaps, social and paid quick wins</small></div></li>
              <li><span class="af-n">5</span><div><b>Your report</b><small>Health score and fixed-price action plan</small></div></li>
            </ol>
          </div>
        </div>
      </div>
      ${leadForm({ source: 'Free audit', compact: true, title: 'Request my free audit' })}
    </section>`,
    bind: root => { bindLeadForms(root); bindCartButtons(root); bindCycle(root); },
  };
}

function serviceCard(s, idx = 0) {
  const from = fromPrice(s);
  return `<a class="card svc" href="#/services/${s.id}">
    ${serviceCardArt(s, idx)}
    <div class="svc-body">
      <div class="svc-top">
        <span class="svc-ic">${icon(s.icon)}</span>
        <span class="svc-badge">${s.billing === 'month' ? 'Monthly Retainer' : 'One-Time Project'}</span>
      </div>
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.summary)}</p>
      <div class="svc-foot">
        <div><small class="muted">Starting from</small><div class="svc-price"><b>${inr(from)}</b>${per(s.billing)}</div></div>
        <span class="svc-arrow" aria-hidden="true">${icon('arrow')}</span>
      </div>
    </div>
  </a>`;
}


function planCard(p, cycle) {
  const annual = cycle === 'year';
  const monthly = annual ? Math.round(p.price * ANNUAL_MONTHS_PAID / 12) : p.price;
  const value = D.planValue(p);
  return `<article class="card plan ${p.popular ? 'pop' : ''}">
    ${p.popular ? '<span class="ribbon">Most popular</span>' : ''}
    <h3>${esc(p.name)}</h3><p class="muted">${esc(p.tagline)}</p>
    <div class="price">${p.price ? `${inr(monthly)}<small>/mo</small>` : 'Free'}</div>
    ${p.price && annual ? `<p class="fine">Billed ${inr(p.price * ANNUAL_MONTHS_PAID)} yearly · 2 months free</p>` : value > p.price ? `<p class="fine">Worth ${inr(value)}/mo bought separately — save ${Math.round((1 - p.price / value) * 100)}%</p>` : '<p class="fine">No card required</p>'}
    <ul class="ticks col">${p.features.map(f => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>
    ${p.price ? `<button class="btn ${p.popular ? 'primary' : 'ghost'} block" data-add="plan|${p.id}" data-go="/cart">Subscribe</button>` : `<a class="btn ghost block" href="#/register">Create free account</a>`}
  </article>`;
}

function bindCycle(root) {
  $$('[data-cycle]', root).forEach(b => b.addEventListener('click', () => {
    $$('[data-cycle]', root).forEach(x => x.classList.toggle('on', x === b));
    const host = $('#plan-cards', root);
    if (host) { host.innerHTML = D.catalog().plans.map(p => planCard(p, b.dataset.cycle)).join(''); bindCartButtons(host); }
  }));
}

// ---------------- Services ----------------
export function services(params, query) {
  const cat = query.get('cat') || 'all';
  const list = D.catalog().services.filter(s => cat === 'all' || s.cat === cat);
  const catObj = CATEGORIES.find(c => c.id === cat);
  const title = catObj ? `${catObj.name} Services | Vintorex Coimbatore` : 'All 21 Digital Services & Packages | Vintorex Coimbatore';
  const description = catObj ? `${catObj.name}: ${catObj.blurb}. Fixed packages with published prices set below typical metro agency rates.` : 'Explore 21 fixed digital marketing, web design, SEO, ads, branding and AI automation services with transparent prices.';
  return {
    title,
    description,
    keywords: cat === 'all' ? CATALOG_KEYWORDS : list.map(s => ART[s.id]?.keywords).filter(Boolean).join(', '),
    image: cat === 'all' ? 'https://vintorex.com/images/hero-dashboard.jpg' : `https://vintorex.com${serviceImagePath(list[0]?.id || 'web-design')}`,
    imageAlt: cat === 'all' ? 'Vintorex Digital Solutions service photography for websites, marketing, cloud and AI' : (ART[list[0]?.id]?.alt || title),
    html: `<section class="shell section">
      <div class="page-head"><h1>Our services</h1><p class="lead">Every service has fixed packages, published prices and a market comparison so you know exactly what you pay for.</p></div>
      <nav class="chips" aria-label="Service categories">
        <a href="#/services" class="chip ${cat === 'all' ? 'on' : ''}">All</a>
        ${CATEGORIES.map(c => `<a href="#/services?cat=${c.id}" class="chip ${cat === c.id ? 'on' : ''}">${esc(c.name)} <small>${esc(c.blurb)}</small></a>`).join('')}
      </nav>
      <div class="cards3">${list.map((s, i) => serviceCard(s, i)).join('')}</div>
    </section>`,
  };
}

const cell = v => v === 1 ? `<span class="yes" aria-label="Included">${icon('check')}</span>` : v === 0 ? '<span class="no" aria-label="Not included">—</span>' : esc(v);
const unit = s => per(s.billing) || ' one-time';
const defaultTier = s => { const i = s.tiers.findIndex(t => t.popular); return i < 0 ? 1 : i; };

// Where our most popular package sits against the market range.
export function position(s) {
  const t = s.tiers.find(t => t.popular) || s.tiers[1];
  const [lo, hi] = s.market;
  if (t.price < lo) return ['Below market', 'green'];
  if (t.price > hi) return ['Above market', 'amber'];
  return t.price <= lo + (hi - lo) / 3 ? ['Lower third of market', 'green'] : ['Within market', 'blue'];
}

function splitPanel(s, ti) {
  const t = s.tiers[ti];
  const rows = D.splitFor(s, ti);
  const gst = D.db().settings.gst;
  const gross = Math.round(t.price * (1 + gst / 100));
  const schedule = s.billing === 'once' && t.price >= MILESTONE_MIN ? D.milestoneSchedule(gross) : null;
  return `<div class="split-panel" data-panel="${ti}" ${ti === defaultTier(s) ? '' : 'hidden'}>
    <div class="stack" role="img" aria-label="Cost split of ${esc(t.name)}">${rows.map((r, i) => `<i class="c${i}" style="width:${r.pct}%" title="${esc(r.label)} ${r.pct}%"></i>`).join('')}</div>
    <div class="split-grid">
      <table class="table split-table"><thead><tr><th>Component</th><th>Share</th><th class="right">Amount</th></tr></thead><tbody>
        ${rows.map((r, i) => `<tr><td><span class="sw c${i}"></span>${esc(r.label)}</td><td>${r.pct}%</td><td class="right">${inr(r.amount)}</td></tr>`).join('')}
        <tr class="sum"><td>${esc(t.name)} package${s.billing === 'month' ? ' (monthly)' : ''}</td><td>100%</td><td class="right">${inr(t.price)}</td></tr>
        <tr><td class="muted">GST ${gst}%</td><td></td><td class="right muted">${inr(gross - t.price)}</td></tr>
        <tr class="sum"><td>Total payable${s.billing === 'month' ? ' per month' : ''}</td><td></td><td class="right">${inr(gross)}</td></tr>
      </tbody></table>
      <div class="card pay-card">
        <h4>${schedule ? 'Pay in milestones' : s.billing === 'month' ? 'How billing works' : 'Payment'}</h4>
        ${schedule ? `<ol class="milestones">${schedule.map(m => `<li><span><b>${m.pct}%</b> ${esc(m.label)}</span><b>${inr(m.amount)}</b></li>`).join('')}</ol><p class="fine">Choose “Pay in milestones” at checkout. Amounts include GST. Or pay in full upfront.</p>`
        : s.billing === 'month' ? `<ul class="ticks col"><li>${icon('check')}Billed monthly in advance, GST extra</li><li>${icon('check')}${esc(s.term)}</li><li>${icon('check')}Premium / Elite members get this bundled — <a href="#/pricing">see plans</a></li></ul>`
        : '<p class="muted">Paid in full at checkout — small projects start the same day.</p>'}
      </div>
    </div>
  </div>`;
}

export function serviceDetail({ id }) {
  const s = D.service(id);
  if (!s) return notFound();
  const addons = D.addonsFor(s.id);
  const popular = s.tiers.findIndex(t => t.popular);
  const sections = [['packages', 'Packages'], ['included', 'What’s included'], ['split', 'Price split'], ['addons', 'Add-ons'], ['compare', 'Competitor analysis'], ['guides', 'Guides'], ['process', 'Process']];
  const [pos, tone] = position(s);
  const catName = CATEGORIES.find(c => c.id === s.cat)?.name || s.cat;
  return {
    title: s.name,
    description: s.summary || s.overview,
    keywords: ART[s.id]?.keywords || `${s.name}, ${catName}, Vintorex Coimbatore`,
    image: `https://vintorex.com${serviceImagePath(s.id)}`,
    imageAlt: ART[s.id]?.alt || `${s.name} by Vintorex Digital Solutions in Coimbatore`,
    html: `<section class="shell section">
      <a href="#/services" class="link back">← All services</a>
      <div class="detail-head">
        <span class="svc-ic lg">${icon(s.icon)}</span>
        <div><h1>${esc(s.name)}</h1><p class="lead">${esc(s.overview || s.summary)}</p>
        <div class="facts"><span>${icon('repeat')}${s.billing === 'month' ? 'Monthly retainer' : 'One-time project'}</span><span>${icon('star')}${esc(s.delivery)}</span><span>${icon('receipt')}${esc(s.term || '')}</span><span>${icon('tag')}From ${inr(fromPrice(s))}${per(s.billing)}</span></div>
        ${s.note ? `<p class="hint">${icon('ads')}${esc(s.note)}</p>` : ''}</div>
        ${serviceArt(s, D.catalog().services.indexOf(s))}
      </div>
      <nav class="subnav" aria-label="On this page">${sections.map(([id, l]) => `<button data-jump="${id}">${l}</button>`).join('')}</nav>
      <div id="packages">${marketBar(s, fromPrice(s))}</div>
      <div class="cards3 tiers">${s.tiers.map((t, ti) => `
        <article class="card plan ${t.popular ? 'pop' : ''}">
          ${t.popular ? '<span class="ribbon">Best value</span>' : ''}
          <h3>${esc(t.name)}</h3>
          <div class="price">${inr(t.price)}<small>${unit(s)}</small></div>
          <p class="fine">+ ${D.db().settings.gst}% GST${s.billing === 'once' && t.price >= MILESTONE_MIN ? ' · pay 40% to start' : ''}</p>
          <ul class="ticks col">${t.features.map(f => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>
          <button class="link-btn" data-jump="split" data-tier="${ti}">See price split →</button>
          <button class="btn ${t.popular ? 'primary' : 'ghost'} block" data-add="package|${s.id}|${esc(t.name)}">Add to cart</button>
        </article>`).join('')}
      </div>
    </section>

    <section class="band" id="included"><div class="shell section">
      <div class="sec-head"><div><h2>Everything included</h2><p class="muted">${s.works.length} work items across the three packages.</p></div></div>
      <div class="card table-wrap"><table class="table matrix">
        <thead><tr><th>Work item</th>${s.tiers.map(t => `<th class="${t.popular ? 'pop-col' : ''}">${esc(t.name)}<small>${inr(t.price)}${per(s.billing)}</small></th>`).join('')}</tr></thead>
        <tbody>${s.works.map(([label, ...v]) => `<tr><td>${esc(label)}</td>${v.map((x, i) => `<td class="${i === popular ? 'pop-col' : ''}">${cell(x)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <div class="cards2 below-matrix">
        <div class="card"><h3>Ideal for</h3><ul class="ticks col">${s.idealFor.map(x => `<li>${icon('check')}${esc(x)}</li>`).join('')}</ul></div>
        <div class="card"><h3>Not included</h3><ul class="ticks col excl">${s.excludes.map(x => `<li>${icon('x')}${esc(x)}</li>`).join('')}</ul></div>
      </div>
    </div></section>

    <section class="shell section" id="split">
      <div class="sec-head"><div><h2>Price split</h2><p class="muted">Where every rupee of each package goes${s.billing === 'once' ? ', and how you can pay for it' : ''}.</p></div>
        <div class="toggle" role="group" aria-label="Package">${s.tiers.map((t, ti) => `<button data-tier-tab="${ti}" class="${ti === defaultTier(s) ? 'on' : ''}">${esc(t.name)}</button>`).join('')}</div></div>
      ${s.tiers.map((_, ti) => splitPanel(s, ti)).join('')}
    </section>

    <section class="band" id="addons"><div class="shell section">
      <div class="sec-head"><div><h2>Add-ons for ${esc(s.name)}</h2><p class="muted">Add to any package. Monthly add-ons renew with your plan.</p></div><a class="link" href="#/shop#addons">All add-ons ${icon('arrow')}</a></div>
      <div class="cards3">${addons.map(addonCard).join('')}</div>
    </div></section>

    <section class="shell section" id="compare">
      <div class="sec-head"><div><h2>Competitor analysis</h2><p class="muted">Published prices checked October 2026. Competitor prices may exclude GST, ad spend or setup.</p></div><a class="link" href="#/compare">All services ${icon('arrow')}</a></div>
      ${marketBar(s, (s.tiers.find(t => t.popular) || s.tiers[1]).price)}
      <p class="position">Our most popular package is <span class="badge ${tone}">${pos}</span> ${s.marketNote ? `<small class="muted">(${esc(s.marketNote)})</small>` : ''}</p>
      ${compTable(s)}
    </section>

    <section class="shell section" id="guides">
      <div class="sec-head"><div><h2>Guides for ${esc(s.name)}</h2><p class="muted">Evergreen articles from our blog.</p></div><a class="link" href="/blog/#${s.id}">All guides ${icon('arrow')}</a></div>
      <div class="cards2">${serviceGuides(s.id)}</div>
    </section>

    <section class="band" id="process"><div class="shell section">
      <h2>How we deliver</h2>
      <ol class="timeline">${s.process.map(([t, d], i) => `<li><span>${i + 1}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join('')}</ol>
    </div></section>

    <section class="shell section split">
      <div><h2>Need something custom?</h2><p class="lead">Tell us what you need and get a tailored quote for ${esc(s.name.toLowerCase())} within one working day.</p>
      ${contactCards('compact')}</div>
      ${leadForm({ source: 'Service quote', service: s.id, title: 'Request a custom quote' })}
    </section>`,
    bind: root => {
      bindCartButtons(root); bindLeadForms(root);
      const showTier = ti => {
        $$('[data-tier-tab]', root).forEach(b => b.classList.toggle('on', b.dataset.tierTab === String(ti)));
        $$('[data-panel]', root).forEach(p => { p.hidden = p.dataset.panel !== String(ti); });
      };
      $$('[data-tier-tab]', root).forEach(b => b.addEventListener('click', () => showTier(b.dataset.tierTab)));
      $$('[data-jump]', root).forEach(b => b.addEventListener('click', () => {
        if (b.dataset.tier) showTier(b.dataset.tier);
        document.getElementById(b.dataset.jump)?.scrollIntoView({ behavior: 'smooth' });
      }));
    },
  };
}

function compTable(s) {
  const ours = s.tiers.map(t => `${esc(t.name)} ${inr(t.price)}`).join(' · ') + per(s.billing);
  const srcLinks = keys => keys.map(k => COMPETITOR_SOURCES[k]).filter(Boolean).map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener" title="${esc(t)}">${esc(t.split(' — ')[0])}</a>`).join(', ');
  return `<div class="card table-wrap"><table class="table comp">
    <thead><tr><th>Provider</th><th>Price</th><th>What you get</th><th>Watch-outs</th><th>Source</th></tr></thead>
    <tbody>
      <tr class="us"><td><b>Vintorex</b><small>Coimbatore agency</small></td><td><b>${ours}</b></td><td>${s.works.length} itemised work items, ${s.billing === 'once' ? 'milestone payments' : esc(s.term.toLowerCase())}, GST invoice, live dashboard.</td><td>${esc(s.excludes[0])}.</td><td>This page</td></tr>
      ${s.competitors.map(c => `<tr><td><b>${esc(c.name)}</b><small>${esc(c.kind)}</small></td><td>${esc(c.price)}</td><td>${esc(c.includes)}</td><td>${esc(c.gaps)}</td><td>${srcLinks(c.src)}</td></tr>`).join('')}
    </tbody></table>
    ${s.competitors.length ? '' : `<p class="muted pad">No competitor publishes a rate card for this service — they quote per project. The market range above is our estimate.</p>`}</div>`;
}

// ---------------- Competitor analysis ----------------
export function compare() {
  const c = D.catalog();
  const named = [...new Set(c.services.flatMap(s => s.competitors.filter(x => !/market|listings/i.test(x.kind)).map(x => x.name)))];
  return {
    title: 'Competitor analysis',
    description: `We benchmarked Vintorex pricing against ${named.length} competitors across Coimbatore agencies, national agencies and DIY platforms. 100% transparent rate cards with milestone billing.`,
    keywords: 'digital marketing competitor analysis, coimbatore agency rates comparison, web design pricing benchmark, seo packages price comparison, transparent agency pricing',
    image: 'https://vintorex.com/images/hero-dashboard.jpg',
    imageAlt: 'Studio monitor showing a client growth dashboard used to compare Vintorex pricing',
    html: `<section class="shell section">
      <div class="page-head"><h1>How our prices compare</h1>
        <p class="lead">We checked published prices from ${named.length} named competitors — Coimbatore agencies, national agencies and DIY platforms — plus market-range guides for every service. Each row links to the full breakdown.</p>
        <div class="facts"><span>${icon('search')}${c.services.length} services analysed</span><span>${icon('users')}${named.length} named competitors</span><span>${icon('receipt')}Prices checked Oct 2026, ex-GST</span></div>
      </div>
      <div class="card table-wrap"><table class="table comp-all">
        <thead><tr><th>Service</th><th>Vintorex packages</th><th>Named competitors</th><th>Market range</th><th>Our position</th></tr></thead>
        <tbody>${c.services.map(s => {
          const [pos, tone] = position(s);
          const comps = s.competitors.filter(x => !/market/i.test(x.kind));
          return `<tr>
            <td><a href="#/services/${s.id}#compare"><b>${esc(s.name)}</b></a><small>${s.billing === 'month' ? 'Monthly' : 'One-time'}</small></td>
            <td>${s.tiers.map(t => `<div class="tier-line"><span>${esc(t.name)}</span><b>${inr(t.price)}</b></div>`).join('')}</td>
            <td>${comps.length ? comps.map(x => `<div class="comp-line"><b>${esc(x.name)}</b><span>${esc(x.price)}</span></div>`).join('') : '<span class="muted">No published rate cards</span>'}</td>
            <td>${inr(s.market[0])} – ${inr(s.market[1])}${per(s.billing)}${s.marketNote ? '<small class="muted">Estimate</small>' : ''}</td>
            <td><span class="badge ${tone}">${pos}</span></td></tr>`;
        }).join('')}</tbody>
      </table></div>
      <div class="cards2 below-matrix">
        <div class="card"><h3>What we found</h3><ul class="ticks col">
          <li>${icon('check')}Coimbatore agencies (Visual Birds, PG Softwares) publish social and SEO packages from ₹8,499–₹15,000/mo. Our entry tiers match or undercut them and include more posts and blog content.</li>
          <li>${icon('check')}National SEO agencies start at ₹45,000/mo (iDigitalise). Our Premium SEO at ₹29,999 includes AI-search optimisation.</li>
          <li>${icon('check')}DIY platforms (Shopify, Wix, Hostinger) look cheaper monthly, but leave design, setup, content and marketing to you.</li>
          <li>${icon('check')}Most competitors don’t itemise deliverables. We list ${c.services.reduce((a, s) => a + s.works.length, 0)} work items and a price split for every package.</li>
        </ul></div>
        <div class="card"><h3>How to read this</h3><ul class="ticks col">
          <li>${icon('check')}“Our position” compares our most popular package with the market range.</li>
          <li>${icon('check')}Competitor prices are as published and may exclude GST, ad spend, platform fees or setup.</li>
          <li>${icon('check')}Market ranges come from Indian pricing guides. Some are written by agencies, so treat them as indicative.</li>
        </ul></div>
      </div>
      <h2 class="h3">Sources</h2>
      <ul class="sources cols">${SOURCES.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>
    </section>`,
  };
}

const addonCard = a => `<article class="card addon" data-for="${esc((a.for || []).join(' '))}"><div><h4>${esc(a.name)}</h4><p>${esc(a.desc)}</p>
  <small class="for">${a.for?.length ? 'For ' + a.for.map(id => esc(D.service(id)?.name || id)).join(', ') : 'Works with every service'}</small></div>
  <div class="addon-foot"><b>${inr(a.price)}<small>${per(a.billing) || ' once'}</small></b><button class="btn sm ghost" data-add="addon|${a.id}">${icon('plus')} Add</button></div></article>`;

// All add-ons with a by-service filter.
function addonBrowser(addons) {
  const used = D.catalog().services.filter(s => addons.some(a => a.for?.includes(s.id)));
  return `<nav class="chips" aria-label="Filter add-ons"><button class="chip on" data-afilter="">All (${addons.length})</button>${used.map(s => `<button class="chip" data-afilter="${s.id}">${esc(s.name)}</button>`).join('')}</nav>
    <div class="cards3" data-addon-grid>${addons.map(addonCard).join('')}</div>`;
}
function bindAddonBrowser(root) {
  $$('[data-afilter]', root).forEach(b => b.addEventListener('click', () => {
    $$('[data-afilter]', root).forEach(x => x.classList.toggle('on', x === b));
    const id = b.dataset.afilter;
    $$('[data-addon-grid] .addon', root).forEach(card => { card.hidden = !!id && !!card.dataset.for && !card.dataset.for.split(' ').includes(id); });
  }));
}

// ---------------- Pricing ----------------
export function pricing() {
  const c = D.catalog();
  return {
    title: 'Pricing',
    description: 'Simple, transparent pricing for all digital services, monthly growth memberships, and project add-ons with milestone payment options.',
    keywords: 'digital marketing pricing coimbatore, web development cost, marketing retainer plans, agency membership, transparent pricing india',
    image: 'https://vintorex.com/images/hero-dashboard.jpg',
    imageAlt: 'Studio monitor showing a client growth dashboard beside Vintorex pricing',
    html: `<section class="shell section">
      <div class="page-head center"><h1>Simple, transparent pricing</h1><p class="lead">Pick a membership for ongoing growth, or buy any service on its own. Members get up to 15% off every one-time project.</p>
        <div class="toggle" role="group" aria-label="Billing cycle"><button data-cycle="month" class="on">Monthly</button><button data-cycle="year">Annual <span class="badge green">2 months free</span></button></div>
      </div>
      <div class="cards3" id="plan-cards">${c.plans.map(p => planCard(p, 'month')).join('')}</div>
    </section>

    <section class="band"><div class="shell section">
      <div class="sec-head"><div><h2>Full price list vs market</h2><p class="muted">Every package price, the India 2026 market range and where we sit. All prices exclude GST.</p></div><a class="btn ghost" href="#/compare">${icon('chart')} Full competitor analysis</a></div>
      <div class="table-wrap card"><table class="table">
        <thead><tr><th>Service</th>${['Entry', 'Popular', 'Top'].map(h => `<th class="right">${h}</th>`).join('')}<th>Market range</th><th>Our position</th><th></th></tr></thead>
        <tbody>${c.services.map(s => {
          const [pos, tone] = position(s);
          return `<tr><td><b>${esc(s.name)}</b><small class="muted block">${s.billing === 'month' ? 'per month' : 'one-time'}</small></td>
            ${s.tiers.map(t => `<td class="right ${t.popular ? 'pop-col' : ''}"><small class="muted block">${esc(t.name)}</small><b>${inr(t.price)}</b></td>`).join('')}
            <td>${inr(s.market[0])} – ${inr(s.market[1])}</td><td><span class="badge ${tone}">${pos}</span></td><td><a class="link" href="#/services/${s.id}">Details</a></td></tr>`;
        }).join('')}</tbody>
      </table></div>
      <p class="fine">“Our position” compares the most popular package with the market range. Sources and named competitor prices are on the <a href="#/compare">competitor analysis</a> page.</p>
    </div></section>

    <section class="shell section" id="addons">
      <div class="sec-head"><h2>Add-ons</h2><p class="muted">Bolt these onto any plan or project.</p></div>
      ${addonBrowser(c.addons)}
    </section>

    <section class="band"><div class="shell section faq">
      <h2>Frequently asked questions</h2>
      ${[['Is GST included?', `Prices exclude ${D.db().settings.gst}% GST, which is added at checkout and shown on your invoice.`],
         ['Can I cancel a membership?', 'Yes. Monthly plans can be cancelled anytime from your dashboard and stay active until the end of the billing period.'],
         ['Is ad spend included in ads management?', 'No. Ad spend is paid directly to Google or Meta. Our fee covers strategy, setup, creatives and optimisation.'],
         ['How do member discounts work?', 'Premium members get 10% and Elite members 15% off any one-time service package, applied automatically at checkout.'],
         ['Do you work outside Coimbatore?', 'Yes — we work with clients across India and abroad. Video shoots are on-site in Coimbatore or remote with your footage.']]
        .map(([q, a]) => `<details class="card"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
    </div></section>`,
    bind: root => { bindCartButtons(root); bindCycle(root); bindAddonBrowser(root); },
  };
}

// ---------------- Shop ----------------
const SHOP_SORTS = {
  featured: ['Featured', null],
  'price-asc': ['Price: low to high', (a, b) => a.price - b.price],
  'price-desc': ['Price: high to low', (a, b) => b.price - a.price],
  'name-asc': ['Name: A to Z', (a, b) => a.name.localeCompare(b.name)],
  'name-desc': ['Name: Z to A', (a, b) => b.name.localeCompare(a.name)],
  discount: ['Biggest discount', (a, b) => (1 - b.price / b.mrp) - (1 - a.price / a.mrp)],
};
const productCard = p => `<article class="card product">
  ${art(p)}
  <div class="product-body"><h4>${esc(p.name)}</h4>
  <div class="row between"><span><b>${inr(p.price)}</b> <s>${inr(p.mrp)}</s></span><span class="badge green">${Math.round((1 - p.price / p.mrp) * 100)}% off</span></div>
  <button class="btn sm primary block" data-add="product|${p.id}">Add to cart</button></div>
</article>`;
// Products per page follow the screen: fewer on phones, more on wide displays.
const shopPageSize = () => innerWidth >= 1200 ? 12 : innerWidth >= 700 ? 9 : 6;

// Search, type filter, sort and pagination for the downloads grid.
function bindShopBrowser(root, items) {
  const form = $('[data-shop-tools]', root), grid = $('[data-shop-grid]', root), pager = $('[data-shop-pager]', root), count = $('[data-shop-count]', root);
  let page = 1;
  const draw = (scroll) => {
    const q = form.q.value.trim().toLowerCase(), kind = form.kind.value, cmp = SHOP_SORTS[form.sort.value][1];
    let list = items.filter(p => (!kind || p.kind === kind) && (!q || `${p.name} ${p.kind}`.toLowerCase().includes(q)));
    if (cmp) list = [...list].sort(cmp);
    const size = shopPageSize(), pages = Math.max(1, Math.ceil(list.length / size));
    page = Math.min(page, pages);
    const from = (page - 1) * size;
    grid.innerHTML = list.length ? list.slice(from, from + size).map(productCard).join('') : '<p class="muted">No downloads match your search.</p>';
    count.textContent = list.length ? `Showing ${from + 1}–${Math.min(from + size, list.length)} of ${list.length} downloads` : '';
    const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b);
    pager.hidden = pages < 2;
    pager.innerHTML = pages < 2 ? '' : `<button class="chip" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">‹ Prev</button>`
      + nums.map((n, i) => `${i && n - nums[i - 1] > 1 ? '<span class="pager-gap" aria-hidden="true">…</span>' : ''}<button class="chip${n === page ? ' on' : ''}" data-page="${n}" ${n === page ? 'aria-current="page"' : ''} aria-label="Page ${n}">${n}</button>`).join('')
      + `<button class="chip" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next page">Next ›</button>`;
    bindCartButtons(grid);
    if (scroll) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('input', () => { page = 1; draw(); });
  pager.addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b && !b.disabled) { page = +b.dataset.page; draw(true); } });
  let lastSize = shopPageSize();
  addEventListener('resize', () => { if (!grid.isConnected) return; const n = shopPageSize(); if (n !== lastSize) { lastSize = n; draw(); } });
  draw();
}

export function shop() {
  const c = D.catalog();
  const items = c.products.filter(p => p.active !== false);
  return {
    title: 'Shop',
    description: 'Digital downloads, templates, SEO spreadsheets, client agreements, and quick add-on services with instant delivery from Vintorex Digital.',
    keywords: ['vintorex shop', 'digital downloads', 'printable art prints', 'wall art download', ...Object.values(SHOP_ART).map(a => a.keywords), 'social media template pack', 'local seo checklist', 'content calendar template'].join(', '),
    image: 'https://vintorex.com/images/shop/seo-checklist.jpg',
    imageAlt: 'Printed local SEO checklist booklet with tick marks, a magnifying glass, and a map pin',
    html: `<section class="shell section">
      <div class="page-head"><h1>Shop</h1><p class="lead">Digital downloads, templates and quick add-on services — instant checkout.</p></div>
      <h2 class="h3">Digital downloads</h2>
      <form class="filters card shop-tools" role="search" data-shop-tools>
        <input type="search" name="q" placeholder="Search downloads…" aria-label="Search downloads" autocomplete="off">
        <select name="kind" aria-label="Filter by type"><option value="">All types</option>${[...new Set(items.map(p => p.kind))].map(k => `<option>${esc(k)}</option>`).join('')}</select>
        <select name="sort" aria-label="Sort downloads">${Object.entries(SHOP_SORTS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>
      </form>
      <p class="muted shop-count" data-shop-count aria-live="polite"></p>
      <div class="cards4" data-shop-grid></div>
      <nav class="pager" aria-label="Shop pages" data-shop-pager></nav>
      <h2 class="h3" id="addons">Quick services & add-ons</h2>
      ${addonBrowser(c.addons)}
    </section>`,
    bind: root => { bindShopBrowser(root, items); bindCartButtons($('[data-addon-grid]', root)); bindAddonBrowser(root); },
  };
}

// ---------------- Cart & checkout ----------------
let coupon = '';
export function cart() {
  const items = D.getCart();
  const user = D.currentUser();
  const q = D.quote(items, user, coupon);
  if (!q.lines.length) return { title: 'Cart', html: `<section class="shell section narrow"><h1>Your cart</h1>${empty('Your cart is empty.', '<a class="btn primary" href="#/services">Browse services</a>')}</section>` };
  return {
    title: 'Cart',
    html: `<section class="shell section">
      <h1>Your cart</h1>
      <div class="checkout-grid">
        <div class="card">
          ${q.lines.map((l, i) => `<div class="cart-line">
            <div><small class="muted">${esc(l.info.kind)}</small><h4>${esc(l.info.title)}</h4><span class="muted">${inr(l.info.unit)}${per(l.info.billing)}</span></div>
            <div class="row gap">
              ${['package', 'addon'].includes(l.type) ? `<div class="qty"><button data-qty="${i}|-1" aria-label="Decrease">−</button><span>${l.qty}</span><button data-qty="${i}|1" aria-label="Increase">+</button></div>` : ''}
              <b class="amt">${inr(l.total)}</b>
              <button class="icon-btn" data-remove="${i}" aria-label="Remove">${icon('x')}</button>
            </div>
          </div>`).join('')}
          <form class="coupon row gap" id="coupon"><input name="code" placeholder="Coupon code (try WELCOME10)" value="${esc(coupon)}" aria-label="Coupon code"><button class="btn ghost">Apply</button></form>
        </div>
        ${summary(q, `<a class="btn primary block lg" href="#/checkout">Proceed to checkout ${icon('arrow')}</a>`)}
      </div>
    </section>`,
    bind: root => {
      $$('[data-remove]', root).forEach(b => b.addEventListener('click', () => { const c = D.getCart(); c.splice(+b.dataset.remove, 1); D.setCart(c); rerender(); }));
      $$('[data-qty]', root).forEach(b => b.addEventListener('click', () => { const [i, d] = b.dataset.qty.split('|').map(Number); const c = D.getCart(); c[i].qty = Math.max(1, c[i].qty + d); D.setCart(c); rerender(); }));
      $('#coupon', root).addEventListener('submit', e => {
        e.preventDefault();
        const code = new FormData(e.target).get('code').trim();
        const ok = !code || D.catalog().coupons.some(c => c.code === code.toUpperCase() && c.active !== false);
        if (!ok) return toast('That coupon is not valid', 'err');
        coupon = code.toUpperCase(); toast(code ? 'Coupon applied' : 'Coupon removed'); rerender();
      });
    },
  };
}

function summary(q, cta) {
  return `<aside class="card summary">
    <h3>Order summary</h3>
    <dl>
      <div><dt>Subtotal</dt><dd>${inr(q.subtotal)}</dd></div>
      ${q.memberOff ? `<div class="good"><dt>Member discount (${q.memberPct}%)</dt><dd>−${inr(q.memberOff)}</dd></div>` : ''}
      ${q.couponOff ? `<div class="good"><dt>Coupon ${esc(q.coupon.code)}</dt><dd>−${inr(q.couponOff)}</dd></div>` : ''}
      <div><dt>GST (${q.gstPct}%)</dt><dd>${inr(q.gst)}</dd></div>
      <div class="total"><dt>Total payable</dt><dd>${inr(q.total)}</dd></div>
    </dl>
    ${!q.memberPct && q.lines.some(l => l.type === 'package' && l.info.billing === 'once') ? `<p class="hint">${icon('star')} Premium members save 10% on this order. <a href="#/pricing">See plans</a></p>` : ''}
    ${cta}
  </aside>`;
}

export function checkout() {
  const user = D.currentUser();
  if (!user) { sessionStorage.setItem('vx_next', '/checkout'); return { redirect: '/login?next=checkout' }; }
  const q = D.quote(D.getCart(), user, coupon);
  if (!q.lines.length) return { redirect: '/cart' };
  return {
    title: 'Checkout',
    html: `<section class="shell section">
      <h1>Checkout</h1>
      <div class="checkout-grid">
        <form class="card" id="pay">
          <h3>Billing details</h3>
          <div class="grid2">
            ${field('Full name', 'name', { value: user.name, required: true })}
            ${field('Email', 'email', { type: 'email', value: user.email, required: true })}
            ${field('Phone', 'phone', { type: 'tel', value: user.phone || '', required: true })}
            ${field('Business name', 'company', { value: user.company || '' })}
            ${field('GSTIN (optional)', 'gstin', { value: user.gstin || '', placeholder: 'For B2B invoices' })}
            ${field('City', 'city', { value: user.city || 'Coimbatore' })}
          </div>
          ${q.milestones ? `<h3>Payment plan</h3>
          <div class="pay-plans">
            <label class="pay-opt"><input type="radio" name="plan" value="full" checked><span><b>Pay in full</b><small>${inr(q.total)} today</small></span></label>
            <label class="pay-opt"><input type="radio" name="plan" value="milestone"><span><b>Pay in milestones</b><small>${inr(q.milestones[0].amount)} today, then ${q.milestones.slice(1).map(m => inr(m.amount)).join(' + ')}</small></span></label>
          </div>
          <ol class="milestones small">${q.milestones.map((m, i) => `<li><span><b>${m.pct}%</b> ${esc(m.label)}${i === 0 && q.lines.some(l => !(l.type === 'package' && l.info.billing === 'once')) ? ' <small class="muted">+ other items in full</small>' : ''}</span><b>${inr(m.amount)}</b></li>`).join('')}</ol>` : ''}
          <h3>Payment method</h3>
          <div class="pay-methods">
            ${['UPI', 'Card', 'Net banking', 'Bank transfer'].map((m, i) => `<label class="pay-opt"><input type="radio" name="method" value="${m}" ${i ? '' : 'checked'}><span>${esc(m)}</span></label>`).join('')}
          </div>
          <p class="hint">${icon('shield')} Demo mode: payment is simulated. Connect a Razorpay key in Admin → Settings before going live.</p>
          <label class="check"><input type="checkbox" required> I agree to the <a href="#/terms">terms</a> and <a href="#/terms">refund policy</a>.</label>
          <button class="btn primary lg block" id="pay-btn">Pay ${inr(q.total)}</button>
        </form>
        ${summary(q, '')}
      </div>
    </section>`,
    bind: root => {
      const form = $('#pay', root);
      $$('input[name=plan]', form).forEach(r => r.addEventListener('change', () => {
        $('#pay-btn', form).textContent = `Pay ${inr(r.value === 'milestone' ? q.milestones[0].amount : q.total)}`;
      }));
      form.addEventListener('submit', e => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(form));
        Object.assign(user, { name: f.name, phone: f.phone, company: f.company, gstin: f.gstin, city: f.city });
        const btn = $('#pay-btn', form); btn.disabled = true; btn.textContent = 'Processing payment…';
        setTimeout(() => {
          const order = D.placeOrder(user, D.getCart(), coupon, f.method, f.plan || 'full');
          coupon = ''; D.setCart([]);
          go('/order/' + order.id);
        }, 900);
      });
    },
  };
}

// Payment schedule shared by the invoice, order confirmation and dashboards.
export function paymentSchedule(o) {
  const pays = D.orderPayments(o);
  if (pays.length < 2) return '';
  return `<ol class="milestones">${pays.map(p => `<li class="${p.paid ? 'paid' : ''}"><span>${p.paid ? icon('check') : '<i class="dotpend"></i>'}<b>${esc(p.label)}</b>${p.paid ? ` <small class="muted">paid ${date(p.paidAt)} · ${esc(p.method || '')}</small>` : ' <small class="muted">due</small>'}</span><b>${inr(p.amount)}</b></li>`).join('')}</ol>`;
}

export function orderDone({ id }) {
  const o = D.db().orders.find(o => o.id === id);
  if (!o) return notFound();
  return {
    title: 'Order confirmed',
    html: `<section class="shell section narrow center">
      <div class="success-box big">${icon('check')}<h1>Payment successful</h1>
      <p class="lead">Order <b>${esc(o.invoice)}</b> for <b>${inr(o.total)}</b> is confirmed${D.orderBalance(o) ? ` — you paid <b>${inr(D.orderPaid(o))}</b> today, and the balance of ${inr(D.orderBalance(o))} is due at the milestones below` : ''}. A project manager will contact you within 2 working hours.</p>
      ${D.orderBalance(o) ? `<div class="card left">${paymentSchedule(o)}</div>` : ''}
      <div class="row gap center"><a class="btn primary" href="#/account/orders">Track my order</a><a class="btn ghost" href="#/invoice/${o.id}">View invoice</a></div></div>
    </section>`,
  };
}

// ---------------- Content pages ----------------
// The four contact cards (call, WhatsApp, email, visit), shared by the
// contact page and the "Need something custom?" section on service pages.
export function contactCards(extra = '') {
  const cards = [
    ['phoneCall', 'Call us', BUSINESS.phone, 'tel:+918667209838', 'Speak to a specialist'],
    ['wa', 'WhatsApp', 'Chat with the team', BUSINESS.whatsapp, 'Fastest way to reach us'],
    ['mail', 'Email', BUSINESS.email, 'mailto:' + BUSINESS.email, 'Replies within 2 working hours'],
    ['pin', 'Visit us', 'Coimbatore office', BUSINESS.maps, BUSINESS.address],
  ];
  return `<div class="contact-cards ${extra}">${cards.map(([ic, t, main, href, sub]) => `<a class="card c-card" href="${href}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
        <span class="svc-ic">${icon(ic)}</span><small>${esc(t)}</small><b>${esc(main)}</b><span class="muted">${esc(sub)}</span></a>`).join('')}</div>`;
}

export function contact() {
  const steps = [
    ['Share your goal', 'Tell us what you want to achieve: more leads, a new website, a store or better rankings.'],
    ['We reply fast', 'A specialist replies within 2 working hours with questions or a first idea.'],
    ['Free, fixed-price proposal', 'You get a clear scope and price. No pressure and no obligation.'],
  ];
  return {
    title: 'Contact',
    description: 'Get in touch with Vintorex Digital in Coimbatore. Call, WhatsApp, email, or visit our office for a free digital audit and custom project quote.',
    keywords: 'contact vintorex, digital marketing office coimbatore, web design enquiry, coimbatore agency phone number, hire digital agency',
    image: 'https://vintorex.com/images/about-studio.jpg',
    imageAlt: 'Vintorex studio desk at dusk with monitors, a laptop, and a plant by the window',
    html: `<section class="contact-hero"><div class="shell section">
      <p class="eyebrow"><span></span>Contact Vintorex Digital</p>
      <h1>Let’s start a conversation.</h1>
      <p class="lead">Whether you need a website, an online store or more customers from Google and social media, tell us about your business and we’ll suggest the next step.</p>
      ${contactCards()}
    </div></section>

    <section class="shell section enquiry" id="enquiry">
      <div class="enq-copy">
        <h2>Tell us about your project</h2>
        <p class="lead">The more you share, the better our first reply. It takes about a minute.</p>
        <ol class="enq-steps">${steps.map(([t, d], i) => `<li><span>${i + 1}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join('')}</ol>
        <p class="hint">${icon('shield')}Please don’t send passwords, bank details or identity documents through this form. We’ll tell you how to share files securely when needed.</p>
        <div class="row gap wrap">${Object.entries(BUSINESS.social).map(([n, u]) => `<a class="chip" href="${u}" target="_blank" rel="noopener">${esc(n)}</a>`).join('')}</div>
      </div>
      ${leadForm({ source: 'Website form', title: 'Send an enquiry' })}
    </section>

    <section class="band" id="visit"><div class="shell section visit-grid">
      <div class="visit-copy">
        <p class="eyebrow"><span></span>Visit us · Coimbatore office</p>
        <h2>Come and meet the team</h2>
        <p class="lead">Prefer a face-to-face chat? Drop by our Coimbatore office. Call or WhatsApp ahead so someone is free to meet you.</p>
        <ul class="contact-list">
          <li>${icon('pin')}<span>${esc(BUSINESS.address)}</span></li>
          <li>${icon('phoneCall')}<a href="tel:+918667209838">${esc(BUSINESS.phone)}</a></li>
          <li>${icon('mail')}<a href="mailto:${BUSINESS.email}">${esc(BUSINESS.email)}</a></li>
        </ul>
        <div class="row gap wrap"><a class="btn primary" href="${BUSINESS.maps}" target="_blank" rel="noopener">${icon('pin')} Directions</a><a class="btn ghost" href="${BUSINESS.google}" target="_blank" rel="noopener">${icon('star')} Google profile &amp; reviews</a></div>
      </div>
      <div class="map-frame card"><iframe src="${BUSINESS.mapEmbed}" title="Map showing the Vintorex Digital Solutions office in Coimbatore" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
    </div></section>

    <section class="shell section"><div class="card cta-band"><div><h2>Not ready to talk yet?</h2><p class="muted">Browse transparent pricing, or see how we compare with other agencies.</p></div>
      <div class="row gap wrap"><a class="btn primary" href="#/pricing">See pricing</a><a class="btn ghost" href="#/compare">Competitor analysis</a></div></div></section>`,
    bind: bindLeadForms,
  };
}

export function about() {
  return {
    title: 'About Vintorex Digital',
    description: 'Learn about Vintorex Digital Solutions in Coimbatore, founded by Ranjith Kumar to deliver transparent, data-driven web development, SEO, ads and AI automation.',
    keywords: 'about vintorex digital solutions, ranjith kumar coimbatore, digital marketing team coimbatore, data driven marketing agency tamil nadu, web developers cheran ma nagar coimbatore',
    image: 'https://vintorex.com/images/about-studio.jpg',
    imageAlt: 'Vintorex studio desk at dusk with monitors, a laptop, and a plant by the window',
    html: `
    <section class="shell section about-hero">
      <div class="about-hero-grid">
        <div>
          <p class="eyebrow"><span></span>About Vintorex Digital Solutions</p>
          <h1>Turning data into dollars for ambitious businesses.</h1>
          <p class="lead">Vintorex Digital Solutions was founded in Coimbatore with a singular mission: eliminate murky agency contracts and deliver corporate-grade web development, SEO, ads, and AI automation with 100% transparent, published pricing.</p>
          <div class="facts">
            <span>${icon('pin')}Coimbatore, Tamil Nadu</span>
            <span>${icon('spark')}21+ Digital Services</span>
            <span>${icon('receipt')}18% GST Compliant</span>
            <span>${icon('shield')}100% In-House Team</span>
          </div>
        </div>
        <div class="about-studio-art card">
          <img class="about-studio-img" src="/images/about-studio.jpg" alt="Vintorex studio desk at dusk with two monitors, a laptop, coffee, and a plant by the window in Coimbatore" width="1600" height="900" loading="lazy" decoding="async">
        </div>
      </div>
    </section>

    <!-- 4 Pillars Section -->
    <section class="shell section">
      <div class="sec-head">
        <div>
          <h2>Our 4 core operating principles</h2>
          <p class="muted">Why hundreds of businesses choose Vintorex over metro agencies.</p>
        </div>
      </div>
      <div class="cards4">
        <div class="card pillar-card">
          <span class="svc-ic">${icon('chart')}</span>
          <h3>Data-Driven Strategy</h3>
          <p class="muted">Every campaign and website redesign starts with numbers. We track traffic, leads, bounce rates, and revenue in your live client dashboard.</p>
        </div>
        <div class="card pillar-card">
          <span class="svc-ic">${icon('tag')}</span>
          <h3>100% Published Prices</h3>
          <p class="muted">No inflated quotes based on your company size. Every package, tier, and add-on has published prices set 15–40% below metro rates.</p>
        </div>
        <div class="card pillar-card">
          <span class="svc-ic">${icon('zap')}</span>
          <h3>2-Hour Turnaround</h3>
          <p class="muted">You talk directly to the engineers and marketers managing your account. Inquiries and urgent updates are handled in 2 working hours.</p>
        </div>
        <div class="card pillar-card">
          <span class="svc-ic">${icon('shield')}</span>
          <h3>Milestone Payments</h3>
          <p class="muted">Pay 40% advance to start, 40% at mid-project milestone, and 20% on final handover for one-time projects over ₹10,000.</p>
        </div>
      </div>
    </section>

    <!-- Growth Milestones / Story -->
    <section class="band">
      <div class="shell section">
        <div class="sec-head"><h2>The Vintorex Journey</h2><p class="muted">From a local digital agency to an end-to-end full-funnel digital powerhouse.</p></div>
        <div class="timeline-cards">
          <div class="card tl-card">
            <span class="tl-year">2024</span>
            <h4>Founded in Coimbatore</h4>
            <p class="muted">Started at Bankers Colony, Cheran Ma Nagar to provide transparent digital marketing and web solutions for Tamil Nadu manufacturers and retailers.</p>
          </div>
          <div class="card tl-card">
            <span class="tl-year">2025</span>
            <h4>Full-Funnel Expansion</h4>
            <p class="muted">Scaled to 21 integrated services across web design, e-commerce, Google Ads, Meta campaigns, SEO, and 3D industrial product engineering.</p>
          </div>
          <div class="card tl-card">
            <span class="tl-year">2026</span>
            <h4>AI &amp; Automation Era</h4>
            <p class="muted">Introduced customized AI chatbots, voice calling agents, automated CRM pipelines, and generative AI search optimization with full human oversight.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Leadership & Team -->
    <section class="shell section">
      <div class="sec-head"><h2>Leadership</h2></div>
      <div class="card leader-spotlight">
        <div class="leader-avatar">
          <img class="leader-portrait-img" src="/images/ranjith-kumar.svg" alt="Ranjith Kumar, Proprietor and Lead Digital Marketing Architect at Vintorex Digital Solutions Coimbatore" width="130" height="130" loading="lazy" decoding="async">
        </div>
        <div class="leader-info">
          <h3>Ranjith Kumar</h3>
          <p class="leader-role">Proprietor &amp; Lead Digital Marketing Architect</p>
          <p class="lead">“Our mission is simple: deliver high-impact websites and measurable marketing without the bureaucracy or outrageous price tags of big-city agencies. We measure our success solely by how many qualified leads and sales our clients generate.”</p>
          <div class="leader-tags">
            <span class="badge blue">Web Architecture</span>
            <span class="badge green">Performance Marketing</span>
            <span class="badge violet">AI Automation</span>
            <span class="badge amber">Conversion Rate Optimization</span>
          </div>
          <div class="leader-contact">
            <a class="btn sm primary" href="tel:+918667209838">${icon('phoneCall')} Call directly</a>
            <a class="btn sm ghost" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">${icon('wa')} WhatsApp</a>
            <a class="btn sm ghost" href="mailto:${BUSINESS.email}">${icon('mail')} Email</a>
          </div>
        </div>
      </div>
    </section>
    `,
  };
}

export function terms() {
  return {
    title: 'Policies',
    description: 'Read Vintorex Digital Solutions service policies, project refund terms, digital download delivery, and privacy commitments.',
    keywords: 'vintorex terms, refund policy, privacy policy, client agreement, agency terms of service',
    image: 'https://vintorex.com/images/about-studio.jpg',
    imageAlt: 'Vintorex studio desk at dusk with monitors, a laptop, and a plant by the window',
    html: `<section class="shell section narrow prose">
      <h1>Terms, refunds & privacy</h1>
      <h3>Services</h3><p>Project scope is defined by the package purchased. Additional work is quoted separately. Monthly retainers renew automatically until cancelled from your dashboard.</p>
      <h3>Refunds</h3><p>One-time projects can be refunded in full before work starts, and 50% before the first design is delivered. Monthly plans are non-refundable for the current period. Digital downloads are non-refundable once downloaded.</p>
      <h3>Delivery</h3><p>Digital downloads are delivered instantly in your dashboard. Service timelines are shown on each package.</p>
      <h3>Privacy</h3><p>We use your details only to deliver services and contact you about your enquiry. We never sell your data. Our contact page shows an embedded Google Map, which is provided by Google under its own privacy policy.</p>
    </section>`,
  };
}

// ---------------- Auth ----------------
export function login(params, query) {
  return {
    title: 'Sign in',
    html: `<section class="shell section auth">
      <form class="card" id="login">
        <h1>Welcome back</h1>
        <p class="muted">Sign in to your dashboard.</p>
        ${field('Email', 'email', { type: 'email', required: true, attrs: 'autocomplete="username"' })}
        ${field('Password', 'password', { type: 'password', required: true, attrs: 'autocomplete="current-password"' })}
        <p class="err" hidden></p>
        <button class="btn primary block lg">Sign in</button>
        <p class="center muted">New here? <a href="#/register${query.get('next') ? '?next=' + esc(query.get('next')) : ''}">Create an account</a></p>
        <div class="demo-box">
          <b>Demo accounts</b>
          <button type="button" class="chip" data-demo="admin@vintorex.com|admin123">Admin · admin@vintorex.com / admin123</button>
          <button type="button" class="chip" data-demo="demo@vintorex.com|demo123">Customer · demo@vintorex.com / demo123</button>
        </div>
      </form>
    </section>`,
    bind: root => {
      const f = $('#login', root);
      $$('[data-demo]', root).forEach(b => b.addEventListener('click', () => { const [e, p] = b.dataset.demo.split('|'); f.email.value = e; f.password.value = p; }));
      f.addEventListener('submit', async e => {
        e.preventDefault();
        try {
          const u = await D.login(f.email.value, f.password.value);
          toast(`Welcome, ${u.name.split(' ')[0]}`);
          go(query.get('next') ? '/' + query.get('next') : u.role === 'admin' ? '/admin' : '/account');
        } catch (err) { const p = $('.err', f); p.hidden = false; p.textContent = err.message; }
      });
    },
  };
}

export function register(params, query) {
  return {
    title: 'Create account',
    html: `<section class="shell section auth">
      <form class="card" id="reg">
        <h1>Create your account</h1>
        <p class="muted">Track projects, download invoices and manage your plan.</p>
        ${field('Full name', 'name', { required: true, attrs: 'autocomplete="name"' })}
        ${field('Email', 'email', { type: 'email', required: true, attrs: 'autocomplete="email"' })}
        ${field('Phone', 'phone', { type: 'tel', required: true, attrs: 'autocomplete="tel"' })}
        ${field('Business name', 'company', { attrs: 'autocomplete="organization"' })}
        ${field('Password', 'password', { type: 'password', required: true, attrs: 'minlength="6" autocomplete="new-password"' })}
        <p class="err" hidden></p>
        <button class="btn primary block lg">Create account</button>
        <p class="center muted">Already have an account? <a href="#/login">Sign in</a></p>
      </form>
    </section>`,
    bind: root => {
      const f = $('#reg', root);
      f.addEventListener('submit', async e => {
        e.preventDefault();
        try {
          await D.register(Object.fromEntries(new FormData(f)));
          toast('Account created');
          go(query.get('next') ? '/' + query.get('next') : '/account');
        } catch (err) { const p = $('.err', f); p.hidden = false; p.textContent = err.message; }
      });
    },
  };
}

export function notFound() {
  return { title: 'Not found', html: `<section class="shell section narrow center"><h1>Page not found</h1><p><a class="btn primary" href="#/">Go home</a></p></section>` };
}

// Printable GST invoice, shared by customers and admins.
export function invoice({ id }) {
  const user = D.currentUser();
  const o = D.db().orders.find(o => o.id === id);
  if (!user) return { redirect: '/login' };
  if (!o || (user.role !== 'admin' && o.customerId !== user.id)) return notFound();
  const c = D.db().users.find(u => u.id === o.customerId) || {};
  const s = D.db().settings;
  return {
    title: 'Invoice ' + o.invoice, bare: true,
    html: `<section class="shell section invoice-page">
      <div class="row between noprint"><a class="link" href="#/${user.role === 'admin' ? 'admin/orders' : 'account/orders'}">← Back</a><button class="btn primary" onclick="print()">Print / Save PDF</button></div>
      <article class="card invoice">
        <header class="row between"><div><div class="logo">${logoMark()}<span>${esc(s.businessName)}</span></div><p class="muted">${esc(s.address)}<br>${esc(s.phone)} · ${esc(s.email)}<br>GSTIN ${esc(s.gstin)}</p></div>
        <div class="right"><h2>Tax invoice</h2><p><b>${esc(o.invoice)}</b><br>${date(o.createdAt)}<br>${o.paid ? '<span class="badge green">Paid</span>' : `<span class="badge amber">Part-paid · ${inr(D.orderBalance(o))} due</span>`} via ${esc(o.method)}</p></div></header>
        <div class="bill-to"><small class="muted">Bill to</small><p><b>${esc(c.name)}</b>${c.company ? '<br>' + esc(c.company) : ''}<br>${esc(c.email)}<br>${esc(c.phone || '')}${c.gstin ? '<br>GSTIN ' + esc(c.gstin) : ''}</p></div>
        <table class="table"><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th class="right">Amount</th></tr></thead>
        <tbody>${o.items.map(i => `<tr><td>${esc(i.title)}</td><td>${i.qty}</td><td>${inr(i.unit)}${per(i.billing)}</td><td class="right">${inr(i.total)}</td></tr>`).join('')}</tbody></table>
        <dl class="inv-tot">
          <div><dt>Subtotal</dt><dd>${inr(o.subtotal)}</dd></div>
          ${o.discount ? `<div><dt>Discount${o.coupon ? ' (' + esc(o.coupon) + ')' : ''}</dt><dd>−${inr(o.discount)}</dd></div>` : ''}
          <div><dt>CGST (${s.gst / 2}%)</dt><dd>${inr(o.gst / 2)}</dd></div>
          <div><dt>SGST (${s.gst / 2}%)</dt><dd>${inr(o.gst / 2)}</dd></div>
          <div class="total"><dt>Total</dt><dd>${inr(o.total)}</dd></div>
          ${D.orderBalance(o) ? `<div><dt>Paid to date</dt><dd>${inr(D.orderPaid(o))}</dd></div><div class="total"><dt>Balance due</dt><dd>${inr(D.orderBalance(o))}</dd></div>` : ''}
        </dl>
        ${D.orderPayments(o).length > 1 ? `<h4>Payment schedule</h4>${paymentSchedule(o)}` : ''}
        <p class="fine">Thank you for your business. This is a computer-generated invoice.</p>
      </article>
    </section>`,
  };
}


let rerender = () => {};
export const setRerender = fn => { rerender = fn; };
export { LEAD_SOURCES };
