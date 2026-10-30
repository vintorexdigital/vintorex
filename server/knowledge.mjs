// Knowledge base for the chat assistant (server/chat.mjs): the site's own content cut
// into short, self-contained chunks of { id, title, url, service?, text }.
//
// Chunks are generated from the same catalog, FAQs, guides and policies that build the
// pages, so the assistant's prices and facts can't drift from the site. The company,
// contact, ordering and audit chunks repeat copy that lives inline in js/public.js
// (About, Contact and Home pages): update them together.
import { SERVICES, ADDONS, PLANS, PRODUCTS, COUPONS, CATEGORIES, BUSINESS, MILESTONES, MILESTONE_MIN, ANNUAL_MONTHS_PAID, pricingFaqs } from '../dist/js/data.js';
import { siteFaqs, servicePath, inr, REVIEWED } from '../dist/js/seo.js';
import { POSTS } from '../dist/js/blog/index.js';
import { POLICIES } from '../dist/js/policies.js';
import { WORK_PROJECTS } from '../dist/js/work-art.js';

const SITE = 'https://vintorex.com';
const MAX = 1400; // characters per chunk, about 350 tokens
const per = s => s.billing === 'month' ? '/month' : ' one-time';
const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
const milestones = () => MILESTONES.map(([n, p]) => `${p}% ${lc(n)}`).join(', ');
const join = (...parts) => parts.filter(Boolean).join('\n');

