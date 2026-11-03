// HTML for blog cards and articles. Pure functions with no browser or storage
// access, so the app and the static page generator (scripts/build-blog.mjs)
// render identical markup.
import { BUSINESS } from '../data.js';
import { esc, icon, per } from '../ui.js';
import { cover, postCard } from './cards.js';
export { cover, postCard, postUrl } from './cards.js';
import { POSTS, postsFor, md, toc } from './index.js';

const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');

// Up to three related guides: the other guide for the same service first,
// then guides from the same category.
export function relatedPosts(p, svc) {
  const cat = svc(p.service)?.cat;
  const same = postsFor(p.service).filter(x => x !== p);
  const near = POSTS.filter(x => x !== p && x.service !== p.service && svc(x.service)?.cat === cat);
  return [...same, ...near].slice(0, 3);
}

// Full article page body. `url` is the article's absolute address for sharing.
export function articleHtml(p, svc, { url = '' } = {}) {
  const s = svc(p.service);
  const share = encodeURIComponent(url);
  return `<article class="shell section post">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/blog/">Blog</a><span>›</span><a href="/blog/#${p.service}">${esc(s?.name)}</a></nav>
      <header class="post-head">
        <span class="tag">${esc(s?.name)}</span>
        <h1>${esc(p.title)}</h1>
        <p class="lead">${esc(p.excerpt)}</p>
        <div class="post-meta"><span class="avatar">VX</span><span><b>Vintorex Digital team</b><small class="muted">${p.minutes} min read · Evergreen guide</small></span></div>
      </header>
      ${cover(p, s, 'wide')}
      <div class="post-grid">
        <div class="post-main">
          <section class="takeaways"><h2>Key takeaways</h2><ul class="ticks col">${p.takeaways.map(t => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul></section>
          <div class="prose-article">${md(p.body)}</div>
          <section class="post-faq"><h2 id="faqs">Frequently asked questions</h2>${p.faqs.map(([q, a]) => `<details class="card"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
        </div>
        <aside class="post-side">
          <nav class="card toc" aria-label="Contents"><h4>On this page</h4>${toc(p).map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('')}<a href="#faqs">FAQs</a></nav>
          ${s ? `<div class="card side-cta"><span class="svc-ic">${icon(s.icon)}</span><h4>${esc(s.name)}</h4><p class="muted">${esc(s.summary)}</p>
            ${s.tiers.map(t => `<div class="tier-line"><span>${esc(t.name)}</span><b>${inr(t.price)}${per(s.billing)}</b></div>`).join('')}
            <a class="btn primary block" href="/services/${s.id}/">See packages</a></div>` : ''}
          <div class="card share"><h4>Share this guide</h4><div class="row gap wrap">
            <a class="chip" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(p.title + ' — ')}${share}">${icon('wa')} WhatsApp</a>
            <a class="chip" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${share}">LinkedIn</a>
            <button class="chip" type="button" data-copy>Copy link</button></div></div>
        </aside>
      </div>
    </article>
    <section class="band"><div class="shell section"><div class="sec-head"><h2>Keep reading</h2><a class="link" href="/blog/">All guides ${icon('arrow')}</a></div>
      <div class="cards3">${relatedPosts(p, svc).map(x => postCard(x, svc(x.service))).join('')}</div></div></section>
    <section class="shell section"><div class="card cta-band"><div><h2>Want us to do this for you?</h2><p class="muted">Talk to the Vintorex team about ${esc(s?.name.toLowerCase() || 'your project')}. Free consultation, reply within 2 working hours.</p></div>
      <div class="row gap wrap"><a class="btn primary" href="/contact">Get a free proposal</a><a class="btn ghost" href="${BUSINESS.whatsapp}" target="_blank" rel="noopener">${icon('wa')} WhatsApp</a></div></div></section>`;
}
