// Generates high quality, standalone SVG images for services, portfolio work,
// shop products, hero, about studio, and Open Graph previews.
// Run: node scripts/generate-images.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG_DIR = join(ROOT, 'dist', 'images');

// Import data
const { SERVICES, PRODUCTS, BUSINESS } = await import('../dist/js/data.js');
const { ART } = await import('../dist/js/service-art.js');
const { WORK_PROJECTS } = await import('../dist/js/work-art.js');

await mkdir(join(IMG_DIR, 'services'), { recursive: true });
await mkdir(join(IMG_DIR, 'work'), { recursive: true });
await mkdir(join(IMG_DIR, 'shop'), { recursive: true });

const HUE = { build: 255, grow: 155, brand: 18, tech: 205, ai: 285 };

// 1. Generate Open Graph Cover (1200 x 630)
const ogCoverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="og-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#19123b"/>
      <stop offset="50%" stop-color="#0f0c24"/>
      <stop offset="100%" stop-color="#060410"/>
    </linearGradient>
    <linearGradient id="og-brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6d4dff"/>
      <stop offset="100%" stop-color="#ff6b3d"/>
    </linearGradient>
    <linearGradient id="og-mesh" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4b2bd6" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#ff6b3d" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="630" fill="url(#og-bg)"/>
  <circle cx="1000" cy="150" r="320" fill="#6d4dff" fill-opacity="0.18" filter="url(#glow)"/>
  <circle cx="200" cy="550" r="280" fill="#ff6b3d" fill-opacity="0.14" filter="url(#glow)"/>

  <!-- Subtle grid lines -->
  <g stroke="#ffffff" stroke-opacity="0.04" stroke-width="1">
    <line x1="0" y1="105" x2="1200" y2="105"/><line x1="0" y1="210" x2="1200" y2="210"/>
    <line x1="0" y1="315" x2="1200" y2="315"/><line x1="0" y1="420" x2="1200" y2="420"/><line x1="0" y1="525" x2="1200" y2="525"/>
    <line x1="150" y1="0" x2="150" y2="630"/><line x1="300" y1="0" x2="300" y2="630"/>
    <line x1="450" y1="0" x2="450" y2="630"/><line x1="600" y1="0" x2="600" y2="630"/>
    <line x1="750" y1="0" x2="750" y2="630"/><line x1="900" y1="0" x2="900" y2="630"/><line x1="1050" y1="0" x2="1050" y2="630"/>
  </g>

  <!-- Header Logo & Brand -->
  <g transform="translate(80, 80)">
    <rect width="64" height="64" rx="18" fill="#4b2bd6"/>
    <path d="M16 18 L32 48 L48 18" fill="none" stroke="#ffffff" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="86" y="42" font-size="34" font-weight="800" fill="#ffffff" font-family="'Plus Jakarta Sans', system-ui, sans-serif">Vintorex</text>
    <text x="86" y="60" font-size="16" font-weight="600" fill="#9ca3af" font-family="'Plus Jakarta Sans', system-ui, sans-serif">Digital Solutions · Coimbatore</text>
  </g>

  <!-- Hero Headline -->
  <text x="80" y="240" font-size="56" font-weight="800" fill="#ffffff" font-family="'Plus Jakarta Sans', system-ui, sans-serif" letter-spacing="-1">
    Turning data into dollars.
  </text>
  <text x="80" y="300" font-size="24" font-weight="500" fill="#c4b5fd" font-family="'Plus Jakarta Sans', system-ui, sans-serif">
    Web Development, E-Commerce, SEO, Ads &amp; AI Automation in Coimbatore
  </text>

  <!-- Feature Pills -->
  <g transform="translate(80, 360)">
    <rect width="210" height="48" rx="24" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.15"/>
    <circle cx="28" cy="24" r="8" fill="#10b981"/>
    <text x="48" y="30" font-size="16" font-weight="700" fill="#ffffff" font-family="sans-serif">21+ Fixed Services</text>

    <rect x="230" width="220" height="48" rx="24" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.15"/>
    <circle cx="258" cy="24" r="8" fill="#f59e0b"/>
    <text x="278" y="30" font-size="16" font-weight="700" fill="#ffffff" font-family="sans-serif">15–40% Below Metro</text>

    <rect x="470" width="210" height="48" rx="24" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.15"/>
    <circle cx="498" cy="24" r="8" fill="#6d4dff"/>
    <text x="518" y="30" font-size="16" font-weight="700" fill="#ffffff" font-family="sans-serif">18% GST Compliant</text>
  </g>

  <!-- Live Dashboard Mockup Window on Right -->
  <g transform="translate(730, 160)">
    <rect width="390" height="380" rx="18" fill="#130e28" stroke="#2d2254" stroke-width="2"/>
    <rect width="390" height="44" rx="18" fill="#1c163b"/>
    <circle cx="26" cy="22" r="5" fill="#ef4444"/>
    <circle cx="42" cy="22" r="5" fill="#f59e0b"/>
    <circle cx="58" cy="22" r="5" fill="#10b981"/>
    <rect x="80" y="12" width="200" height="20" rx="10" fill="#0c0919"/>
    <text x="96" y="26" font-size="10" fill="#9ca3af" font-family="monospace">vintorex.com/dashboard</text>

    <!-- Stat boxes inside mockup -->
    <rect x="24" y="66" width="104" height="64" rx="10" fill="#1c163b"/>
    <text x="36" y="88" font-size="10" fill="#9ca3af" font-family="sans-serif">Traffic Growth</text>
    <text x="36" y="116" font-size="20" font-weight="bold" fill="#10b981" font-family="sans-serif">+182%</text>

    <rect x="142" y="66" width="104" height="64" rx="10" fill="#1c163b"/>
    <text x="154" y="88" font-size="10" fill="#9ca3af" font-family="sans-serif">Leads / Mo</text>
    <text x="154" y="116" font-size="20" font-weight="bold" fill="#ffffff" font-family="sans-serif">146</text>

    <rect x="260" y="66" width="104" height="64" rx="10" fill="#1c163b"/>
    <text x="272" y="88" font-size="10" fill="#9ca3af" font-family="sans-serif">Cost / Lead</text>
    <text x="272" y="116" font-size="20" font-weight="bold" fill="#fbbf24" font-family="sans-serif">₹84</text>

    <!-- Bar chart -->
    <g transform="translate(24, 150)">
      <rect x="0" y="100" width="18" height="50" rx="4" fill="#4b2bd6"/>
      <rect x="28" y="80" width="18" height="70" rx="4" fill="#4b2bd6"/>
      <rect x="56" y="85" width="18" height="65" rx="4" fill="#4b2bd6"/>
      <rect x="84" y="55" width="18" height="95" rx="4" fill="#6d4dff"/>
      <rect x="112" y="62" width="18" height="88" rx="4" fill="#6d4dff"/>
      <rect x="140" y="35" width="18" height="115" rx="4" fill="#6d4dff"/>
      <rect x="168" y="20" width="18" height="130" rx="4" fill="#ff6b3d"/>
      <rect x="196" y="30" width="18" height="120" rx="4" fill="#ff6b3d"/>
      <rect x="224" y="10" width="18" height="140" rx="4" fill="#ff6b3d"/>
      <rect x="252" y="5" width="18" height="145" rx="4" fill="#10b981"/>
      <rect x="280" y="15" width="18" height="135" rx="4" fill="#10b981"/>
      <rect x="308" y="0" width="18" height="150" rx="4" fill="#10b981"/>
      <line x1="0" y1="150" x2="340" y2="150" stroke="#2d2254" stroke-width="1.5"/>
    </g>

    <!-- Floating partner pill inside mockup -->
    <rect x="24" y="320" width="340" height="38" rx="8" fill="#1c163b" stroke="#372d66" stroke-width="1"/>
    <circle cx="44" cy="339" r="6" fill="#10b981"/>
    <text x="60" y="344" font-size="12" font-weight="bold" fill="#ffffff" font-family="sans-serif">Google Partner &amp; Meta Certified</text>
    <text x="270" y="344" font-size="12" fill="#10b981" font-family="sans-serif">● Live Sync</text>
  </g>

  <!-- Footer Location & URL -->
  <text x="80" y="570" font-size="16" fill="#9ca3af" font-family="sans-serif">📍 38 Bankers Colony Phase 2, Cheran Ma Nagar, Coimbatore 641035</text>
  <text x="1120" y="570" text-anchor="end" font-size="18" font-weight="700" fill="#6d4dff" font-family="sans-serif">https://vintorex.com</text>