// Markdown subset used by the guides (js/blog/index.js) to plain text.
const plain = md => md.trim()
  .replace(/\*\*(.+?)\*\*/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/^\s*### (.+)$/gm, '$1:')
  .replace(/^\s*> ?/gm, '')
  .replace(/[ \t]+$/gm, '')
  .replace(/\n{3,}/g, '\n\n');

// Splits text into even pieces of at most about MAX characters at line breaks (long
// lines at sentence ends), repeating `head` (a heading line) at the top of each piece.
function pieces(text, head = '') {
  const room = MAX - head.length;
  const parts = text.trim().split('\n').flatMap(line => line.length > room ? line.split(/(?<=[.!?;])\s+/) : [line]);
  const total = parts.reduce((n, p) => n + p.length + 1, 0);
  const count = Math.ceil(total / room);
  const out = [];
  let cur = '';
  for (const part of parts) {
    if (cur && cur.length + part.length + 1 > room) { out.push(cur); cur = ''; }
    cur = cur ? `${cur}\n${part}` : part;
    if (out.length < count - 1 && cur.length >= total / count) { out.push(cur); cur = ''; }
  }
  if (cur.trim()) out.push(cur);
  return out.map(p => join(head, p.trim()));
}

// One chunk, or several numbered ones when the text is long.
function chunks(id, title, url, text, extra = {}, head = '') {
  const list = pieces(text, head);
  return list.map((t, i) => ({ id: list.length > 1 ? `${id}:${i + 1}` : id, title: list.length > 1 ? `${title} (part ${i + 1})` : title, url, ...extra, text: t }));
}

// ---------- company, contact, ordering ----------
function company() {
  const cats = CATEGORIES.map(c => `${c.name} (${lc(c.blurb)})`).join('; ');
  const ordering = join(
    'How to order from Vintorex online:',
    '1. Open a service page and choose a package, or choose a membership on the pricing page.',
    '2. Add any add-ons, then check out. Payments go through Razorpay: UPI (GPay, PhonePe, Paytm), RuPay, Visa and Mastercard cards, and net banking.',
    `3. ${BUSINESS.gst}% GST is added at checkout and shown on a GST invoice that can be used for input tax credit.`,
    '4. After paying, the customer dashboard shows project progress, invoices, digital downloads and support tickets, and lets members upgrade, pause or cancel their plan.',
    `One-time projects of ${inr(MILESTONE_MIN)} or more can be paid in milestones: ${milestones()}. Later instalments are paid from the dashboard.`,
    // The cart page suggests this code to every visitor; other coupons stay unadvertised.
    ...COUPONS.filter(c => c.code === 'WELCOME10').map(c => `Coupon ${c.code}: ${lc(c.desc)}, entered in the cart.`),
    'For a custom scope, send an enquiry on the contact page to get a free, fixed-price proposal.',
  );
  return [
    { id: 'company', title: 'About Vintorex Digital Solutions', url: '/#/about', text: join(
      `${BUSINESS.name} (Vintorex) is a digital marketing, web development and AI agency in Coimbatore, Tamil Nadu, India. Tagline: “${BUSINESS.tagline}”`,
      'It was founded in 2024 at Bankers Colony, Cheran Ma Nagar, Coimbatore. The proprietor and lead digital marketing architect is Ranjith Kumar.',
      `It offers ${SERVICES.length} services in ${CATEGORIES.length} categories: ${cats}. Every package has a published price, set 15–40% below metro agency rates.`,
      'How it works: data-driven strategy with a live client reporting dashboard; 100% published prices; replies to enquiries within 2 working hours from the people managing the account; a 100% in-house team; milestone payments on larger projects.',
      'Journey: 2024 founded in Coimbatore for Tamil Nadu manufacturers and retailers; 2025 grew to 21 integrated services; 2026 added AI chatbots, voice agents, CRM automation and AI search optimisation.',
      'Vintorex works with clients across India and abroad, not only in Coimbatore.',
    ) },
    { id: 'contact', title: 'Contact Vintorex', url: '/#/contact', text: join(
      `Phone: ${BUSINESS.phone} (call to speak to a specialist).`,
      `WhatsApp: ${BUSINESS.whatsapp} (the fastest way to reach the team).`,
      `Email: ${BUSINESS.email} (replies within 2 working hours).`,
      `Office: ${BUSINESS.address}. Visitors are welcome; call or WhatsApp ahead so someone is free to meet you. Directions: ${BUSINESS.maps}`,
      `Google profile and reviews: ${BUSINESS.google}`,
      `Social media: ${Object.entries(BUSINESS.social).map(([n, u]) => `${n} ${u}`).join(', ')}.`,
      'To start a project, send an enquiry on the contact page: share the goal, a specialist replies within 2 working hours, then you get a free, fixed-price proposal with no obligation.',
      'Please don’t send passwords, bank details or identity documents through the form.',
    ) },
    { id: 'ordering', title: 'How to order and pay', url: '/#/services', text: ordering },
    { id: 'audit', title: 'Free website and SEO audit', url: '/#/#audit', text: join(
      'Vintorex offers a free 15-point audit of website speed, Google ranking, social presence and ad setup, with a fixed-price action plan.',
      'It covers: speed and Core Web Vitals (mobile and desktop); local SEO and Google Business Profile; competitor keyword gaps and high-intent opportunities; social media and paid ads quick wins.',
      'How it works: 1. Share your website, business and goals. 2. Speed and Web Vitals scan. 3. Local SEO check. 4. Competitor and ads review. 5. Your report: a health score and a fixed-price action plan.',
      'Request it with the “Request my free audit” form in the Free audit section of the home page.',
    ) },
    { id: 'work', title: 'Client projects', url: '/#/#work', text: join(
      'Recent client projects by Vintorex:',
      ...WORK_PROJECTS.map(w => `- ${w.title} (${w.category}): ${w.summary} Highlights: ${w.metrics.join(', ')}.`),
    ) },
    { id: 'pages', title: 'Pages on vintorex.com', url: '/', text: join(
      'Where to find things on vintorex.com:',
      '- Services and prices: /services/ (each service has its own page under /services/)',
      '- Pricing, memberships and add-ons: /#/pricing',
      '- Competitor price analysis: /#/compare',
      '- Shop for digital downloads: /#/shop',
      '- Guides and blog: /blog/ · FAQ: /faq/',
      '- Free audit: /#/#audit · Contact and quotes: /#/contact · About: /#/about',
      '- Sign in: /#/login · Create an account: /#/register · Customer dashboard: /#/account · Cart: /#/cart',
      `- Policies: ${POLICIES.map(p => `${p.label} ${p.path}`).join(', ')}`,
    ) },
  ];
}

// ---------- FAQs and memberships ----------
function faqs() {
  const site = siteFaqs(SERVICES, SITE).map(([q, a], i) => ({ id: `faq:${i + 1}`, title: `FAQ: ${q}`, url: '/faq/', text: `Q: ${q}\nA: ${a}` }));
  const pricing = pricingFaqs(BUSINESS.gst).map(([q, a], i) => ({ id: `pricing-faq:${i + 1}`, title: `Pricing FAQ: ${q}`, url: '/#/pricing', text: `Q: ${q}\nA: ${a}` }));
  const plan = p => `- ${p.name}: ${p.price ? `${inr(p.price)}/month` : 'free'}${p.popular ? ' (most popular)' : ''}. ${p.tagline}. Includes: ${p.features.join('; ')}.`;
  const plans = {
    id: 'plans', title: 'Membership plans', url: '/#/pricing', text: join(
      `Membership plans (prices exclude ${BUSINESS.gst}% GST):`,
      ...PLANS.map(plan),
      `Annual billing: pay for ${ANNUAL_MONTHS_PAID} months and get 12 (${12 - ANNUAL_MONTHS_PAID} months free).`,
      'Member discounts apply automatically at checkout to any one-time service package. Members can upgrade, pause, resume or cancel from the customer dashboard; a cancelled monthly plan stays active until the end of the billing period.',
    ),
  };
  return [...site, ...pricing, plans];
}

// ---------- services ----------
function service(s) {
  const url = servicePath(s.id);
  const extra = { service: s.id };
  const cat = CATEGORIES.find(c => c.id === s.cat);
  const tierNames = s.tiers.map(t => t.name);
  const cell = v => v === 1 ? 'yes' : v === 0 ? 'no' : String(v);
  const addons = ADDONS.filter(a => a.for.includes(s.id));
  const instalments = s.billing === 'once' && s.tiers[0].price >= MILESTONE_MIN;
  return [
    ...chunks(`service:${s.id}`, `${s.name}: packages and prices`, url, join(
      `How much ${s.name} costs at Vintorex: ${inr(Math.min(...s.tiers.map(t => t.price)))} to ${inr(Math.max(...s.tiers.map(t => t.price)))}${per(s)}, excluding ${BUSINESS.gst}% GST.`,
      `${s.name} (${cat.name}): ${s.summary}`,
      s.overview,
      `Ideal for: ${s.idealFor.join('; ')}.`,
      `Packages (${s.billing === 'month' ? 'billed monthly' : 'one-time'}, prices exclude ${BUSINESS.gst}% GST):`,
      ...s.tiers.map(t => `- ${t.name}${t.popular ? ' (most popular)' : ''}: ${inr(t.price)}${per(s)}. ${t.features.join(', ')}.`),
      `Delivery: ${s.delivery}. Term: ${s.term}. Typical Indian market price: ${inr(s.market[0])} to ${inr(s.market[1])}${s.billing === 'month' ? '/month' : ''}.`,
      instalments && `Can be paid in milestones: ${milestones()}.`,
    ), extra),
    ...chunks(`service:${s.id}:included`, `${s.name}: what each package includes`, url,
      s.works.map(([label, ...v]) => `- ${label}: ${v.map((x, i) => `${tierNames[i]} ${cell(x)}`).join('; ')}`).join('\n'),
      extra, `What is included in each ${s.name} package (${tierNames.join(', ')}):`),
    ...chunks(`service:${s.id}:process`, `${s.name}: how it works and what is not included`, url, join(
      `How ${s.name} works:`,
      ...s.process.map(([t, d], i) => `${i + 1}. ${t}: ${d}`),
      `Not included: ${s.excludes.join('; ')}.`,
    ), extra),
    ...chunks(`service:${s.id}:compare`, `${s.name}: price comparison with other options`, url, join(
      s.marketNote || `The typical Indian market range for ${s.name} is ${inr(s.market[0])} to ${inr(s.market[1])}${s.billing === 'month' ? ' per month' : ''}.`,
      `Vintorex: from ${inr(Math.min(...s.tiers.map(t => t.price)))}${per(s)}, every price published.`,
      ...(s.competitors || []).map(c => `- ${c.name} (${c.kind}): ${c.price}. Includes: ${c.includes} Gaps: ${c.gaps}`),
      `Competitor prices are indicative and were checked ${REVIEWED.label}.`,
    ), extra),
    ...(addons.length ? chunks(`service:${s.id}:addons`, `${s.name}: add-ons`, url,
      addons.map(a => `- ${a.name}: ${inr(a.price)}${per(a)}. ${a.desc}`).join('\n'),
      extra, `Add-ons for ${s.name} (prices exclude GST):`) : []),
  ];
}

function addons() {
  const any = ADDONS.filter(a => !a.for.length);
  return chunks('addons', 'Add-ons for any plan or service', '/#/pricing#addons', join(
    'These add-ons work with any plan or service (prices exclude GST):',
    ...any.map(a => `- ${a.name}: ${inr(a.price)}${per(a)}. ${a.desc}`),
    `There are ${ADDONS.length} add-ons in total; each service page lists the ones that apply to it, and the pricing and shop pages list them all.`,
  ));
}

// ---------- shop ----------
function shop() {
  const kinds = [...new Set(PRODUCTS.map(p => p.kind))];
  return kinds.flatMap(kind => chunks(`shop:${kind.toLowerCase().replace(/\W+/g, '-')}`, `Shop: ${kind.toLowerCase()} downloads`, '/#/shop',
    PRODUCTS.filter(p => p.kind === kind).map(p => `- ${p.name}: ${inr(p.price)} (MRP ${inr(p.mrp)})`).join('\n'),
    {}, `${kind} digital downloads in the Vintorex shop. Instant download after payment from the customer dashboard; nothing is shipped:`));
}

// ---------- guides ----------
function guide(p) {
  const s = SERVICES.find(x => x.id === p.service);
  const url = `/blog/${p.slug}/`;
  const extra = { service: p.service };
  // Text before the first "## " heading, if any, becomes an untitled first section.
  const [intro, ...rest] = ('\n' + p.body.trim()).split(/\n## /);
  // Neighbouring sections share a chunk while they fit, so each chunk keeps its context.
  const sections = [];
  for (const sec of [...(intro.trim() ? ['Introduction\n' + intro] : []), ...rest]) {
    const [head, ...lines] = sec.split('\n');
    const text = `${head.trim()}:\n${plain(lines.join('\n'))}`;
    const last = sections.at(-1);
    if (last && last.text.length + text.length + 2 <= MAX) { last.heads.push(head.trim()); last.text += '\n\n' + text; }
    else sections.push({ heads: [head.trim()], text });
  }
  return [
    { id: `guide:${p.slug}`, title: `Guide: ${p.title}`, url, ...extra, text: join(
      p.excerpt,
      `Key takeaways:\n${p.takeaways.map(t => `- ${t}`).join('\n')}`,
      `A guide from the Vintorex blog about ${s.name}.`,
    ) },
    ...sections.flatMap((sec, i) => chunks(`guide:${p.slug}:${i + 1}`, `Guide: ${p.title} — ${sec.heads.join(' · ')}`, url, sec.text, extra)),
    ...chunks(`guide:${p.slug}:faqs`, `Guide: ${p.title} — FAQs`, url, p.faqs.map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n'), extra),
  ];
}

// ---------- policies ----------
function policy(p) {
  const sections = [];
  for (const [kind, value] of p.body) {
    if (kind === 'h2' || !sections.length) sections.push({ head: kind === 'h2' ? value : '', lines: [] });
    const lines = sections.at(-1).lines;
    if (kind === 'ul' || kind === 'ol') lines.push(...value.map((v, i) => `${kind === 'ol' ? `${i + 1}.` : '-'} ${v}`));
    else if (kind === 'dl') lines.push(...value.map(([k, v]) => `${k}: ${v}`));
    else if (kind !== 'h2') lines.push(value);
  }
  return sections.flatMap((sec, i) => chunks(`policy:${p.slug}:${i + 1}`, sec.head ? `${p.title}: ${sec.head}` : p.title, p.path, sec.lines.join('\n'), {}, `${p.title}${sec.head ? ` — ${sec.head}` : ''}:`));
}

export function buildChunks() {
  const list = [...company(), ...faqs(), ...SERVICES.flatMap(service), ...addons(), ...shop(), ...POSTS.flatMap(guide), ...POLICIES.flatMap(policy)];
  const ids = new Set();
  for (const c of list) {
    if (ids.has(c.id)) throw new Error(`Duplicate knowledge chunk id ${c.id}`);
    ids.add(c.id);
  }
  return list.filter(c => c.text.trim());
}
