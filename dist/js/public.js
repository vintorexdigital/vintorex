// Public storefront: home, services, pricing, shop, cart, checkout, contact, auth.
import { BUSINESS, CATEGORIES, ANNUAL_MONTHS_PAID, SOURCES, LEAD_SOURCES } from './data.js';
import * as D from './db.js';
import { esc, icon, toast, field, per, date, empty, $, $$ } from './ui.js';

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
  return `<article class="card plan ${p.popular ? 'pop' : ''}">
    ${p.popular ? '<span class="ribbon">Most popular</span>' : ''}
    <h3>${esc(p.name)}</h3><p class="muted">${esc(p.tagline)}</p>
    <div class="price">${p.price ? `${inr(monthly)}<small>/mo</small>` : 'Free'}</div>
    ${p.price && annual ? `<p class="fine">Billed ${inr(p.price * ANNUAL_MONTHS_PAID)} yearly · 2 months free</p>` : p.value ? `<p class="fine">Worth ${inr(p.value)}/mo if bought separately</p>` : '<p class="fine">No card required</p>'}
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

export function serviceDetail({ id }) {
  const s = D.service(id);
  if (!s) return notFound();
  const addons = D.catalog().addons.slice(0, 6);
  return {
    title: s.name,
    html: `<section class="shell section">
      <a href="#/services" class="link back">← All services</a>
      <div class="detail-head">
        <span class="svc-ic lg">${icon(s.icon)}</span>
        <div><h1>${esc(s.name)}</h1><p class="lead">${esc(s.summary)}</p>
        <p class="muted">${icon('repeat')} ${s.billing === 'month' ? 'Monthly retainer · cancel anytime' : 'One-time project'} · Delivery: ${esc(s.delivery)}${s.note ? ' · ' + esc(s.note) : ''}</p></div>
      </div>
      ${marketBar(s, fromPrice(s))}
      <div class="cards3 tiers">${s.tiers.map(t => `
        <article class="card plan ${t.popular ? 'pop' : ''}">
          ${t.popular ? '<span class="ribbon">Best value</span>' : ''}
          <h3>${esc(t.name)}</h3>
          <div class="price">${inr(t.price)}<small>${per(s.billing) || ' one-time'}</small></div>
          <p class="fine">+ ${D.db().settings.gst}% GST · Members save up to 15%${s.billing === 'month' ? ' on one-time work' : ''}</p>
          <ul class="ticks col">${t.features.map(f => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>
          <button class="btn ${t.popular ? 'primary' : 'ghost'} block" data-add="package|${s.id}|${esc(t.name)}">Add to cart</button>
        </article>`).join('')}
      </div>
    </section>
    <section class="band"><div class="shell section">
      <div class="sec-head"><h2>Popular add-ons</h2><a class="link" href="#/shop#addons">All add-ons ${icon('arrow')}</a></div>
      <div class="cards3">${addons.map(addonCard).join('')}</div>
    </div></section>
    <section class="shell section split">
      <div><h2>Need something custom?</h2><p class="lead">Tell us what you need and get a tailored quote for ${esc(s.name.toLowerCase())} within one working day.</p>
      <p><a class="btn ghost" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">${icon('wa')} Chat on WhatsApp</a></p></div>
      ${leadForm({ source: 'Service quote', service: s.id, title: 'Request a custom quote' })}
    </section>`,
    bind: root => { bindCartButtons(root); bindLeadForms(root); },
  };
}

const addonCard = a => `<article class="card addon"><div><h4>${esc(a.name)}</h4><p>${esc(a.desc)}</p></div><div class="addon-foot"><b>${inr(a.price)}<small>${per(a.billing) || ' once'}</small></b><button class="btn sm ghost" data-add="addon|${a.id}">${icon('plus')} Add</button></div></article>`;

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
      <div class="sec-head"><div><h2>Service price list vs market</h2><p class="muted">Starting prices compared with typical India 2026 agency ranges. All prices exclude GST.</p></div></div>
      <div class="table-wrap card"><table class="table">
        <thead><tr><th>Service</th><th>Packages</th><th>Vintorex from</th><th>Market range</th><th>You save*</th><th></th></tr></thead>
        <tbody>${c.services.map(s => {
          const from = fromPrice(s);
          const mid = Math.round((s.market[0] + s.market[1]) / 2);
          const growth = s.tiers.find(t => t.popular) || s.tiers[1];
          const save = Math.max(0, Math.round((1 - growth.price / mid) * 100));
          return `<tr><td><b>${esc(s.name)}</b></td><td class="muted">${s.tiers.map(t => esc(t.name)).join(' · ')}</td><td><b>${inr(from)}</b>${per(s.billing)}</td><td>${inr(s.market[0])} – ${inr(s.market[1])}${per(s.billing)}</td><td>${save ? `<span class="badge green">${save}%</span>` : '—'}</td><td><a class="link" href="#/services/${s.id}">View</a></td></tr>`;
        }).join('')}</tbody>
      </table></div>
      <p class="fine">*Our most popular package compared with the midpoint of the market range. Market ranges are indicative and compiled from public pricing guides:</p>
      <ul class="sources">${SOURCES.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>
    </div></section>

    <section class="shell section" id="addons">
      <div class="sec-head"><h2>Add-ons</h2><p class="muted">Bolt these onto any plan or project.</p></div>
      <div class="cards3">${c.addons.map(addonCard).join('')}</div>
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
    bind: root => { bindCartButtons(root); bindCycle(root); },
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
      <div class="cards3">${c.addons.map(addonCard).join('')}</div>
    </section>`,
    bind: bindCartButtons,
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
          <h3>Payment method</h3>
          <div class="pay-methods">
            ${['UPI', 'Card', 'Net banking', 'Bank transfer'].map((m, i) => `<label class="pay-opt"><input type="radio" name="method" value="${m}" ${i ? '' : 'checked'}><span>${esc(m)}</span></label>`).join('')}
          </div>
          <p class="hint">${icon('shield')} Demo mode: payment is simulated. Connect a Razorpay key in Admin → Settings before going live.</p>
          <label class="check"><input type="checkbox" required> I agree to the <a href="#/terms">terms</a> and <a href="#/terms">refund policy</a>.</label>
          <button class="btn primary lg block">Pay ${inr(q.total)}</button>
        </form>
        ${summary(q, '')}
      </div>
    </section>`,
    bind: root => $('#pay', root).addEventListener('submit', e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      Object.assign(user, { name: f.name, phone: f.phone, company: f.company, gstin: f.gstin, city: f.city });
      const btn = $('button.lg', e.target); btn.disabled = true; btn.textContent = 'Processing payment…';
      setTimeout(() => {
        const order = D.placeOrder(user, D.getCart(), coupon, f.method);
        coupon = ''; D.setCart([]);
        go('/order/' + order.id);
      }, 900);
    }),
  };
}

export function orderDone({ id }) {
  const o = D.db().orders.find(o => o.id === id);
  if (!o) return notFound();
  return {
    title: 'Order confirmed',
    html: `<section class="shell section narrow center">
      <div class="success-box big">${icon('check')}<h1>Payment successful</h1>
      <p class="lead">Order <b>${esc(o.invoice)}</b> for <b>${inr(o.total)}</b> is confirmed. A project manager will contact you within 2 working hours.</p>
      <div class="row gap center"><a class="btn primary" href="#/account/orders">Track my order</a><a class="btn ghost" href="#/invoice/${o.id}">View invoice</a></div></div>
    </section>`,
  };
}

// ---------------- Content pages ----------------
export function contact() {
  return {
    title: 'Contact',
    html: `<section class="shell section split">
      <div>
        <h1>Let’s get started on your project</h1>
        <p class="lead">Call, WhatsApp or send the form — we reply within 2 working hours.</p>
        <ul class="contact-list">
          <li>${icon('phoneCall')}<a href="tel:+918667209838">${esc(BUSINESS.phone)}</a></li>
          <li>${icon('wa')}<a href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">WhatsApp chat</a></li>
          <li>${icon('mail')}<a href="mailto:${BUSINESS.email}">${esc(BUSINESS.email)}</a></li>
          <li>${icon('home')}<span>${esc(BUSINESS.address)}</span></li>
        </ul>
        <div class="row gap wrap">${Object.entries(BUSINESS.social).map(([n, u]) => `<a class="chip" href="${u}" target="_blank" rel="noopener">${esc(n)}</a>`).join('')}</div>
      </div>
      ${leadForm({ source: 'Website form', title: 'Send us a message' })}
    </section>`,
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
      <h3>Privacy</h3><p>We use your details only to deliver services and contact you about your enquiry. We never sell your data.</p>
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
        <div class="right"><h2>Tax invoice</h2><p><b>${esc(o.invoice)}</b><br>${date(o.createdAt)}<br>${o.paid ? '<span class="badge green">Paid</span>' : '<span class="badge amber">Unpaid</span>'} via ${esc(o.method)}</p></div></header>
        <div class="bill-to"><small class="muted">Bill to</small><p><b>${esc(c.name)}</b>${c.company ? '<br>' + esc(c.company) : ''}<br>${esc(c.email)}<br>${esc(c.phone || '')}${c.gstin ? '<br>GSTIN ' + esc(c.gstin) : ''}</p></div>
        <table class="table"><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th class="right">Amount</th></tr></thead>
        <tbody>${o.items.map(i => `<tr><td>${esc(i.title)}</td><td>${i.qty}</td><td>${inr(i.unit)}${per(i.billing)}</td><td class="right">${inr(i.total)}</td></tr>`).join('')}</tbody></table>
        <dl class="inv-tot">
          <div><dt>Subtotal</dt><dd>${inr(o.subtotal)}</dd></div>
          ${o.discount ? `<div><dt>Discount${o.coupon ? ' (' + esc(o.coupon) + ')' : ''}</dt><dd>−${inr(o.discount)}</dd></div>` : ''}
          <div><dt>CGST (${s.gst / 2}%)</dt><dd>${inr(o.gst / 2)}</dd></div>
          <div><dt>SGST (${s.gst / 2}%)</dt><dd>${inr(o.gst / 2)}</dd></div>
          <div class="total"><dt>Total</dt><dd>${inr(o.total)}</dd></div>
        </dl>
        <p class="fine">Thank you for your business. This is a computer-generated invoice.</p>
      </article>
    </section>`,
  };
}

export const logoMark = () => `<svg viewBox="0 0 32 32" class="logo-mark" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor"/><path d="m8 9 8 15 8-15" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

let rerender = () => {};
export const setRerender = fn => { rerender = fn; };
export { LEAD_SOURCES };