</svg>`;

await writeFile(join(IMG_DIR, 'og-cover.svg'), ogCoverSvg, 'utf8');

// 2. Generate Hero Dashboard Graphic (800 x 600)
const heroDashboardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="hd-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#181335"/>
      <stop offset="100%" stop-color="#0a0817"/>
    </linearGradient>
    <linearGradient id="hd-bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff6b3d"/>
      <stop offset="100%" stop-color="#4b2bd6"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" rx="20" fill="url(#hd-bg)"/>
  <!-- Topbar -->
  <rect width="800" height="54" rx="20" fill="#201a42"/>
  <circle cx="36" cy="27" r="6" fill="#ef4444"/>
  <circle cx="56" cy="27" r="6" fill="#f59e0b"/>
  <circle cx="76" cy="27" r="6" fill="#10b981"/>
  <rect x="110" y="14" width="320" height="26" rx="13" fill="#100c22"/>
  <text x="130" y="32" font-size="12" fill="#9ca3af" font-family="monospace">app.vintorex.com/overview · Client Portal</text>
  <circle cx="750" cy="27" r="10" fill="#4b2bd6"/>

  <!-- Metrics row -->
  <g transform="translate(36, 80)">
    <rect width="224" height="110" rx="14" fill="#1e183e" stroke="#2d245c" stroke-width="1.5"/>
    <text x="24" y="36" font-size="14" fill="#9ca3af" font-family="sans-serif">Organic Search Traffic</text>
    <text x="24" y="74" font-size="32" font-weight="bold" fill="#10b981" font-family="sans-serif">+182.4%</text>
    <text x="24" y="94" font-size="12" fill="#34d399" font-family="sans-serif">↑ 14 Page-1 Google Keywords</text>

    <rect x="250" width="224" height="110" rx="14" fill="#1e183e" stroke="#2d245c" stroke-width="1.5"/>
    <text x="274" y="36" font-size="14" fill="#9ca3af" font-family="sans-serif">Inbound Leads This Month</text>
    <text x="274" y="74" font-size="32" font-weight="bold" fill="#ffffff" font-family="sans-serif">146</text>
    <text x="274" y="94" font-size="12" fill="#60a5fa" font-family="sans-serif">WhatsApp + Web Forms + Calls</text>

    <rect x="500" width="224" height="110" rx="14" fill="#1e183e" stroke="#2d245c" stroke-width="1.5"/>
    <text x="524" y="36" font-size="14" fill="#9ca3af" font-family="sans-serif">Acquisition Cost Per Lead</text>
    <text x="524" y="74" font-size="32" font-weight="bold" fill="#fbbf24" font-family="sans-serif">₹84</text>
    <text x="524" y="94" font-size="12" fill="#fcd34d" font-family="sans-serif">40% Below Industry Average</text>
  </g>

  <!-- Big Growth Chart -->
  <g transform="translate(36, 214)">
    <rect width="728" height="260" rx="14" fill="#15102e" stroke="#261e4e" stroke-width="1.5"/>
    <text x="24" y="34" font-size="15" font-weight="bold" fill="#ffffff" font-family="sans-serif">Revenue &amp; Qualified Lead Velocity (12 Months)</text>
    
    <!-- Chart Bars -->
    <g transform="translate(40, 60)">
      ${[25, 32, 28, 44, 40, 56, 68, 64, 78, 86, 82, 100].map((v, i) => `
        <rect x="${i * 54}" y="${150 - v * 1.4}" width="28" height="${v * 1.4}" rx="6" fill="url(#hd-bar)"/>
        <text x="${i * 54 + 14}" y="170" text-anchor="middle" font-size="10" fill="#9ca3af" font-family="sans-serif">M${i + 1}</text>
      `).join('')}
      <line x1="0" y1="150" x2="648" y2="150" stroke="#332a61" stroke-width="1"/>
    </g>
  </g>

  <!-- Footer Status Strip -->
  <g transform="translate(36, 498)">
    <rect width="728" height="66" rx="14" fill="#1d173c"/>
    <circle cx="28" cy="33" r="8" fill="#10b981"/>
    <text x="48" y="30" font-size="14" font-weight="bold" fill="#ffffff" font-family="sans-serif">SEO &amp; Growth Retainer: Active</text>
    <text x="48" y="48" font-size="12" fill="#9ca3af" font-family="sans-serif">Next automated report delivery in 3 days · Transparent Razorpay billing</text>
    <rect x="560" y="16" width="144" height="34" rx="8" fill="#4b2bd6"/>
    <text x="590" y="38" font-size="12" font-weight="bold" fill="#ffffff" font-family="sans-serif">View Invoices →</text>
  </g>
</svg>`;

