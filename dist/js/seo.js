// Search (SEO), generative-engine (GEO) and answer-engine (AEO) content.
// Pure functions with no browser or storage access: scripts/build-blog.mjs uses
// them to publish static, crawlable pages for every service, a services index,
// an FAQ page, llms.txt and the home page's structured data.
//
// Everything here is derived from the catalog in data.js and services.js, so
// prices and facts on these pages cannot drift from the app. Rebuild after
// changing the catalog:  npm run build:blog
import { BUSINESS, CATEGORIES, PLANS, MILESTONES, MILESTONE_MIN, COMPETITOR_SOURCES } from './data.js';
import { esc, icon } from './ui.js';
import { ART, serviceImagePath } from './service-art.js';
import { postsFor } from './blog/index.js';
import { postCard } from './blog/render.js';

// Bump when prices or facts are re-checked. Shown on pages and used as sitemap lastmod.
export const REVIEWED = { iso: '2026-10-30', label: 'October 2026' };

export const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const unit = s => s.billing === 'month' ? ' per month' : '';
export const fromPrice = s => Math.min(...s.tiers.map(t => t.price));
export const servicePath = id => `/services/${id}/`;
const plain = s => String(s).replace(/\s+/g, ' ').trim();
const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
const cat = s => CATEGORIES.find(c => c.id === s.cat);

// ---------- answer-first copy (what an AI answer or featured snippet should quote) ----------
export function serviceAnswer(s) {
  const [a, , c] = s.tiers;
  return `${s.name} from Vintorex Digital Solutions in Coimbatore starts at ${inr(a.price)}${unit(s)} for the ${a.name} package and goes up to ${inr(c.price)}${unit(s)} for ${c.name}, excluding 18% GST. ` +
    `Typical market prices run ${inr(s.market[0])} to ${inr(s.market[1])}${unit(s)}. Delivery: ${lc(s.delivery)}.`;
}

export function serviceFaqs(s) {
  const tierLine = t => `${t.name} ${inr(t.price)}${unit(s)}`;
  const faqs = [
    [`How much does ${s.name.toLowerCase()} cost in Coimbatore?`,
      `At Vintorex it is ${s.tiers.map(tierLine).join(', ')}, all excluding 18% GST. The wider Indian market range is ${inr(s.market[0])} to ${inr(s.market[1])}${unit(s)}, depending on scope.`],
    [`What is included in each ${s.name.toLowerCase()} package?`,
      s.tiers.map(t => `${t.name}: ${t.features.join(', ')}.`).join(' ')],
    [`Who is ${s.name.toLowerCase()} for?`, `${s.idealFor.join('; ')}.`],
    [`How long does ${s.name.toLowerCase()} take?`, `${s.delivery}. Term: ${s.term.toLowerCase()}.`],
    [`What is not included?`, `${s.excludes.join('; ')}.`],
    [`How does the ${s.name.toLowerCase()} process work?`, s.process.map(([t, d], i) => `${i + 1}. ${t}: ${d}`).join(' ')],
  ];
  if (s.billing === 'once' && s.tiers[0].price >= MILESTONE_MIN) {
    faqs.push([`Can I pay for ${s.name.toLowerCase()} in instalments?`,
      `Yes. One-time projects of ${inr(MILESTONE_MIN)} or more can be paid in milestones: ${MILESTONES.map(([n, p]) => `${p}% ${lc(n)}`).join(', ')}.`]);
  }
  if (s.competitors?.length) {
    faqs.push([`How does Vintorex compare with other ${s.name.toLowerCase()} options?`,
      s.competitors.map(c => `${c.name} (${c.kind.toLowerCase()}): ${c.price}.`).join(' ') + ` Vintorex publishes every price up front, excluding GST.`]);
  }
  return faqs.map(([q, a]) => [q, plain(a)]);
}

