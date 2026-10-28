// Public storefront: home, services, pricing, shop, cart, checkout, contact, auth.
import { BUSINESS, CATEGORIES, ANNUAL_MONTHS_PAID, SOURCES, LEAD_SOURCES, COMPETITOR_SOURCES, MILESTONE_MIN } from './data.js';
import * as D from './db.js';
import { esc, icon, toast, field, per, date, empty, $, $$ } from './ui.js';
import { serviceGuides, featuredPosts, postCard } from './blogpages.js';
import { logoMark } from './chrome.js';
import { serviceArt, serviceCardArt } from './service-art.js';
import { WORK_PROJECTS, renderWorkCard } from './work-art.js';
export { logoMark };

const inr = D.inr;
const go = path => { location.hash = '#' + path; };
const fromPrice = s => Math.min(...s.tiers.map(t => t.price));

function art(p, cls = '') {
  const h = p.hue;
  const id = 'p-' + p.id;
  let scene = '';
  if (p.kind === 'Art print') {
    scene = `
      <rect x="14" y="10" width="172" height="120" rx="8" fill="#1e1832" stroke="#4a3e72" stroke-width="2"/>
      <rect x="24" y="18" width="152" height="104" rx="4" fill="#fafafa"/>
      <rect x="32" y="24" width="136" height="92" rx="3" fill="url(#g${id})"/>
      <circle cx="${60 + (h % 50)}" cy="${45 + (h % 30)}" r="${16 + (h % 10)}" fill="#fff" fill-opacity="0.8"/>
      <circle cx="${130 - (h % 40)}" cy="${65 + (h % 20)}" r="${24 + (h % 12)}" fill="hsl(${(h + 120) % 360} 90% 70% / 0.5)"/>
      <path d="M32 96 Q 70 ${65 + (h % 25)} 100 85 T 168 82 V116 H32 Z" fill="hsl(${(h + 40) % 360} 70% 25% / 0.7)"/>
      <path d="M32 104 Q 90 85 130 98 T 168 95 V116 H32 Z" fill="hsl(${h} 60% 15% / 0.85)"/>
      <line x1="85" y1="10" x2="100" y2="2" stroke="#9ca3af" stroke-width="1.5"/>
      <line x1="115" y1="10" x2="100" y2="2" stroke="#9ca3af" stroke-width="1.5"/>
    `;
  } else if (p.kind === 'Template') {
    scene = `
      <rect width="200" height="140" fill="url(#g${id})"/>
      <rect x="20" y="20" width="70" height="95" rx="8" fill="#ffffff" fill-opacity="0.95"/>
      <circle cx="35" cy="35" r="7" fill="hsl(${h} 80% 50%)"/>
      <rect x="46" y="32" width="36" height="5" rx="2.5" fill="#374151"/>
      <rect x="26" y="48" width="58" height="42" rx="4" fill="hsl(${h} 75% 65% / 0.3)"/>
      <circle cx="55" cy="69" r="12" fill="hsl(${h} 80% 55%)"/>
      <rect x="105" y="14" width="75" height="112" rx="14" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <rect x="110" y="22" width="65" height="96" rx="8" fill="#1e293b"/>
      <rect x="115" y="28" width="55" height="24" rx="4" fill="hsl(${(h + 50) % 360} 80% 60%)"/>
      <rect x="115" y="58" width="55" height="18" rx="4" fill="#334155"/>
      <rect x="115" y="82" width="25" height="18" rx="4" fill="#334155"/>
      <rect x="145" y="82" width="25" height="18" rx="4" fill="#334155"/>
      <circle cx="142" cy="18" r="2" fill="#64748b"/>
    `;
  } else {
    scene = `
      <rect width="200" height="140" fill="url(#g${id})"/>
      <rect x="35" y="16" width="130" height="108" rx="8" fill="#ffffff" stroke="#e5e7eb" stroke-width="1.5"/>
      <rect x="35" y="16" width="12" height="108" rx="4" fill="#000000" fill-opacity="0.12"/>
      <rect x="56" y="30" width="85" height="10" rx="5" fill="hsl(${h} 80% 45%)"/>
      <rect x="56" y="46" width="60" height="6" rx="3" fill="#6b7280"/>
      <circle cx="62" cy="66" r="5" fill="#10b981"/>
      <path d="M60 66 L62 68 L65 64" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="72" y="63" width="75" height="6" rx="3" fill="#374151"/>
      <circle cx="62" cy="80" r="5" fill="#10b981"/>
      <path d="M60 80 L62 82 L65 78" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="72" y="77" width="65" height="6" rx="3" fill="#374151"/>
      <circle cx="62" cy="94" r="5" fill="#10b981"/>
      <path d="M60 94 L62 96 L65 92" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="72" y="91" width="80" height="6" rx="3" fill="#374151"/>
      <path d="M142 16 L142 42 L148 37 L154 42 L154 16 Z" fill="hsl(${h} 85% 55%)"/>
    `;
  }

  return `<div class="art ${cls}" style="--h:${h}">
    <svg viewBox="0 0 200 140" role="img" aria-label="${esc(p.name)}" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${h} 80% 62%)"/>
          <stop offset="100%" stop-color="hsl(${(h + 55) % 360} 70% 32%)"/>
        </linearGradient>
      </defs>
      ${scene}
    </svg>
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
    title: 'Digital marketing & web development in Coimbatore',
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
          <div class="hero-card card">
            <div class="hero-float float-top"><span class="dot-live"></span><b>Google &amp; Meta Partner</b></div>
            <div class="hero-float float-bottom"><span class="h-spark">${icon('spark')}</span><b>3.4× Average Client ROI</b></div>
            <div class="hc-head"><span class="dot-live"></span>Client dashboard preview</div>
            <div class="hc-metrics">
              <div><small>Organic traffic</small><b>+182%</b></div>
              <div><small>Leads this month</small><b>146</b></div>
              <div><small>Cost per lead</small><b>₹84</b></div>
            </div>
            <div class="hc-chart">${[22, 30, 28, 41, 38, 52, 61, 58, 72, 80, 77, 92].map(v => `<i style="height:${v}%" title="Growth +${v}%"></i>`).join('')}</div>
            <div class="hc-row"><span>${icon('check')}Website Growth — delivered</span><span>${icon('repeat')}SEO — 14 keywords on page 1</span></div>
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
            <div class="audit-ring">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#eef0f4" stroke-width="8"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="8" stroke-dasharray="251" stroke-dashoffset="25" stroke-linecap="round"/>
                <text x="50" y="47" text-anchor="middle" font-size="20" font-weight="800" fill="var(--ink)">98</text>
                <text x="50" y="62" text-anchor="middle" font-size="8.5" font-weight="700" fill="var(--green)">OPTIMIZED</text>
              </svg>
            </div>
            <div class="audit-checklist">
              <div><small>Core Web Vitals</small><b>0.8s LCP</b><span class="good">Passed</span></div>
              <div><small>SEO Visibility</small><b>Top 3 Rank</b><span class="good">High Intent</span></div>
              <div><small>Mobile Usability</small><b>100 / 100</b><span class="good">Responsive</span></div>
              <div><small>Security & Trust</small><b>SSL + GST</b><span class="good">Verified</span></div>
            </div>
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
  return {
    title: 'Services',
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
  return {
    title: s.name,
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
export function shop() {
  const c = D.catalog();
  return {
    title: 'Shop',
    html: `<section class="shell section">
      <div class="page-head"><h1>Shop</h1><p class="lead">Digital downloads, templates and quick add-on services — instant checkout.</p></div>
      <h2 class="h3">Digital downloads</h2>
      <div class="cards4">${c.products.filter(p => p.active !== false).map(p => `
        <article class="card product">
          ${art(p)}
          <div class="product-body"><h4>${esc(p.name)}</h4>
          <div class="row between"><span><b>${inr(p.price)}</b> <s>${inr(p.mrp)}</s></span><span class="badge green">${Math.round((1 - p.price / p.mrp) * 100)}% off</span></div>
          <button class="btn sm primary block" data-add="product|${p.id}">Add to cart</button></div>
        </article>`).join('')}
      </div>
      <h2 class="h3" id="addons">Quick services & add-ons</h2>
      ${addonBrowser(c.addons)}
    </section>`,
    bind: root => { bindCartButtons(root); bindAddonBrowser(root); },
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
          <svg viewBox="0 0 460 300" role="img" aria-label="Vintorex Digital creative studio in Coimbatore" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="ab-bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#24194e"/>
                <stop offset="100%" stop-color="#0e0a22"/>
              </linearGradient>
            </defs>
            <rect width="460" height="300" fill="url(#ab-bg)"/>
            <circle cx="380" cy="60" r="120" fill="#6d4dff" fill-opacity="0.15"/>
            <circle cx="80" cy="240" r="100" fill="#ff6b3d" fill-opacity="0.12"/>
            
            <!-- Desk Scene -->
            <rect x="50" y="230" width="360" height="12" rx="6" fill="#2d2558"/>
            <rect x="80" y="242" width="16" height="58" rx="4" fill="#1c163b"/>
            <rect x="364" y="242" width="16" height="58" rx="4" fill="#1c163b"/>
            
            <!-- Main Display -->
            <rect x="110" y="70" width="240" height="136" rx="12" fill="#120e29" stroke="#3d336e" stroke-width="2"/>
            <rect x="216" y="206" width="28" height="24" fill="#2a2254"/>
            <rect x="194" y="228" width="72" height="6" rx="3" fill="#3d336e"/>
            
            <!-- Code on Left Screen -->
            <rect x="122" y="82" width="100" height="112" rx="6" fill="#1a143b"/>
            <rect x="132" y="94" width="60" height="7" rx="3.5" fill="#4b2bd6"/>
            <rect x="132" y="108" width="76" height="5" rx="2.5" fill="#10b981"/>
            <rect x="132" y="120" width="54" height="5" rx="2.5" fill="#f59e0b"/>
            <rect x="132" y="132" width="70" height="5" rx="2.5" fill="#a78bfa"/>
            <rect x="132" y="144" width="45" height="5" rx="2.5" fill="#38bdf8"/>
            <rect x="132" y="156" width="65" height="5" rx="2.5" fill="#ec4899"/>
            
            <!-- Analytics Chart on Right Screen -->
            <rect x="232" y="82" width="106" height="112" rx="6" fill="#1e1742"/>
            <text x="242" y="100" font-size="9" font-weight="bold" fill="#ffffff" font-family="sans-serif">ROI +280%</text>
            <path d="M242 165 L260 145 L278 152 L298 120 L322 110" fill="none" stroke="#ff6b3d" stroke-width="2.5" stroke-linecap="round"/>
            <rect x="242" y="174" width="12" height="12" rx="2" fill="#4b2bd6"/>
            <rect x="260" y="170" width="12" height="16" rx="2" fill="#6d4dff"/>
            <rect x="278" y="162" width="12" height="24" rx="2" fill="#a78bfa"/>
            <rect x="298" y="150" width="12" height="36" rx="2" fill="#ff6b3d"/>
            <rect x="318" y="140" width="12" height="46" rx="2" fill="#10b981"/>
            
            <!-- Laptop on Left -->
            <rect x="66" y="160" width="76" height="52" rx="6" fill="#1b153d" stroke="#3d336e" stroke-width="1.5"/>
            <rect x="72" y="166" width="64" height="40" rx="3" fill="#241b52"/>
            <path d="M54 212 L154 212 L146 218 L62 218 Z" fill="#3d336e"/>
            
            <!-- Coffee Mug on Right -->
            <rect x="368" y="208" width="18" height="22" rx="4" fill="#fbbf24"/>
            <path d="M386 213 C391 213 391 223 386 223" fill="none" stroke="#fbbf24" stroke-width="2"/>
            
            <!-- Floating Badge: Cheran Ma Nagar HQ -->
            <g transform="translate(130, 246)">
              <rect width="200" height="34" rx="17" fill="#0c0919" stroke="#4b2bd6" stroke-width="1.5"/>
              <circle cx="18" cy="17" r="8" fill="#4b2bd6"/>
              <text x="34" y="21" font-size="9.5" font-weight="bold" fill="#ffffff" font-family="sans-serif">Coimbatore Studio &amp; Labs</text>
            </g>
          </svg>
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
        <div class="leader-avatar">RK</div>
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
