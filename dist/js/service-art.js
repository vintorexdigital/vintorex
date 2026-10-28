// A unique illustration for every service, drawn as inline SVG so it needs no
// image files. Each has its own alt text (aria-label) describing the scene.
import { esc } from './ui.js';

const W = (o = .9) => `fill="#fff" fill-opacity="${o}"`;
const L = (o = .55) => `fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
const bar = (x, y, w, o = .45) => `<rect x="${x}" y="${y}" width="${w}" height="8" rx="4" ${W(o)}/>`;
const card = (x, y, w, h, o = .92) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" ${W(o)}/>`;

// Scene drawings on a 400 x 300 canvas.
const SCENES = {
  browser: () => `${card(40, 40, 320, 220)}<rect x="40" y="40" width="320" height="34" rx="14" ${W(.35)}/><circle cx="64" cy="57" r="5" fill="currentColor"/><circle cx="82" cy="57" r="5" fill="currentColor" fill-opacity=".5"/>
    <rect x="60" y="92" width="170" height="14" rx="7" fill="currentColor"/><rect x="60" y="116" width="140" height="8" rx="4" fill="currentColor" fill-opacity=".35"/><rect x="60" y="136" width="90" height="26" rx="13" fill="currentColor"/>
    <rect x="60" y="182" width="80" height="54" rx="10" fill="currentColor" fill-opacity=".18"/><rect x="150" y="182" width="80" height="54" rx="10" fill="currentColor" fill-opacity=".18"/>
    <rect x="262" y="96" width="66" height="132" rx="12" ${W(1)} stroke="currentColor" stroke-width="3"/><rect x="274" y="112" width="42" height="8" rx="4" fill="currentColor"/><rect x="274" y="130" width="42" height="28" rx="6" fill="currentColor" fill-opacity=".25"/>`,
  store: () => `${card(36, 50, 200, 200)}${[0, 1, 2, 3].map(i => `<rect x="${52 + (i % 2) * 90}" y="${66 + Math.floor(i / 2) * 88}" width="78" height="72" rx="10" fill="currentColor" fill-opacity="${.14 + i * .05}"/><rect x="${58 + (i % 2) * 90}" y="${132 + Math.floor(i / 2) * 88 - 22}" width="40" height="8" rx="4" fill="currentColor"/>`).join('')}
    ${card(254, 70, 112, 78, .95)}<path d="M270 100h18l8 24h34l8-18" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="302" cy="134" r="4" fill="currentColor"/><circle cx="332" cy="134" r="4" fill="currentColor"/>
    ${card(254, 164, 112, 70, .95)}<circle cx="284" cy="199" r="16" fill="currentColor" fill-opacity=".2"/><path d="m276 199 6 6 12-13" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="308" y="186" width="44" height="8" rx="4" fill="currentColor"/><rect x="308" y="204" width="30" height="8" rx="4" fill="currentColor" fill-opacity=".35"/>`,
  phone: () => `<rect x="130" y="24" width="140" height="252" rx="26" ${W(.95)}/><rect x="176" y="34" width="48" height="7" rx="3.5" fill="currentColor" fill-opacity=".3"/>
    <rect x="146" y="60" width="108" height="64" rx="12" fill="currentColor" fill-opacity=".2"/><rect x="146" y="136" width="108" height="12" rx="6" fill="currentColor"/><rect x="146" y="158" width="76" height="8" rx="4" fill="currentColor" fill-opacity=".35"/>
    <rect x="146" y="180" width="50" height="50" rx="12" fill="currentColor" fill-opacity=".2"/><rect x="204" y="180" width="50" height="50" rx="12" fill="currentColor" fill-opacity=".2"/>
    <circle cx="160" cy="254" r="6" fill="currentColor"/><circle cx="200" cy="254" r="6" fill="currentColor" fill-opacity=".4"/><circle cx="240" cy="254" r="6" fill="currentColor" fill-opacity=".4"/>
    ${card(262, 70, 108, 44)}<circle cx="282" cy="92" r="9" fill="currentColor"/><rect x="298" y="84" width="60" height="7" rx="3.5" fill="currentColor"/><rect x="298" y="98" width="40" height="6" rx="3" fill="currentColor" fill-opacity=".35"/>`,
  search: () => `${card(40, 40, 320, 40)}<circle cx="64" cy="60" r="9" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="m71 67 7 7" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><rect x="92" y="55" width="130" height="10" rx="5" fill="currentColor" fill-opacity=".4"/>
    ${card(40, 98, 320, 62, .98)}<rect x="56" y="112" width="150" height="12" rx="6" fill="currentColor"/><rect x="56" y="132" width="250" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/><rect x="56" y="146" width="200" height="7" rx="3.5" fill="currentColor" fill-opacity=".25"/><path d="m330 112 6 12 13 2-10 9 3 13-12-7-12 7 3-13-10-9 13-2Z" fill="currentColor" transform="translate(-6 -6) scale(.9)"/>
    ${card(40, 172, 150, 88, .55)}${card(210, 172, 150, 88, .55)}<path d="M226 240l26-30 22 16 44-46" ${L(.95)}/><rect x="56" y="188" width="90" height="9" rx="4.5" ${W(.8)}/><rect x="56" y="206" width="110" height="7" rx="3.5" ${W(.5)}/><rect x="56" y="222" width="70" height="7" rx="3.5" ${W(.5)}/>`,
  feed: () => `${card(40, 36, 190, 228)}<circle cx="66" cy="62" r="13" fill="currentColor" fill-opacity=".35"/><rect x="88" y="54" width="80" height="8" rx="4" fill="currentColor"/><rect x="88" y="68" width="50" height="6" rx="3" fill="currentColor" fill-opacity=".35"/>
    <rect x="54" y="90" width="162" height="104" rx="12" fill="currentColor" fill-opacity=".2"/><path d="m118 120 36 22-36 22Z" fill="currentColor"/>
    <path d="M62 224c-8-10 6-20 12-10 6-10 20 0 12 10l-12 12Z" fill="currentColor"/><circle cx="116" cy="224" r="10" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M146 214l24 8-24 8Z" fill="currentColor" fill-opacity=".7"/>
    ${card(250, 56, 110, 70)}<path d="M268 108l16-24 14 14 16-26 20 36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${card(250, 144, 110, 54, .6)}<circle cx="276" cy="171" r="10" fill="currentColor" fill-opacity=".5"/><rect x="296" y="162" width="52" height="7" rx="3.5" fill="currentColor"/><rect x="296" y="176" width="36" height="6" rx="3" fill="currentColor" fill-opacity=".4"/>`,
  chart: () => `${card(36, 36, 328, 228)}${[70, 110, 90, 150, 130, 190].map((h, i) => `<rect x="${64 + i * 46}" y="${236 - h}" width="28" height="${h}" rx="7" fill="currentColor" fill-opacity="${.2 + i * .08}"/>`).join('')}<path d="M64 170l46-34 46 14 46-54 46 18 46-52" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="338" cy="48" r="0"/>
    <rect x="64" y="56" width="70" height="10" rx="5" fill="currentColor"/><rect x="64" y="74" width="46" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/>`,
  mail: () => `${card(40, 70, 220, 150)}<path d="m52 90 98 66 98-66" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="62" y="172" width="100" height="9" rx="4.5" fill="currentColor" fill-opacity=".4"/><rect x="62" y="190" width="70" height="7" rx="3.5" fill="currentColor" fill-opacity=".25"/>
    ${card(222, 40, 140, 66, .98)}<rect x="238" y="56" width="90" height="9" rx="4.5" fill="currentColor"/><rect x="238" y="74" width="64" height="7" rx="3.5" fill="currentColor" fill-opacity=".4"/><circle cx="342" cy="60" r="9" fill="currentColor"/>
    ${card(280, 168, 90, 84, .98)}<path d="M296 214a22 22 0 1 1 8 17l-14 4 4-12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="translate(6 -26)"/><path d="M262 200c16 0 6 40 24 40" ${L(.7)}/>`,
  brand: () => `${card(36, 40, 328, 220)}<rect x="56" y="60" width="104" height="104" rx="22" fill="currentColor"/><path d="m82 90 28 50 28-50" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    ${['currentColor', '#ff6b3d', '#f5a524', '#12a150'].map((c, i) => `<circle cx="${204 + i * 38}" cy="84" r="16" fill="${c}"/>`).join('')}
    <text x="204" y="150" font-size="44" font-weight="800" font-family="Plus Jakarta Sans, sans-serif" fill="currentColor">Aa</text><rect x="204" y="162" width="130" height="8" rx="4" fill="currentColor" fill-opacity=".35"/>
    <rect x="56" y="188" width="140" height="56" rx="12" fill="currentColor" fill-opacity=".16"/><rect x="214" y="188" width="130" height="56" rx="12" fill="currentColor" fill-opacity=".1"/>`,
  doc: () => `${card(70, 30, 190, 240)}<rect x="90" y="54" width="130" height="14" rx="7" fill="currentColor"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="90" y="${88 + i * 20}" width="${i % 3 === 2 ? 90 : 150}" height="7" rx="3.5" fill="currentColor" fill-opacity=".3"/>`).join('')}
    ${card(240, 70, 120, 120, .95)}${[0, 1, 2].map(i => `<circle cx="262" cy="${96 + i * 34}" r="9" fill="currentColor" fill-opacity=".2"/><path d="m257 ${96 + i * 34} 4 4 8-9" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="278" y="${92 + i * 34}" width="64" height="8" rx="4" fill="currentColor" fill-opacity=".45"/>`).join('')}
    <path d="M280 236l12-24 12 24M284 228h16" ${L(.9)}/>`,
  video: () => `<rect x="90" y="24" width="120" height="212" rx="20" ${W(.95)}/><path d="m128 106 44 28-44 28Z" fill="currentColor"/><rect x="104" y="198" width="92" height="8" rx="4" fill="currentColor" fill-opacity=".4"/><rect x="104" y="212" width="60" height="6" rx="3" fill="currentColor" fill-opacity=".25"/>
    ${card(232, 50, 130, 84, .55)}<rect x="244" y="64" width="90" height="10" rx="5" ${W(.9)}/><rect x="244" y="84" width="104" height="7" rx="3.5" ${W(.55)}/><rect x="244" y="100" width="70" height="7" rx="3.5" ${W(.55)}/>
    <rect x="40" y="252" width="320" height="30" rx="10" ${W(.4)}/><rect x="48" y="258" width="100" height="18" rx="6" ${W(.9)}/><rect x="154" y="258" width="70" height="18" rx="6" ${W(.65)}/><rect x="230" y="258" width="118" height="18" rx="6" ${W(.8)}/><path d="M154 246v40" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  cube: () => `<path d="M200 36 316 100v100L200 264 84 200V100Z" ${W(.92)}/><path d="M84 100l116 64 116-64M200 164v100" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="4" stroke-linejoin="round"/><path d="M200 36 316 100 200 164 84 100Z" fill="currentColor" fill-opacity=".14"/>
    <path d="M60 232h46M60 226v12M106 226v12" ${L(.9)}/><path d="M340 120v70M334 120h12M334 190h12" ${L(.9)}/><circle cx="200" cy="164" r="7" fill="currentColor"/>`,
  cloud: () => `<path d="M118 196a46 46 0 0 1-2-92 64 64 0 0 1 122-14 52 52 0 0 1 14 106Z" ${W(.95)}/><rect x="158" y="150" width="84" height="26" rx="8" fill="currentColor" fill-opacity=".22"/><rect x="158" y="184" width="84" height="26" rx="8" fill="currentColor" fill-opacity=".14"/><circle cx="174" cy="163" r="4" fill="currentColor"/><circle cx="174" cy="197" r="4" fill="currentColor"/>
    <path d="M200 236v26M120 262h160" ${L(.8)}/><path d="M318 190c12 0 20-6 20-6s8 6 20 6c0 24-10 38-20 46-10-8-20-22-20-46Z" ${W(.95)}/><path d="m330 208 6 6 12-12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  shield: () => `${card(40, 50, 220, 180)}<rect x="40" y="50" width="220" height="30" rx="14" ${W(.35)}/><rect x="60" y="102" width="120" height="12" rx="6" fill="currentColor"/>${[0, 1, 2].map(i => `<circle cx="70" cy="${142 + i * 26}" r="8" fill="currentColor" fill-opacity=".2"/><path d="m66 ${142 + i * 26} 3 3 6-7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="88" y="${138 + i * 26}" width="${110 - i * 14}" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/>`).join('')}
    <path d="M300 76c18 0 36-10 36-10s0 0 36 10c0 70-18 108-36 124-18-16-36-54-36-124Z" ${W(.95)} transform="translate(-32 18)"/><path d="m282 150 14 14 28-30" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  chat: () => `${card(40, 36, 210, 78, .95)}<circle cx="68" cy="68" r="15" fill="currentColor" fill-opacity=".25"/><rect x="92" y="56" width="130" height="9" rx="4.5" fill="currentColor"/><rect x="92" y="74" width="96" height="8" rx="4" fill="currentColor" fill-opacity=".35"/>
    <rect x="150" y="128" width="210" height="64" rx="16" fill="currentColor"/><rect x="168" y="146" width="150" height="9" rx="4.5" ${W(.9)}/><rect x="168" y="164" width="104" height="8" rx="4" ${W(.55)}/>
    <rect x="40" y="206" width="124" height="34" rx="17" ${W(.95)}/><rect x="174" y="206" width="124" height="34" rx="17" ${W(.55)}/><rect x="52" y="218" width="76" height="9" rx="4.5" fill="currentColor" fill-opacity=".5"/><circle cx="332" cy="226" r="20" ${W(.95)}/><path d="M324 226h16M332 218l8 8-8 8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  voice: () => `${card(40, 50, 320, 120)}${[18, 46, 28, 66, 40, 80, 34, 58, 24, 44, 20, 32].map((h, i) => `<rect x="${64 + i * 24}" y="${110 - h / 2}" width="10" height="${h}" rx="5" fill="currentColor" fill-opacity="${.35 + (i % 3) * .2}"/>`).join('')}
    ${card(40, 186, 150, 80, .95)}<circle cx="68" cy="214" r="13" fill="currentColor"/><path d="M63 213c2 6 6 10 12 12l3-4-5-3-2 2c-3-1-5-3-6-6l2-2-3-5Z" fill="#fff"/><rect x="92" y="204" width="76" height="8" rx="4" fill="currentColor"/><rect x="92" y="220" width="52" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/>
    ${card(210, 186, 150, 80, .95)}<rect x="226" y="204" width="86" height="8" rx="4" fill="currentColor"/><rect x="226" y="220" width="104" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/><circle cx="338" cy="206" r="10" fill="currentColor" fill-opacity=".2"/><path d="m333 206 4 4 7-8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  flow: () => `${[[36, 36], [36, 204], [264, 36], [264, 204]].map(([x, y]) => `<rect x="${x}" y="${y}" width="100" height="60" rx="14" ${W(.92)}/><rect x="${x + 14}" y="${y + 16}" width="56" height="9" rx="4.5" fill="currentColor"/><rect x="${x + 14}" y="${y + 34}" width="38" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/>`).join('')}
    <rect x="150" y="110" width="100" height="80" rx="18" ${W(1)}/><path d="M200 126l5 11 11 5-11 5-5 11-5-11-11-5 11-5Z" fill="currentColor" transform="translate(0 -2)"/><rect x="172" y="168" width="56" height="8" rx="4" fill="currentColor" fill-opacity=".4"/>
    <path d="M136 66h24c10 0 14 8 14 18M136 234h24c10 0 14-8 14-18M264 66h-24c-10 0-14 8-14 18M264 234h-24c-10 0-14-8-14-18" ${L(.85)}/>`,
  studio: () => `${card(40, 40, 150, 150)}<circle cx="86" cy="86" r="22" fill="currentColor" fill-opacity=".25"/><path d="M54 170l36-44 26 28 22-20 28 36Z" fill="currentColor" fill-opacity=".35"/>
    ${card(210, 40, 150, 90, .95)}<rect x="226" y="58" width="100" height="10" rx="5" fill="currentColor"/>${[0, 1, 2].map(i => `<rect x="226" y="${80 + i * 14}" width="${108 - i * 20}" height="6" rx="3" fill="currentColor" fill-opacity=".3"/>`).join('')}
    <rect x="210" y="146" width="150" height="100" rx="14" ${W(.55)}/><path d="m262 176 40 20-40 20Z" fill="#fff"/><rect x="40" y="206" width="150" height="40" rx="12" ${W(.92)}/><path d="M60 226l8-14 8 14-8 14Z" fill="currentColor"/><rect x="88" y="220" width="84" height="8" rx="4" fill="currentColor" fill-opacity=".4"/>
    <path d="M330 30l4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" fill="#fff"/>`,
  docs: () => `${[0, 1, 2].map(i => `<rect x="${44 + i * 22}" y="${40 + i * 18}" width="90" height="116" rx="12" ${W(.45 + i * .22)}/>`).join('')}<rect x="92" y="108" width="40" height="7" rx="3.5" fill="currentColor" fill-opacity=".5"/><rect x="92" y="124" width="52" height="7" rx="3.5" fill="currentColor" fill-opacity=".3"/>
    ${card(176, 70, 188, 44, .98)}<circle cx="200" cy="92" r="8" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="m206 98 6 6" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><rect x="224" y="87" width="110" height="9" rx="4.5" fill="currentColor" fill-opacity=".4"/>
    ${card(176, 130, 188, 112, .98)}<rect x="194" y="148" width="140" height="9" rx="4.5" fill="currentColor"/><rect x="194" y="166" width="120" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/><rect x="194" y="182" width="130" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/><rect x="194" y="206" width="54" height="20" rx="10" fill="currentColor" fill-opacity=".2"/><rect x="256" y="206" width="54" height="20" rx="10" fill="currentColor" fill-opacity=".2"/>`,
  workshop: () => `${card(40, 36, 230, 170)}<rect x="60" y="56" width="120" height="12" rx="6" fill="currentColor"/>${[0, 1, 2].map(i => `<circle cx="70" cy="${96 + i * 30}" r="8" fill="currentColor" fill-opacity=".2"/><path d="m66 ${96 + i * 30} 3 3 6-7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="88" y="${92 + i * 30}" width="${130 - i * 24}" height="8" rx="4" fill="currentColor" fill-opacity=".4"/>`).join('')}
    ${card(250, 100, 112, 80, .95)}<path d="M268 160l22-28 18 14 30-34" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M60 244h280" ${L(.5)}/>${[0, 1, 2, 3].map(i => `<circle cx="${70 + i * 86}" cy="244" r="12" ${W(i < 3 ? 1 : .6)}/>`).join('')}<path d="M156 232l-4-12M242 232l-4-12" stroke="none"/>`,
  cite: () => `${card(40, 36, 320, 130, .98)}<path d="M62 70l8 16 18 3-13 12 3 18-16-9-16 9 3-18-13-12 18-3Z" fill="currentColor" transform="translate(6 -2) scale(.8)"/><rect x="116" y="62" width="200" height="11" rx="5.5" fill="currentColor"/><rect x="116" y="82" width="220" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/><rect x="116" y="98" width="180" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/><rect x="116" y="114" width="200" height="7" rx="3.5" fill="currentColor" fill-opacity=".35"/>
    ${[0, 1, 2].map(i => `<rect x="${60 + i * 98}" y="136" width="88" height="20" rx="10" fill="currentColor" fill-opacity="${i === 0 ? .85 : .2}"/>`).join('')}
    ${card(40, 184, 320, 76, .6)}<rect x="60" y="204" width="110" height="9" rx="4.5" ${W(.9)}/><rect x="60" y="222" width="260" height="14" rx="7" ${W(.35)}/><rect x="60" y="222" width="190" height="14" rx="7" ${W(.95)}/>`,
};