export function siteFaqs(services, site = 'https://vintorex.com') {
  const aiCat = CATEGORIES.find(c => c.id === 'ai');
  const min = Math.min(...services.map(fromPrice));
  return [
    ['What does Vintorex Digital Solutions do?',
      `Vintorex Digital Solutions is a digital agency in Coimbatore, Tamil Nadu. It offers ${services.length} services with published prices: ${CATEGORIES.map(c => `${c.name.toLowerCase()} (${c.blurb.toLowerCase()})`).join('; ')}.`],
    ['Where is Vintorex Digital Solutions located?', `${BUSINESS.address}, India. Google Maps: ${BUSINESS.maps}`],
    ['How do I contact Vintorex?', `Call ${BUSINESS.phone}, WhatsApp ${BUSINESS.whatsapp}, or email ${BUSINESS.email}.`],
    ['How much do Vintorex services cost?',
      `Prices start from ${inr(min)} and are listed in rupees on every service page, excluding 18% GST. Each service has three packages, and monthly services are billed per month.`],
    ['Does Vintorex charge GST?', `Yes. Prices exclude ${BUSINESS.gst}% GST, which is added at checkout and shown on a GST invoice that can be used for input tax credit.`],
    ['Which payment methods are accepted?', 'UPI (GPay, PhonePe, Paytm), RuPay, Visa and Mastercard cards, and net banking.'],
    ['Can I pay in instalments?',
      `Yes. One-time projects of ${inr(MILESTONE_MIN)} or more can be paid in milestones: ${MILESTONES.map(([n, p]) => `${p}% ${lc(n)}`).join(', ')}.`],
    ['Is there a free website and SEO audit?', `Yes. Vintorex offers a free 15-point audit covering site speed and Core Web Vitals, local SEO and Google Business Profile, competitor keyword gaps, and social and paid ads quick wins. Request it at ${site}/#audit.`],
    ['Does Vintorex offer membership plans?',
      `Yes: ${PLANS.map(p => `${p.name} (${p.price ? inr(p.price) + ' per month' : 'free'})`).join(', ')}. Paid plans include discounts on one-time services.`],
    ['Does Vintorex offer AI and automation services?',
      `Yes. The ${aiCat.name} category covers ${services.filter(s => s.cat === 'ai').map(s => s.name).join(', ')}.`],
  ].map(([q, a]) => [q, plain(a)]);
}

// ---------- structured data ----------
export function serviceSchema(s, site, orgId) {
  const url = site + servicePath(s.id);
  const monthly = s.billing === 'month';
  return {
    '@context': 'https://schema.org', '@type': 'Service', '@id': url + '#service',
    name: s.name, serviceType: s.name, description: s.overview, url,
    image: site + serviceImagePath(s.id),
    category: cat(s)?.name,
    provider: { '@id': orgId },
    areaServed: [{ '@type': 'City', name: 'Coimbatore' }, { '@type': 'State', name: 'Tamil Nadu' }, { '@type': 'Country', name: 'India' }],
    audience: { '@type': 'Audience', audienceType: s.idealFor.join('; ') },
    hasOfferCatalog: {
      '@type': 'OfferCatalog', name: `${s.name} packages`,
      itemListElement: s.tiers.map(t => ({
        '@type': 'Offer', name: `${s.name} — ${t.name}`, description: t.features.join(', '), url,
        priceCurrency: 'INR', price: t.price, availability: 'https://schema.org/InStock',
        priceSpecification: {
          '@type': 'UnitPriceSpecification', price: t.price, priceCurrency: 'INR', valueAddedTaxIncluded: false,
          ...(monthly ? { unitCode: 'MON', billingDuration: 1, billingIncrement: 1 } : {}),
        },
        itemOffered: { '@type': 'Service', name: s.name },
      })),
    },
  };
}

export const faqSchema = faqs => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

export const breadcrumbSchema = (site, trail) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site + path })),
});

// ---------- page bodies ----------
const tick = on => on === 1 ? `<span class="yes" aria-label="Included">✓</span>` : on === 0 ? `<span class="no" aria-label="Not included">—</span>` : esc(on);