await writeFile(join(IMG_DIR, 'hero-dashboard.svg'), heroDashboardSvg, 'utf8');

// 3. Generate About Studio Graphic (920 x 600)
const aboutStudioSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 600" width="920" height="600">
  <defs>
    <linearGradient id="as-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#211746"/>
      <stop offset="50%" stop-color="#130d2a"/>
      <stop offset="100%" stop-color="#080512"/>
    </linearGradient>
    <linearGradient id="screen-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4b2bd6"/>
      <stop offset="100%" stop-color="#ff6b3d"/>
    </linearGradient>
  </defs>
  <rect width="920" height="600" rx="20" fill="url(#as-bg)"/>
  <circle cx="750" cy="150" r="220" fill="#6d4dff" fill-opacity="0.15"/>
  <circle cx="160" cy="480" r="180" fill="#ff6b3d" fill-opacity="0.12"/>

  <!-- Studio Wall Art / Certificates -->
  <rect x="100" y="60" width="160" height="100" rx="8" fill="#1a1236" stroke="#332566" stroke-width="2"/>
  <text x="120" y="95" font-size="14" font-weight="bold" fill="#fbbf24" font-family="sans-serif">Google Partner</text>
  <text x="120" y="115" font-size="11" fill="#c4b5fd" font-family="sans-serif">Certified Agency 2026</text>
  <circle cx="225" cy="120" r="16" fill="#fbbf24" fill-opacity="0.2"/>
  <path d="M220 120 L224 124 L232 115" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>

  <rect x="290" y="60" width="160" height="100" rx="8" fill="#1a1236" stroke="#332566" stroke-width="2"/>
  <text x="310" y="95" font-size="14" font-weight="bold" fill="#38bdf8" font-family="sans-serif">Meta Certified</text>
  <text x="310" y="115" font-size="11" fill="#c4b5fd" font-family="sans-serif">Performance Marketing</text>
  <circle cx="415" cy="120" r="16" fill="#38bdf8" fill-opacity="0.2"/>
  <path d="M410 120 L414 124 L422 115" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Desk Surface -->
  <rect x="80" y="440" width="760" height="24" rx="10" fill="#2d2258"/>
  <rect x="140" y="464" width="30" height="110" rx="6" fill="#1c1538"/>
  <rect x="750" y="464" width="30" height="110" rx="6" fill="#1c1538"/>

  <!-- Center Ultrawide Display -->
  <rect x="220" y="180" width="480" height="250" rx="16" fill="#0c0919" stroke="#3c2f6d" stroke-width="3"/>
  <rect x="435" y="430" width="50" height="24" fill="#231a44"/>
  <rect x="390" y="450" width="140" height="8" rx="4" fill="#3c2f6d"/>

  <!-- Code Editor Window (Left Screen Area) -->
  <rect x="240" y="200" width="210" height="210" rx="8" fill="#16102e"/>
  <rect x="256" y="220" width="100" height="10" rx="5" fill="#4b2bd6"/>
  <rect x="256" y="244" width="150" height="7" rx="3.5" fill="#10b981"/>
  <rect x="256" y="262" width="120" height="7" rx="3.5" fill="#f59e0b"/>
  <rect x="256" y="280" width="160" height="7" rx="3.5" fill="#c4b5fd"/>
  <rect x="256" y="298" width="90" height="7" rx="3.5" fill="#38bdf8"/>
  <rect x="256" y="316" width="140" height="7" rx="3.5" fill="#ec4899"/>
  <rect x="256" y="334" width="110" height="7" rx="3.5" fill="#a78bfa"/>
  <rect x="256" y="352" width="130" height="7" rx="3.5" fill="#10b981"/>

  <!-- Analytics View (Right Screen Area) -->
  <rect x="470" y="200" width="210" height="210" rx="8" fill="#191333"/>
  <text x="490" y="230" font-size="14" font-weight="bold" fill="#ffffff" font-family="sans-serif">Live Campaign ROI</text>
  <path d="M490 340 L530 300 L560 315 L600 260 L650 240" fill="none" stroke="#ff6b3d" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="650" cy="240" r="5" fill="#ff6b3d"/>
  <text x="490" y="380" font-size="18" font-weight="bold" fill="#10b981" font-family="sans-serif">+320% Qualified Leads</text>

  <!-- Laptop on Left Desk -->
  <rect x="110" y="330" width="130" height="90" rx="10" fill="#1b143a" stroke="#372a63" stroke-width="2"/>
  <rect x="120" y="340" width="110" height="70" rx="5" fill="#251b4e"/>
  <path d="M90 420 L260 420 L245 432 L105 432 Z" fill="#372a63"/>

  <!-- Coffee Mug & Plant on Right Desk -->
  <rect x="730" y="375" width="26" height="34" rx="6" fill="#fbbf24"/>
  <path d="M756 385 C765 385 765 400 756 400" fill="none" stroke="#fbbf24" stroke-width="3"/>

  <!-- Studio Location Pill -->
  <g transform="translate(300, 510)">
    <rect width="320" height="46" rx="23" fill="#0a0715" stroke="#4b2bd6" stroke-width="2"/>
    <circle cx="28" cy="23" r="10" fill="#4b2bd6"/>
    <text x="48" y="28" font-size="14" font-weight="bold" fill="#ffffff" font-family="sans-serif">Cheran Ma Nagar, Coimbatore HQ</text>
  </g>