// alt = the image's text alternative. chips = three short capability labels.
export const ART = {
  'web-design': { scene: 'browser', alt: 'Website design mock-up showing a business home page on a desktop screen next to the same page on a phone', chips: ['Mobile-first', 'SEO-ready', 'Fast pages'] },
  ecommerce: { scene: 'store', alt: 'Online store mock-up with product cards, a shopping cart and a payment confirmation', chips: ['UPI & cards', 'GST invoices', 'Shipping'] },
  'mobile-app': { scene: 'phone', alt: 'Smartphone showing a business mobile app with a banner, menu tiles, navigation dots and a notification', chips: ['Android + iOS', 'Push alerts', 'Admin panel'] },
  seo: { scene: 'search', alt: 'Search results page where a business listing appears at the top with a star, beside a rising ranking chart', chips: ['Local SEO', 'Rankings', 'Content'] },
  'social-media': { scene: 'feed', alt: 'Social media feed with a video post, a like and share row, and an engagement graph', chips: ['Posts', 'Reels', 'Community'] },
  advertising: { scene: 'chart', alt: 'Advertising dashboard with a bar chart of campaign results and a rising conversion line', chips: ['Google Ads', 'Meta Ads', 'Tracking'] },
  'email-marketing': { scene: 'mail', alt: 'Email envelope with message cards and a WhatsApp chat bubble showing automated campaigns', chips: ['Newsletters', 'WhatsApp', 'Automations'] },
  branding: { scene: 'brand', alt: 'Brand identity board with a logo mark, four colour swatches, a typography sample and stationery shapes', chips: ['Logo', 'Colours', 'Brand book'] },
  'content-writing': { scene: 'doc', alt: 'Article page with a headline and paragraphs next to a keyword checklist with ticks', chips: ['Keywords', 'Articles', 'Refreshes'] },
  video: { scene: 'video', alt: 'Vertical video reel with a play button above an editing timeline of clips', chips: ['Reels', 'Captions', 'Brand film'] },
  'industrial-design': { scene: 'cube', alt: '3D render of an industrial product shown as a shaded block with measurement lines on its sides', chips: ['3D renders', 'Catalogues', 'CAD'] },
  cloud: { scene: 'cloud', alt: 'Cloud containing two server units with a protective shield and a connection line to a website', chips: ['Hosting', 'Backups', 'Monitoring'] },
  analytics: { scene: 'chart', alt: 'Analytics dashboard with bars, a trend line and headline figures for traffic and conversions', chips: ['GA4', 'Dashboards', 'Funnels'] },
  maintenance: { scene: 'shield', alt: 'Website window with a maintenance checklist of ticked tasks and a security shield with a check mark', chips: ['Updates', 'Backups', 'Security'] },
  'ai-chatbot': { scene: 'chat', alt: 'Chat window where an AI assistant answers a customer question, with a button to reach a person', chips: ['Website + WhatsApp', 'Handover', 'Lead capture'] },
  'ai-voice': { scene: 'voice', alt: 'Sound waveform of a phone call above a call card and a booking confirmation with a tick', chips: ['Inbound', 'Outbound', 'Summaries'] },
  'ai-automation': { scene: 'flow', alt: 'Workflow diagram with five connected steps linking a form, an AI step, an approval and a CRM', chips: ['Triggers', 'AI steps', 'Approvals'] },
  'ai-content': { scene: 'studio', alt: 'Creative studio board with a photo post, an article draft, a video frame and a sparkle', chips: ['Posts', 'Videos', 'Articles'] },
  'ai-knowledge': { scene: 'docs', alt: 'Stack of documents feeding a search box that returns an answer with source labels', chips: ['Citations', 'Access control', 'Actions'] },
  'ai-training': { scene: 'workshop', alt: 'Workshop whiteboard with a checklist and a growth chart above a four-step roadmap timeline', chips: ['Workshops', 'Prompts', 'Roadmap'] },
  'ai-geo': { scene: 'cite', alt: 'AI answer card with a star, source tags and a visibility meter for a business', chips: ['AI answers', 'Entities', 'Citations'] },
};