export function serviceBody(s) {
  const art = ART[s.id];
  const posts = postsFor(s.id);
  const faqs = serviceFaqs(s);
  const toc = [['overview', 'Overview'], ['packages', 'Packages and prices'], ['included', 'What is included'], ['process', 'How it works'], ['excluded', 'Not included'], ['compare', 'How we compare'], ['guides', 'Guides'], ['faqs', 'FAQs']];
  return `<article class="shell section post svc-page">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/services/">Services</a><span>›</span><span>${esc(s.name)}</span></nav>
      <header class="post-head">
        <span class="tag">${esc(cat(s)?.name)}</span>
        <h1>${esc(s.name)} in Coimbatore: packages and prices</h1>
        <p class="lead">${esc(s.summary)}</p>
      </header>
      <section class="answer" aria-label="Quick answer"><h2>Quick answer</h2><p>${esc(serviceAnswer(s))}</p><small class="muted">Prices reviewed ${REVIEWED.label}. Excludes 18% GST.</small></section>
      <figure class="svc-hero"><img src="${serviceImagePath(s.id)}" alt="${esc(art?.alt || s.name)}" width="1600" height="900" decoding="async"></figure>
      <div class="post-grid">
        <div class="post-main">
          <section id="overview"><h2>Overview</h2><p>${esc(s.overview)}</p>
            <h3>Ideal for</h3><ul class="ticks col">${s.idealFor.map(i => `<li>${icon('check')}${esc(i)}</li>`).join('')}</ul></section>
          <section id="packages"><h2>Packages and prices</h2>
            <div class="cards3">${s.tiers.map(t => `<div class="card tier-card${t.popular ? ' pop' : ''}"><h3>${esc(t.name)}${t.popular ? ' <span class="tag">Most popular</span>' : ''}</h3>
              <p class="price"><b>${inr(t.price)}</b><small>${s.billing === 'month' ? '/month' : ' one-time'} + GST</small></p>
              <ul class="ticks col">${t.features.map(f => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul></div>`).join('')}</div>
            <p class="muted">Delivery: ${esc(s.delivery)}. Term: ${esc(s.term)}.</p></section>
          <section id="included"><h2>What is included in each package</h2>
            <div class="table-wrap scroll"><table class="table"><thead><tr><th>Work item</th>${s.tiers.map(t => `<th>${esc(t.name)}</th>`).join('')}</tr></thead>
            <tbody>${s.works.map(([label, a, b, c]) => `<tr><td>${esc(label)}</td><td>${tick(a)}</td><td>${tick(b)}</td><td>${tick(c)}</td></tr>`).join('')}</tbody></table></div></section>
          <section id="process"><h2>How ${esc(s.name.toLowerCase())} works</h2>
            <ol class="steps-list">${s.process.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ol></section>
          <section id="excluded"><h2>What is not included</h2><ul>${s.excludes.map(e => `<li>${esc(e)}</li>`).join('')}</ul></section>
          <section id="compare"><h2>How Vintorex compares on price</h2>
            <p>${esc(s.marketNote || `The typical Indian market range for this service is ${inr(s.market[0])} to ${inr(s.market[1])}${unit(s)}.`)}</p>
            <div class="table-wrap scroll"><table class="table"><thead><tr><th>Option</th><th>Type</th><th>Published price</th><th>What you get</th><th>Gaps</th></tr></thead>
            <tbody><tr><td><b>Vintorex</b></td><td>Done-for-you</td><td>${inr(fromPrice(s))}${s.billing === 'month' ? '/mo' : ''} and up</td><td>${esc(s.tiers[0].features.slice(0, 3).join(', '))}</td><td>—</td></tr>
            ${(s.competitors || []).map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.kind)}</td><td>${esc(c.price)}</td><td>${esc(c.includes)}</td><td>${esc(c.gaps)}</td></tr>`).join('')}</tbody></table></div>
            <p class="fine">Competitor prices are indicative and were checked ${REVIEWED.label}. Sources: ${[...new Set((s.competitors || []).flatMap(c => c.src))].map(k => COMPETITOR_SOURCES[k] ? `<a href="${COMPETITOR_SOURCES[k][1]}" target="_blank" rel="noopener nofollow">${esc(COMPETITOR_SOURCES[k][0])}</a>` : '').filter(Boolean).join('; ')}.</p></section>
          <section id="guides"><h2>Guides on ${esc(s.name.toLowerCase())}</h2><div class="cards2">${posts.map(p => postCard(p, s)).join('')}</div></section>
          <section class="post-faq"><h2 id="faqs">Frequently asked questions</h2>${faqs.map(([q, a]) => `<details class="card"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
        </div>
        <aside class="post-side">
          <nav class="card toc" aria-label="Contents"><h4>On this page</h4>${toc.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('')}</nav>
          <div class="card side-cta"><span class="svc-ic">${icon(s.icon)}</span><h4>Get ${esc(s.name)}</h4><p class="muted">From ${inr(fromPrice(s))}${s.billing === 'month' ? ' per month' : ''} + GST. Order online or ask for a custom quote.</p>
            <a class="btn primary block" href="/#/services/${s.id}">Choose a package</a>
            <a class="btn ghost block" href="/#/contact">Get a free proposal</a>
            <a class="btn ghost block" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">${icon('wa')} WhatsApp us</a></div>
        </aside>
      </div>
    </article>`;
}

export function servicesIndexBody(services) {
  return `<section class="blog-hero"><div class="shell section">
      <p class="eyebrow"><span></span>Services and prices</p>
      <h1>Digital services and prices in Coimbatore</h1>
      <p class="lead">${esc(`${services.length} services in ${CATEGORIES.length} categories, each with three published packages. Prices start from ${inr(Math.min(...services.map(fromPrice)))}, excluding 18% GST. Reviewed ${REVIEWED.label}.`)}</p>
    </div></section>
    <section class="shell section">
      ${CATEGORIES.map(c => `<h2 class="cat-head" id="${c.id}">${esc(c.name)} <small class="muted">${esc(c.blurb)}</small></h2>
        <div class="cards3">${services.filter(s => s.cat === c.id).map(s => `<a class="card post-card" href="${servicePath(s.id)}">
          <div class="cover" style="--h:${{ build: 255, grow: 155, brand: 18, tech: 205, ai: 285 }[s.cat]}"><img class="cover-art-img" src="${serviceImagePath(s.id)}" alt="${esc(ART[s.id]?.alt || s.name)}" width="1600" height="900" loading="lazy"><div class="cover-overlay" aria-hidden="true"></div><span class="cover-ic">${icon(s.icon)}</span></div>
          <div class="post-body"><span class="tag">${s.billing === 'month' ? 'Monthly' : 'One-time'}</span><h3>${esc(s.name)}</h3><p>${esc(s.summary)}</p><small class="muted">From ${inr(fromPrice(s))}${s.billing === 'month' ? '/mo' : ''} + GST · ${esc(s.delivery)}</small></div></a>`).join('')}</div>`).join('')}
    </section>
    <section class="shell section"><h2>Price list at a glance</h2>
      <div class="table-wrap scroll"><table class="table"><thead><tr><th>Service</th><th>Vintorex from</th><th>Market range</th><th>Delivery</th></tr></thead>
      <tbody>${services.map(s => `<tr><td><a href="${servicePath(s.id)}">${esc(s.name)}</a></td><td><b>${inr(fromPrice(s))}</b>${s.billing === 'month' ? '/mo' : ''}</td><td>${inr(s.market[0])} – ${inr(s.market[1])}${s.billing === 'month' ? '/mo' : ''}</td><td>${esc(s.delivery)}</td></tr>`).join('')}</tbody></table></div>
      <p class="fine">All prices in INR, excluding 18% GST. Market ranges are indicative and were reviewed ${REVIEWED.label}.</p></section>
    <section class="shell section"><div class="card cta-band"><div><h2>Not sure which package fits?</h2><p class="muted">Tell us about your business and get a fixed-price proposal. Free consultation.</p></div>
      <div class="row gap wrap"><a class="btn primary" href="/#/contact">Get a free proposal</a><a class="btn ghost" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">${icon('wa')} WhatsApp</a></div></div></section>`;
}

export function faqBody(faqs) {
  return `<section class="blog-hero"><div class="shell section">
      <p class="eyebrow"><span></span>FAQ</p>
      <h1>Vintorex Digital Solutions: frequently asked questions</h1>
      <p class="lead">Short, direct answers about our services, prices, payments and location. Each service page has its own FAQs too.</p>
    </div></section>
    <section class="shell section post-faq"><div class="faq-wrap">${faqs.map(([q, a]) => `<details class="card" open><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
      <p class="muted">Reviewed ${REVIEWED.label}. See all <a href="/services/">services and prices</a> or <a href="/blog/">read our guides</a>.</p></section>`;
}

// ---------- llms.txt: a plain-text map of the site for AI assistants ----------
const SUMMARY = (services) => `Vintorex Digital Solutions is a digital agency in Coimbatore, Tamil Nadu, India. It sells ${services.length} websites, marketing, branding, cloud and AI services with published prices in INR (excluding 18% GST), each in three packages.`;

export function llmsTxt(site, services, posts) {
  const line = s => `- [${s.name}](${site}${servicePath(s.id)}): from ${inr(fromPrice(s))}${s.billing === 'month' ? '/month' : ''}. ${s.summary}`;
  return `# ${BUSINESS.name}

> ${SUMMARY(services)}

Contact: ${BUSINESS.phone} · ${BUSINESS.email} · ${BUSINESS.address} · WhatsApp ${BUSINESS.whatsapp}
Prices reviewed ${REVIEWED.label}. Full text of every service, price and FAQ: ${site}/llms-full.txt

${CATEGORIES.map(c => `## ${c.name}\n${services.filter(s => s.cat === c.id).map(line).join('\n')}`).join('\n\n')}

## Company
- [All services and prices](${site}/services/)
- [Frequently asked questions](${site}/faq/)
- [Guides and blog](${site}/blog/)
- [Contact](${site}/#/contact)

## Guides
${posts.map(p => `- [${p.title}](${site}/blog/${p.slug}/): ${p.excerpt}`).join('\n')}
`;
}

export function llmsFullTxt(site, services) {
  return `# ${BUSINESS.name}: services, prices and FAQs

${SUMMARY(services)}
Address: ${BUSINESS.address}. Phone: ${BUSINESS.phone}. Email: ${BUSINESS.email}. Prices reviewed ${REVIEWED.label}.

## General FAQs
${siteFaqs(services, site).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n\n')}

${services.map(s => `## ${s.name}
URL: ${site}${servicePath(s.id)}
${serviceAnswer(s)}
${s.overview}
Packages:
${s.tiers.map(t => `- ${t.name}: ${inr(t.price)}${s.billing === 'month' ? '/month' : ''}. ${t.features.join(', ')}.`).join('\n')}
${serviceFaqs(s).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n')}`).join('\n\n')}
`;
}
