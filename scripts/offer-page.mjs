import { BUSINESS, SERVICES, COUPONS } from '../dist/js/data.js';
import { WORK_PROJECTS } from '../dist/js/work-art.js';
import { esc } from '../dist/js/ui.js';

export function offerPageBody() {
  const welcome = COUPONS.find(c => c.code === 'WELCOME10');
  const selected = ['web-design', 'ecommerce', 'seo', 'branding', 'ai-chatbot', 'analytics'].map(id => SERVICES.find(s => s.id === id));
  return `<div class="offer-page">
    <section class="shell offer-hero">
      <div><p class="eyebrow">Vintorex studio · Coimbatore</p>
        <h1>What’s next for your business?</h1>
        <p class="lead">Build a storefront, reach new customers, or automate the work behind the scenes. Start with a free website and SEO audit.</p>
        <div class="row gap wrap"><a class="btn primary" href="#enquire">Start my enquiry ↓</a><a class="btn ghost" href="#offers">Explore services</a></div>
      </div>
      <figure><img src="/images/hero-dashboard-1024.webp" srcset="/images/hero-dashboard-640.webp 640w, /images/hero-dashboard-1024.webp 1024w, /images/hero-dashboard-1600.webp 1600w" sizes="(max-width: 760px) 92vw, 46vw" width="1600" height="900" alt="Studio monitor showing a campaign performance dashboard" fetchpriority="high"><figcaption>Website strategy · Design · Digital growth</figcaption></figure>
    </section>
    <section class="band" id="offers"><div class="shell section"><p class="eyebrow">01 / Explore</p><h2>Choose a starting point</h2>
      <div class="offer-grid">${selected.map(s => `<a class="card offer-service" href="/services/${s.id}/"><h3>${esc(s.name)}</h3><p>${esc(s.summary || s.overview)}</p><strong>From ₹${Math.min(...s.tiers.map(t => t.price)).toLocaleString('en-IN')}${s.billing === 'monthly' ? ' / month' : ''} →</strong></a>`).join('')}</div>
      <p class="fine">Prices exclude GST. <a href="/services/">View all ${SERVICES.length} services</a></p></div></section>
    <section class="shell section"><p class="eyebrow">02 / Studio work</p><h2>Inside recent projects</h2><div class="offer-grid">
      ${WORK_PROJECTS.slice(0,3).map(w => `<article class="card offer-project"><img src="/images/work/${w.id}.jpg" width="1600" height="900" loading="lazy" alt="${esc(w.title)} project"><div><small>${esc(w.category)}</small><h3>${esc(w.title)}</h3><p>${esc(w.summary)}</p></div></article>`).join('')}</div></section>
    <section class="band"><div class="shell section"><p class="eyebrow">03 / How it works</p><h2>From your first question to a project plan</h2>
      <ol class="offer-steps"><li><b>Choose your service.</b> Pick the area you want to improve.</li><li><b>Tell us your goal.</b> Share your website or describe what you’re building.</li><li><b>Review the scope.</b> Discuss deliverables, pricing, and next steps with the studio.</li></ol></div></section>
    <section id="enquire" class="shell section offer-enquire"><div><p class="eyebrow">04 / Enquire</p><h2>Let’s plan your project.</h2><p>Prepare a short brief, then send it directly to the Vintorex team on WhatsApp.</p>
      <details class="offer-reveal"><summary>Reveal my welcome offer</summary><p><b>${esc(welcome.code)}</b> · ${esc(welcome.desc)}. Enter the code at checkout.</p></details></div>
      <form class="card offer-form" id="offer-form" hidden data-whatsapp="${esc(BUSINESS.whatsapp)}">
        <fieldset><legend>1. Choose your service</legend><label>Service<select name="service" required><option value="">Select a service</option><option>Free website and SEO audit</option>${SERVICES.map(s => `<option>${esc(s.name)}</option>`).join('')}<option>Help me choose</option></select></label><button class="btn primary" type="button" data-next>Continue →</button></fieldset>
        <fieldset hidden disabled><legend>2. Prepare your brief</legend><label>Your name<input name="name" autocomplete="name" required maxlength="90"></label><label>Project goal<textarea name="goal" rows="3" maxlength="600" required placeholder="What would you like to improve?"></textarea></label><div class="row gap wrap"><button class="btn ghost" type="button" data-back>Back</button><button class="btn primary">Prepare enquiry</button></div></fieldset>
        <div hidden data-ready><h3>Your brief is ready</h3><p data-preview></p><a class="btn primary" data-send target="_blank" rel="noopener noreferrer">Open WhatsApp to send ↗</a> <button class="btn ghost" type="button" data-edit>Edit brief</button></div>
      </form><noscript><a class="btn primary" href="${esc(BUSINESS.whatsapp)}">Enquire on WhatsApp</a></noscript></section>
    <section class="shell section offer-faq"><h2>Offer questions</h2><details><summary>Do I need an existing website?</summary><p>No. If you’re starting from scratch, tell us what you want to build.</p></details><details><summary>Where do I use the welcome code?</summary><p>Enter the code in your cart and review the adjusted total before payment.</p></details><details><summary>Can I enquire by email?</summary><p>Send your brief to <a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a>.</p></details></section>
  </div><script type="module" src="/js/offer.js"></script>`;
}