</svg>`;

await writeFile(join(IMG_DIR, 'about-studio.svg'), aboutStudioSvg, 'utf8');

// 4. Generate Audit Scorecard Graphic (600 x 400)
const auditScorecardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="as-card-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#141126"/>
      <stop offset="100%" stop-color="#0a0815"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" rx="18" fill="url(#as-card-bg)" stroke="#2b234d" stroke-width="2"/>

  <!-- Header -->
  <rect width="600" height="50" rx="18" fill="#1b1633"/>
  <circle cx="30" cy="25" r="6" fill="#10b981"/>
  <text x="46" y="30" font-size="14" font-weight="bold" fill="#ffffff" font-family="sans-serif">15-Point Digital Health Audit</text>
  <rect x="460" y="12" width="115" height="26" rx="13" fill="#4b2bd6"/>
  <text x="478" y="29" font-size="11" font-weight="bold" fill="#ffffff" font-family="sans-serif">Free Report</text>

  <!-- Big Ring Gauge -->
  <g transform="translate(60, 90)">
    <circle cx="70" cy="70" r="56" fill="none" stroke="#251f42" stroke-width="12"/>
    <circle cx="70" cy="70" r="56" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="351" stroke-dashoffset="35" stroke-linecap="round"/>
    <text x="70" y="68" text-anchor="middle" font-size="34" font-weight="800" fill="#ffffff" font-family="sans-serif">98</text>
    <text x="70" y="88" text-anchor="middle" font-size="11" font-weight="bold" fill="#10b981" font-family="sans-serif">PERFORMANCE</text>
    <text x="70" y="160" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff" font-family="sans-serif">Top 2% of Coimbatore Sites</text>
  </g>

  <!-- Metric Breakdown Cards -->
  <g transform="translate(260, 80)">
    <rect width="300" height="60" rx="10" fill="#1c1736" stroke="#2c2250" stroke-width="1"/>
    <circle cx="28" cy="30" r="12" fill="#10b981" fill-opacity="0.2"/>
    <path d="M22 30 L26 34 L34 25" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
    <text x="50" y="26" font-size="13" font-weight="bold" fill="#ffffff" font-family="sans-serif">Core Web Vitals</text>
    <text x="50" y="44" font-size="11" fill="#9ca3af" font-family="sans-serif">0.8s LCP · Instant Mobile Load</text>
    <text x="270" y="34" text-anchor="end" font-size="14" font-weight="bold" fill="#10b981" font-family="sans-serif">Good</text>

    <rect y="74" width="300" height="60" rx="10" fill="#1c1736" stroke="#2c2250" stroke-width="1"/>
    <circle cx="28" cy="104" r="12" fill="#10b981" fill-opacity="0.2"/>
    <path d="M22 104 L26 108 L34 99" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
    <text x="50" y="100" font-size="13" font-weight="bold" fill="#ffffff" font-family="sans-serif">Google Local SEO Pack</text>
    <text x="50" y="118" font-size="11" fill="#9ca3af" font-family="sans-serif">Rank #1 on Google Maps CBE</text>
    <text x="270" y="108" text-anchor="end" font-size="14" font-weight="bold" fill="#10b981" font-family="sans-serif">Top 3</text>

    <rect y="148" width="300" height="60" rx="10" fill="#1c1736" stroke="#2c2250" stroke-width="1"/>
    <circle cx="28" cy="178" r="12" fill="#10b981" fill-opacity="0.2"/>
    <path d="M22 178 L26 182 L34 173" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
    <text x="50" y="174" font-size="13" font-weight="bold" fill="#ffffff" font-family="sans-serif">Security &amp; GST Invoicing</text>
    <text x="50" y="192" font-size="11" fill="#9ca3af" font-family="sans-serif">HTTPS SSL + Input Tax Credit</text>
    <text x="270" y="182" text-anchor="end" font-size="14" font-weight="bold" fill="#10b981" font-family="sans-serif">Grade A+</text>
  </g>

  <!-- Bottom CTA Footer -->
  <g transform="translate(30, 320)">
    <rect width="540" height="54" rx="12" fill="#1b1536"/>
    <text x="20" y="32" font-size="13" fill="#c4b5fd" font-family="sans-serif">Claim your business report in under 2 minutes.</text>
    <rect x="380" y="10" width="144" height="34" rx="8" fill="#10b981"/>
    <text x="408" y="32" font-size="12" font-weight="bold" fill="#ffffff" font-family="sans-serif">Request Audit →</text>
  </g>
</svg>`;

