import { BUSINESS, SERVICES } from '../dist/js/data.js';
import { WORK_PROJECTS } from '../dist/js/work-art.js';
import { esc } from '../dist/js/ui.js';
import { photo, SIZES } from '../dist/js/images.js';

export function offerPageBody() {
  const selected = ['web-design', 'ecommerce', 'seo', 'branding', 'ai-chatbot', 'analytics'].map(id => SERVICES.find(s => s.id === id));
  const diyas = n => `<div class="diya-row" aria-hidden="true">${Array.from({ length: n }, () => '<span class="diya"><i></i></span>').join('')}</div>`;
  return `<div class="offer-page diwali">
    <section class="shell offer-hero">
      <div><p class="eyebrow"><span></span>Diwali special · Coimbatore</p>
        <h1>Light a cracker. Unwrap a surprise.</h1>
        <p class="lead">This Diwali, scratch the card and a welcome offer bursts open — ₹7,999–₹9,999 off one service, with a free website and SEO audit beside it.</p>
        <div class="row gap wrap"><a class="btn primary" href="/offer" data-open-offer>Light my surprise ↓</a><a class="btn ghost" href="#offers">Explore services</a></div>
      </div>
      <figure><img src="/images/hero-dashboard-1024.webp" srcset="/images/hero-dashboard-640.webp 640w, /images/hero-dashboard-1024.webp 1024w, /images/hero-dashboard-1600.webp 1600w" sizes="(max-width: 760px) 92vw, 46vw" width="1600" height="900" alt="Studio monitor showing a campaign performance dashboard" fetchpriority="high"><figcaption>Website strategy · Design · Digital growth</figcaption></figure>
      ${diyas(7)}
    </section>
    <section class="band" id="offers"><div class="shell section"><p class="eyebrow">01 / Explore</p><h2>Choose a starting point</h2>
      <div class="offer-grid">${selected.map(s => `<a class="card offer-service" href="/services/${s.id}/"><h3>${esc(s.name)}</h3><p>${esc(s.summary || s.overview)}</p><strong data-from="${s.id}">From ₹${Math.min(...s.tiers.map(t => t.price)).toLocaleString('en-IN')}${s.billing === 'monthly' ? ' / month' : ''} →</strong></a>`).join('')}</div>
      <p class="fine">Prices exclude GST. <a href="/services/">View all ${SERVICES.length} services</a></p></div></section>
    <section class="shell section"><p class="eyebrow">02 / Studio work</p><h2>Inside recent projects</h2><div class="offer-grid">
      ${WORK_PROJECTS.slice(0,3).map(w => `<article class="card offer-project">${photo(`/images/work/${w.id}.jpg`, { alt: `${w.title} project`, sizes: SIZES.card })}<div><small>${esc(w.category)}</small><h3>${esc(w.title)}</h3><p>${esc(w.summary)}</p></div></article>`).join('')}</div></section>
    <section class="band"><div class="shell section"><p class="eyebrow">03 / How it works</p><h2>From your first question to a project plan</h2>
      <ol class="offer-steps"><li><b>Choose your service.</b> Pick the area you want to improve.</li><li><b>Tell us your goal.</b> Share your website or describe what you’re building.</li><li><b>Review the scope.</b> Discuss deliverables, pricing, and next steps with the studio.</li></ol></div></section>
    <section id="enquire" class="shell section offer-enquire"><div><p class="eyebrow"><span></span>04 / The burst</p><h2>Your surprise is ready to light.</h2><p>Scratch the cracker or press the button. ₹7,999–₹9,999 off one package flies out. Register to keep it, and pay when the celebrations settle.</p>
      <a class="btn primary" href="/offer" data-open-offer>Light the cracker →</a></div>${diyas(5)}<noscript><a href="${esc(BUSINESS.whatsapp)}">Enquire on WhatsApp</a></noscript></section>
    <dialog class="offer-dialog" aria-labelledby="offer-title">
      <header><p class="eyebrow"><span></span>Shubh Diwali · Vintorex</p><button type="button" class="btn ghost" data-close aria-label="Close enquiry">×</button></header>
      <h2 id="offer-title">Your Diwali surprise</h2><p class="fine" data-progress aria-live="polite"></p>
      <div data-reveal><p>Scratch the foil, or light the cracker, and watch your offer burst open.</p>
        ${diyas(5)}
        <div class="offer-ticket"><b data-value>₹7,999–₹9,999</b><span data-code>Diwali coupon</span><canvas width="480" height="144" aria-hidden="true"></canvas></div>
        <button class="btn primary" type="button" data-unlock>Light the cracker</button></div>
      <form class="offer-form" id="offer-form" data-whatsapp="${esc(BUSINESS.whatsapp)}">
        <fieldset hidden disabled><legend>Choose your service</legend><label>Service<select name="service" required><option value="">Select a service</option>${SERVICES.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></label><label>Package<select name="tier" required></select></label><p data-price></p><button class="btn primary" type="button" data-next>Continue →</button></fieldset>
        <fieldset hidden disabled><legend>Tell us about your project</legend><label>Your name<input name="name" autocomplete="name" required maxlength="90"></label><label>Business name (optional)<input name="business" autocomplete="organization" maxlength="100"></label><label>Project goal<textarea name="goal" rows="3" maxlength="600" required></textarea></label><div class="row gap wrap"><button class="btn ghost" type="button" data-back>Back</button><button class="btn primary">Review enquiry</button></div></fieldset>
        <div hidden data-ready><h3>Your enquiry pass</h3><p data-preview></p><div class="offer-actions"><button class="btn primary" type="button" data-save>Claim offer</button> <a class="btn primary" data-register href="/register?next=offer" hidden>Register and claim</a> <button class="btn primary" data-pay type="button" hidden>Pay now</button> <button class="btn ghost" type="button" data-edit>Edit details</button><a class="offer-signin" data-login href="/login?next=offer" hidden>Already registered? Sign in</a></div></div>
      </form><p role="status" data-status></p>
    </dialog>
    <section class="shell section offer-faq"><h2>Offer questions</h2><details><summary>Do I need an existing website?</summary><p>No. If you’re starting from scratch, tell us what you want to build.</p></details><details><summary>Where do I use the welcome code?</summary><p>Choose any service tier here. The coupon reduces its price before GST, up to the package price. Return to this page with the same account to pay your saved total.</p></details><details><summary>Can I enquire by email?</summary><p>Send your brief to <a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a>.</p></details></section>
  </div><script type="module" src="/js/offer.js?v=diwali3"></script>`;
}
