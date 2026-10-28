// Public storefront: home, services, pricing, shop, cart, checkout, contact, auth.
import { BUSINESS, CATEGORIES, ANNUAL_MONTHS_PAID, SOURCES, LEAD_SOURCES, COMPETITOR_SOURCES, MILESTONE_MIN } from './data.js';
import * as D from './db.js';
import { esc, icon, toast, field, per, date, empty, $, $$ } from './ui.js';
import { serviceGuides, featuredPosts, postCard } from './blogpages.js';
import { logoMark } from './chrome.js';
export { logoMark };

const inr = D.inr;
const go = path => { location.hash = '#' + path; };
const fromPrice = s => Math.min(...s.tiers.map(t => t.price));

function art(p, cls = '') {
  const h = p.hue;
  return `<div class="art ${cls}" style="--h:${h}"><svg viewBox="0 0 200 140" aria-hidden="true">
    <defs><linearGradient id="g${p.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 80% 62%)"/><stop offset="1" stop-color="hsl(${(h + 60) % 360} 70% 30%)"/></linearGradient></defs>
    <rect width="200" height="140" fill="url(#g${p.id})"/>
    <circle cx="${40 + h % 120}" cy="${30 + h % 40}" r="${18 + h % 14}" fill="hsl(${(h + 180) % 360} 90% 80% / .55)"/>
    <path d="M0 ${110 - h % 30} Q 60 ${70 + h % 20} 110 ${100 - h % 25} T 200 ${90 + h % 20} V140 H0Z" fill="hsl(${(h + 30) % 360} 60% 20% / .55)"/>
    <path d="M0 125 Q 80 100 140 120 T 200 115 V140 H0Z" fill="hsl(${h} 50% 12% / .6)"/>
  </svg><span>${esc(p.kind)}</span></div>`;
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
          <div class="row gap">
            <a class="btn primary lg" href="#/services">Explore services ${icon('arrow')}</a>
            <a class="btn ghost lg" href="#/pricing">See pricing</a>
          </div>
          <ul class="ticks"><li>${icon('check')}Fixed, published prices</li><li>${icon('check')}GST invoices</li><li>${icon('check')}Live project dashboard</li></ul>
        </div>
        <div class="hero-card card">
          <div class="hc-head"><span class="dot-live"></span>Client dashboard preview</div>
          <div class="hc-metrics">
            <div><small>Organic traffic</small><b>+182%</b></div>
            <div><small>Leads this month</small><b>146</b></div>
            <div><small>Cost per lead</small><b>₹84</b></div>
          </div>
          <div class="hc-chart">${[22, 30, 28, 41, 38, 52, 61, 58, 72, 80, 77, 92].map(v => `<i style="height:${v}%"></i>`).join('')}</div>
          <div class="hc-row"><span>${icon('check')}Website Growth — delivered</span><span>${icon('repeat')}SEO — 14 keywords on page 1</span></div>
        </div>
      </div>
    </section>

    <section class="shell stats">
      <div><b>${c.services.length}+</b><span>services under one roof</span></div>
      <div><b>15–40%</b><span>below metro agency pricing</span></div>
      <div><b>2 hrs</b><span>average reply time</span></div>
      <div><b>18% GST</b><span>compliant invoicing</span></div>
    </section>

    <section class="shell section">
      <div class="sec-head"><h2>Everything you need to grow online</h2><a href="#/services" class="link">All ${c.services.length} services ${icon('arrow')}</a></div>
      <div class="cards3">${featured.map(serviceCard).join('')}</div>
    </section>

    <section class="shell section">
      <div class="sec-head"><div><h2>AI & Automation for your business</h2><p class="muted">Chatbots, voice agents, workflows, content and AI search, with human review at every step.</p></div><a href="#/services?cat=ai" class="link">All AI services ${icon('arrow')}</a></div>
      <div class="cards3">${c.services.filter(s => s.cat === 'ai').slice(0, 6).map(serviceCard).join('')}</div>
    </section>

    <section class="band">
      <div class="shell section">
        <div class="sec-head"><h2>Memberships that pay for themselves</h2><a href="#/pricing" class="link">Compare plans ${icon('arrow')}</a></div>
        <div class="cards3">${c.plans.map(p => planCard(p, 'month')).join('')}</div>
      </div>
    </section>

    <section class="shell section">
      <div class="sec-head"><h2>Recent work</h2></div>
      <div class="cards2">
        <article class="card work"><div class="work-art" style="--h:30"></div><div><small>Web Design · E-commerce</small><h3>The World of Idols</h3><p>Online idol store with Razorpay, WhatsApp order alerts and SEO. 3× online orders in 4 months.</p></div></article>
        <article class="card work"><div class="work-art" style="--h:200"></div><div><small>Industrial Design · Web Design</small><h3>Electrical & Mechanical Solutions</h3><p>Product catalogue, 3D renders and a lead-generating website for an industrial supplier.</p></div></article>
      </div>
    </section>

    <section class="band">
      <div class="shell section">
        <div class="sec-head"><h2>What clients say</h2></div>
        <div class="cards3">
          ${[['Siva Prakash', 'Prakash Textiles', 'The dashboard shows exactly what is being done every month. Leads from Google doubled.'], ['Kailash', 'The World of Idols', 'Our store went live in under a month and sales have grown every month since.'], ['Yamuna', 'E&M Solutions', 'The catalogue and renders made our product pitch far more professional.']].map(([n, c, q]) => `<figure class="card quote"><div class="stars">${icon('star')}${icon('star')}${icon('star')}${icon('star')}${icon('star')}</div><blockquote>“${esc(q)}”</blockquote><figcaption><b>${esc(n)}</b> · ${esc(c)}</figcaption></figure>`).join('')}
        </div>
      </div>
    </section>

    <section class="shell section">
      <div class="sec-head"><h2>Guides from our blog</h2><a href="/blog/" class="link">All guides ${icon('arrow')}</a></div>
      <div class="cards3">${featuredPosts().map(postCard).join('')}</div>
    </section>

    <section class="shell section split" id="audit">
      <div>
        <p class="eyebrow"><span></span>Free website & SEO audit</p>
        <h2>Find out what’s holding your business back online</h2>
        <p class="lead">Get a free 15-point audit of your website speed, Google ranking, social presence and ad setup — with a fixed-price action plan.</p>
        <ul class="ticks col"><li>${icon('check')}Speed & Core Web Vitals</li><li>${icon('check')}Local SEO & Google Business Profile</li><li>${icon('check')}Competitor keyword gaps</li><li>${icon('check')}Social & ads quick wins</li></ul>
      </div>
      ${leadForm({ source: 'Free audit', compact: true, title: 'Request my free audit' })}
    </section>`,
    bind: root => { bindLeadForms(root); bindCartButtons(root); bindCycle(root); },
  };
}

function serviceCard(s) {
  const from = fromPrice(s);
  return `<a class="card svc" href="#/services/${s.id}">
    <span class="svc-ic">${icon(s.icon)}</span>
    <h3>${esc(s.name)}</h3>
    <p>${esc(s.summary)}</p>
    <div class="svc-foot"><span>From <b>${inr(from)}</b>${per(s.billing)}</span><small>Market ${inr(s.market[0])}+</small></div>
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
      <div class="cards3">${list.map(serviceCard).join('')}</div>
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
      <p><a class="btn ghost" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">${icon('wa')} Chat on WhatsApp</a></p></div>
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
export function contact() {
  const cards = [
    ['phoneCall', 'Call us', BUSINESS.phone, 'tel:+918667209838', 'Speak to a specialist'],
    ['wa', 'WhatsApp', 'Chat with the team', BUSINESS.whatsapp, 'Fastest way to reach us'],
    ['mail', 'Email', BUSINESS.email, 'mailto:' + BUSINESS.email, 'Replies within 2 working hours'],
    ['pin', 'Visit us', 'Coimbatore office', BUSINESS.maps, BUSINESS.address],
  ];
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
      <div class="contact-cards">${cards.map(([ic, t, main, href, sub]) => `<a class="card c-card" href="${href}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
        <span class="svc-ic">${icon(ic)}</span><small>${esc(t)}</small><b>${esc(main)}</b><span class="muted">${esc(sub)}</span></a>`).join('')}</div>
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
    title: 'About',
    html: `<section class="shell section narrow">
      <h1>About Vintorex Digital</h1>
      <p class="lead">Vintorex is a digital marketing company in Coimbatore with a passion for turning data into dollars. We enhance your website, SEO and social media — and show you the numbers behind every rupee.</p>
      <div class="cards2">
        <div class="card"><h3>Our approach</h3><p>SEO, social media management, PPC and content creation planned together, measured together and reported in one dashboard.</p></div>
        <div class="card"><h3>Why clients stay</h3><p>Published prices, no lock-in contracts, GST invoices and a team that answers the phone.</p></div>
      </div>
      <h2>Leadership</h2>
      <div class="card person-card"><span class="avatar lg">RK</span><div><h3>Ranjith Kumar</h3><p class="muted">Proprietor · Digital Marketing Expert</p></div></div>
    </section>`,
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