await writeFile(join(IMG_DIR, 'audit-scorecard.svg'), auditScorecardSvg, 'utf8');

// 5. Generate Leadership Portrait Illustration (400 x 400)
const leaderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="rk-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4b2bd6"/>
      <stop offset="100%" stop-color="#ff6b3d"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="30" fill="url(#rk-bg)"/>
  <!-- Stylized avatar silhouette with monogram -->
  <circle cx="200" cy="150" r="70" fill="#ffffff" fill-opacity="0.95"/>
  <path d="M100 340 C100 250 150 240 200 240 C250 240 300 250 300 340 Z" fill="#ffffff" fill-opacity="0.95"/>
  <text x="200" y="165" text-anchor="middle" font-size="44" font-weight="800" fill="#4b2bd6" font-family="sans-serif">RK</text>
  <!-- Badges -->
  <rect x="70" y="330" width="260" height="36" rx="18" fill="#130e28"/>
  <text x="200" y="353" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff" font-family="sans-serif">Ranjith Kumar · Vintorex</text>
</svg>`;

await writeFile(join(IMG_DIR, 'ranjith-kumar.svg'), leaderSvg, 'utf8');

// 6. Generate Standalone High-Res SVGs for All 21 Services
const { serviceCardArt } = await import('../dist/js/service-art.js');
for (const s of SERVICES) {
  const artInfo = ART[s.id];
  const h = HUE[s.cat] ?? 255;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <linearGradient id="g-${s.id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${h} 76% 56%)"/>
        <stop offset="100%" stop-color="hsl(${(h + 45) % 360} 70% 30%)"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#g-${s.id})"/>
    <circle cx="720" cy="40" r="170" fill="#ffffff" fill-opacity="0.08"/>
    <circle cx="60" cy="460" r="150" fill="#ffffff" fill-opacity="0.07"/>
    <g transform="translate(100, 50) scale(1.5)" style="color:hsl(${h} 70% 28%)">
      ${serviceCardArt(s).match(/<g[^>]*>([\s\S]*?)<\/g>/)?.[1] || ''}
    </g>
    <!-- Service Name Label -->
    <rect x="40" y="420" width="720" height="50" rx="14" fill="#0b0817" fill-opacity="0.75"/>
    <text x="64" y="452" font-size="20" font-weight="bold" fill="#ffffff" font-family="sans-serif">${s.name} · Vintorex Coimbatore</text>
    <text x="736" y="452" text-anchor="end" font-size="15" font-weight="bold" fill="#10b981" font-family="sans-serif">₹${s.tiers[0].price.toLocaleString('en-IN')}+</text>
  </svg>`;
  await writeFile(join(IMG_DIR, 'services', `${s.id}.svg`), svg, 'utf8');
}