const HUE = { build: 255, grow: 155, brand: 18, tech: 205, ai: 285 };

// Image block for a service page header.
export function serviceArt(s, index = 0) {
  const a = ART[s.id];
  if (!a) return '';
  const h = ((HUE[s.cat] ?? 255) + (index * 11) % 36) % 360;
  const id = 'sa-' + s.id;
  return `<figure class="service-art" style="--h:${h}">
    <svg viewBox="0 0 400 300" role="img" aria-labelledby="${id}-t" preserveAspectRatio="xMidYMid slice">
      <title id="${id}-t">${esc(a.alt)}</title>
      <defs><linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 78% 58%)"/><stop offset="1" stop-color="hsl(${(h + 45) % 360} 70% 30%)"/></linearGradient></defs>
      <rect width="400" height="300" fill="url(#${id}-g)"/><circle cx="360" cy="30" r="90" fill="#fff" fill-opacity=".08"/><circle cx="20" cy="290" r="80" fill="#fff" fill-opacity=".07"/>
      <g style="color:hsl(${h} 70% 28%)">${SCENES[a.scene]()}</g>
    </svg>
    <figcaption>${a.chips.map(c => `<span>${esc(c)}</span>`).join('')}</figcaption>
  </figure>`;
}

// Compact visual illustration banner for service cards.
export function serviceCardArt(s, index = 0) {
  const a = ART[s.id];
  if (!a) return '';
  const h = ((HUE[s.cat] ?? 255) + (index * 13) % 40) % 360;
  const id = 'sc-' + s.id;
  return `<div class="svc-thumb" style="--h:${h}">
    <svg viewBox="0 0 400 240" role="img" aria-label="${esc(a.alt)}" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${h} 76% 56%)"/>
          <stop offset="100%" stop-color="hsl(${(h + 45) % 360} 70% 30%)"/>
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#${id}-g)"/>
      <circle cx="360" cy="20" r="85" fill="#fff" fill-opacity=".09"/>
      <circle cx="30" cy="230" r="75" fill="#fff" fill-opacity=".07"/>
      <g transform="translate(10, -20) scale(0.95)" style="color:hsl(${h} 70% 28%)">
        ${SCENES[a.scene]()}
      </g>
    </svg>
    <div class="svc-thumb-overlay"></div>
    <span class="svc-cat-tag">${esc(a.chips[0])}</span>
  </div>`;
}