// 7. Generate Standalone SVGs for All 4 Work Projects
for (const w of WORK_PROJECTS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" width="960" height="640">
    <g transform="scale(2)">
      ${w.drawSvg().replace(/^<svg[^>]*>|<\/svg>$/g, '')}
    </g>
  </svg>`;
  await writeFile(join(IMG_DIR, 'work', `${w.id}.svg`), svg, 'utf8');
}

// 8. Generate Standalone SVGs for All 10 Shop Products
for (const p of PRODUCTS) {
  const h = p.hue;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="600" height="420">
    <defs>
      <linearGradient id="gp-${p.id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${h} 80% 62%)"/>
        <stop offset="100%" stop-color="hsl(${(h + 55) % 360} 70% 32%)"/>
      </linearGradient>
    </defs>
    <rect width="600" height="420" fill="url(#gp-${p.id})"/>
    <g transform="scale(3)">
      <rect x="14" y="10" width="172" height="120" rx="8" fill="#1e1832" stroke="#4a3e72" stroke-width="2"/>
      <rect x="24" y="18" width="152" height="104" rx="4" fill="#fafafa"/>
      <rect x="32" y="24" width="136" height="92" rx="3" fill="url(#gp-${p.id})"/>
      <circle cx="${60 + (h % 50)}" cy="${45 + (h % 30)}" r="${16 + (h % 10)}" fill="#fff" fill-opacity="0.8"/>
      <circle cx="${130 - (h % 40)}" cy="${65 + (h % 20)}" r="${24 + (h % 12)}" fill="hsl(${(h + 120) % 360} 90% 70% / 0.5)"/>
      <path d="M32 96 Q 70 ${65 + (h % 25)} 100 85 T 168 82 V116 H32 Z" fill="hsl(${(h + 40) % 360} 70% 25% / 0.7)"/>
      <path d="M32 104 Q 90 85 130 98 T 168 95 V116 H32 Z" fill="hsl(${h} 60% 15% / 0.85)"/>
    </g>
    <rect x="30" y="350" width="540" height="46" rx="12" fill="#0d0a1b" fill-opacity="0.85"/>
    <text x="50" y="380" font-size="16" font-weight="bold" fill="#ffffff" font-family="sans-serif">${p.name}</text>
    <text x="550" y="380" text-anchor="end" font-size="16" font-weight="bold" fill="#fbbf24" font-family="sans-serif">₹${p.price}</text>
  </svg>`;
  await writeFile(join(IMG_DIR, 'shop', `${p.id}.svg`), svg, 'utf8');
}

console.log('Successfully generated all standalone high-quality SVG images in dist/images!');
