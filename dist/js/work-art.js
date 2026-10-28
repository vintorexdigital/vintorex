// Rich vector mockups and case study data for the Recent Work section.
import { esc, icon } from './ui.js';

export const WORK_PROJECTS = [
  {
    id: 'world-of-idols',
    title: 'The World of Idols',
    category: 'Web Design · E-commerce · SEO',
    summary: 'Custom e-commerce storefront with instant Razorpay checkout, automated WhatsApp dispatch alerts, and local SEO. Resulted in 3× online orders in 4 months.',
    metrics: ['3× Online Orders', 'Instant UPI / Cards', 'Ranked #1 for Kovai Idols'],
    hue: 38,
    accent: '#d97706',
    drawSvg: () => `
      <svg viewBox="0 0 480 320" role="img" aria-label="The World of Idols eCommerce storefront mockup" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="woi-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1e1835"/>
            <stop offset="100%" stop-color="#0c0919"/>
          </linearGradient>
          <linearGradient id="woi-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
          <filter id="woi-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <!-- Background -->
        <rect width="480" height="320" fill="url(#woi-bg)"/>
        <circle cx="380" cy="80" r="140" fill="#fbbf24" fill-opacity="0.08" filter="url(#woi-glow)"/>
        <circle cx="100" cy="260" r="120" fill="#6d4dff" fill-opacity="0.12" filter="url(#woi-glow)"/>

        <!-- Browser Window -->
        <rect x="36" y="28" width="408" height="264" rx="14" fill="#141126" stroke="#2e2752" stroke-width="1.5"/>
        <!-- Window Topbar -->
        <rect x="36" y="28" width="408" height="34" rx="14" fill="#1e1938"/>
        <circle cx="56" cy="45" r="4.5" fill="#ef4444"/>
        <circle cx="70" cy="45" r="4.5" fill="#f59e0b"/>
        <circle cx="84" cy="45" r="4.5" fill="#10b981"/>
        <!-- URL pill -->
        <rect x="110" y="36" width="220" height="18" rx="9" fill="#0d0a1c"/>
        <text x="130" y="49" font-size="9" fill="#9ca3af" font-family="monospace">theworldofidols.com/brass-collection</text>
        <!-- Cart & Search icons -->
        <circle cx="410" cy="45" r="8" fill="#fbbf24" fill-opacity="0.2"/>
        <circle cx="410" cy="45" r="3" fill="#fbbf24"/>

        <!-- Storefront Content: Hero Banner -->
        <rect x="52" y="74" width="230" height="78" rx="10" fill="#241e45"/>
        <rect x="66" y="88" width="70" height="12" rx="4" fill="#fbbf24"/>
        <rect x="66" y="106" width="130" height="8" rx="4" fill="#e5e7eb" fill-opacity="0.7"/>
        <rect x="66" y="120" width="80" height="20" rx="6" fill="#6d4dff"/>
        <text x="76" y="134" font-size="9" font-weight="bold" fill="#ffffff" font-family="sans-serif">SHOP NOW</text>

        <!-- Product Image Showcase (Right Card) -->
        <rect x="294" y="74" width="134" height="136" rx="10" fill="#201a3d" stroke="#372f63" stroke-width="1"/>
        <!-- Brass Idol Silhouette -->
        <circle cx="361" cy="120" r="32" fill="url(#woi-gold)" fill-opacity="0.2"/>
        <path d="M361 95 C352 95 348 103 348 111 C348 118 352 122 355 125 L353 142 L369 142 L367 125 C370 122 374 118 374 111 C374 103 370 95 361 95 Z" fill="url(#woi-gold)"/>
        <circle cx="361" cy="104" r="5" fill="#fef3c7"/>
        <!-- Product labels -->
        <rect x="306" y="152" width="80" height="8" rx="4" fill="#ffffff" fill-opacity="0.9"/>
        <text x="306" y="174" font-size="11" font-weight="bold" fill="#fbbf24" font-family="sans-serif">₹4,899</text>
        <text x="350" y="174" font-size="9" fill="#9ca3af" text-decoration="line-through" font-family="sans-serif">₹6,500</text>
        <rect x="306" y="184" width="110" height="18" rx="5" fill="#10b981"/>
        <text x="320" y="196" font-size="9" font-weight="bold" fill="#ffffff" font-family="sans-serif">ADD TO CART</text>

        <!-- Product row below -->
        <rect x="52" y="162" width="70" height="48" rx="8" fill="#1e1838"/>
        <circle cx="87" cy="182" r="14" fill="#fbbf24" fill-opacity="0.25"/>
        <rect x="130" y="162" width="70" height="48" rx="8" fill="#1e1838"/>
        <circle cx="165" cy="182" r="14" fill="#6d4dff" fill-opacity="0.25"/>
        <rect x="208" y="162" width="74" height="48" rx="8" fill="#1e1838"/>
        <circle cx="245" cy="182" r="14" fill="#10b981" fill-opacity="0.25"/>

        <!-- Floating Result Badge (Bottom Left) -->
        <g transform="translate(48, 224)">
          <rect width="180" height="46" rx="10" fill="#0c0919" stroke="#fbbf24" stroke-width="1.5" filter="url(#woi-glow)"/>
          <circle cx="22" cy="23" r="12" fill="#fbbf24"/>
          <path d="M17 23 L21 27 L28 19" fill="none" stroke="#1e1835" stroke-width="2.5" stroke-linecap="round"/>
          <text x="42" y="19" font-size="10" font-weight="bold" fill="#ffffff" font-family="sans-serif">300% Online Growth</text>
          <text x="42" y="33" font-size="8.5" fill="#fbbf24" font-family="sans-serif">Razorpay + WhatsApp Alerts</text>
        </g>

        <!-- Floating Rating Pill (Top Right) -->
        <g transform="translate(320, 16)">
          <rect width="114" height="26" rx="13" fill="#0f172a" stroke="#fbbf24" stroke-width="1"/>
          <text x="14" y="17" font-size="9" font-weight="bold" fill="#fbbf24" font-family="sans-serif">★ 4.9 (180+ Reviews)</text>
        </g>
      </svg>
    `,
  },
  {
    id: 'em-solutions',
    title: 'Electrical & Mechanical Solutions',
    category: 'Industrial Design · Web Platform · RFQ',
    summary: 'B2B engineering catalogue with 3D product renders, downloadable technical spec sheets, and an automated RFQ enquiry pipeline that doubled qualified supplier leads.',
    metrics: ['3D CAD Renders', '120+ Inquiries/Mo', 'ISO 9001 Specs'],
    hue: 200,
    accent: '#0284c7',
    drawSvg: () => `
      <svg viewBox="0 0 480 320" role="img" aria-label="Electrical & Mechanical Solutions 3D engineering portal mockup" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="em-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#09182b"/>
            <stop offset="100%" stop-color="#040b15"/>
          </linearGradient>
          <linearGradient id="em-cyan" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
        </defs>
        <rect width="480" height="320" fill="url(#em-bg)"/>
        <!-- Grid pattern -->
        <g stroke="#38bdf8" stroke-opacity="0.08" stroke-width="1">
          <line x1="0" y1="40" x2="480" y2="40"/><line x1="0" y1="80" x2="480" y2="80"/><line x1="0" y1="120" x2="480" y2="120"/>
          <line x1="0" y1="160" x2="480" y2="160"/><line x1="0" y1="200" x2="480" y2="200"/><line x1="0" y1="240" x2="480" y2="240"/>
          <line x1="60" y1="0" x2="60" y2="320"/><line x1="120" y1="0" x2="120" y2="320"/><line x1="180" y1="0" x2="180" y2="320"/>
          <line x1="240" y1="0" x2="240" y2="320"/><line x1="300" y1="0" x2="300" y2="320"/><line x1="360" y1="0" x2="360" y2="320"/>
        </g>

        <!-- Main Workstation Window -->
        <rect x="36" y="28" width="408" height="264" rx="14" fill="#0d1f36" stroke="#1e3a5f" stroke-width="1.5"/>
        <rect x="36" y="28" width="408" height="34" rx="14" fill="#132742"/>
        <circle cx="56" cy="45" r="4.5" fill="#ef4444"/>
        <circle cx="70" cy="45" r="4.5" fill="#f59e0b"/>
        <circle cx="84" cy="45" r="4.5" fill="#10b981"/>
        <rect x="110" y="36" width="210" height="18" rx="9" fill="#081424"/>
        <text x="126" y="49" font-size="9" fill="#38bdf8" font-family="monospace">emsolutions-india.com/3d-catalog</text>

        <!-- Left Column: 3D CAD Wireframe Cylinder / Gear -->
        <rect x="52" y="74" width="220" height="152" rx="10" fill="#081526" stroke="#1e3a5f" stroke-width="1"/>
        <!-- 3D Isometric Motor/Assembly -->
        <g transform="translate(162, 142)">
          <path d="M0 -45 L55 -15 L55 35 L0 65 L-55 35 L-55 -15 Z" fill="#0e2a4a" stroke="#38bdf8" stroke-width="2"/>
          <path d="M0 -45 L55 -15 L0 15 L-55 -15 Z" fill="#1e3d66" stroke="#38bdf8" stroke-width="1.5"/>
          <path d="M0 15 L0 65" stroke="#38bdf8" stroke-width="2"/>
          <!-- Inner axle / rotor -->
          <circle cx="0" cy="-15" r="18" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.5"/>
          <line x1="-35" y1="3" x2="35" y2="-33" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="3 3"/>
        </g>
        <!-- 3D Rotation Controls pill -->
        <rect x="66" y="86" width="96" height="20" rx="10" fill="#0284c7" fill-opacity="0.2" stroke="#38bdf8" stroke-width="1"/>
        <text x="76" y="100" font-size="8.5" font-weight="bold" fill="#38bdf8" font-family="sans-serif">↺ 360° CAD View</text>
        <!-- Spec tags -->
        <text x="66" y="212" font-size="9" font-family="monospace" fill="#94a3b8">TORQUE: 450 Nm · RPM: 1440</text>

        <!-- Right Column: Specs & Quotation Form -->
        <rect x="284" y="74" width="146" height="152" rx="10" fill="#102540" stroke="#1e3a5f" stroke-width="1"/>
        <rect x="296" y="88" width="100" height="12" rx="4" fill="#ffffff" fill-opacity="0.9"/>
        <rect x="296" y="108" width="122" height="7" rx="3.5" fill="#38bdf8" fill-opacity="0.4"/>
        <rect x="296" y="120" width="95" height="7" rx="3.5" fill="#38bdf8" fill-opacity="0.4"/>
        <rect x="296" y="138" width="122" height="24" rx="6" fill="#081424" stroke="#1e3a5f" stroke-width="1"/>
        <text x="306" y="153" font-size="8.5" fill="#38bdf8" font-family="sans-serif">Download Spec PDF ↓</text>
        <rect x="296" y="172" width="122" height="24" rx="6" fill="#0284c7"/>
        <text x="314" y="187" font-size="8.5" font-weight="bold" fill="#ffffff" font-family="sans-serif">Request RFQ Quote</text>

        <!-- Floating Result Badge (Bottom Left) -->
        <g transform="translate(48, 236)">
          <rect width="188" height="44" rx="10" fill="#040b15" stroke="#38bdf8" stroke-width="1.5"/>
          <circle cx="22" cy="22" r="12" fill="#0284c7"/>
          <path d="M16 22 L20 26 L28 17" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
          <text x="42" y="18" font-size="10" font-weight="bold" fill="#ffffff" font-family="sans-serif">2× Qualified B2B Leads</text>
          <text x="42" y="32" font-size="8.5" fill="#38bdf8" font-family="sans-serif">ISO Certified Catalogue Portal</text>
        </g>
      </svg>
    `,
  },
  {
    id: 'kovai-agro',
    title: 'Kovai Agro Organics',
    category: 'Mobile App · D2C E-Commerce · Brand',
    summary: 'Direct-to-consumer farm fresh subscription app with automated recurring orders, instant WhatsApp notifications, and same-day delivery dispatch across Coimbatore.',
    metrics: ['2.4× Repeat Buyers', '4.9 ★ Play Store', 'Local Farm-to-Door'],
    hue: 145,
    accent: '#10b981',
    drawSvg: () => `
      <svg viewBox="0 0 480 320" role="img" aria-label="Kovai Agro Organics mobile app and storefront mockup" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ka-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#062817"/>
            <stop offset="100%" stop-color="#02140a"/>
          </linearGradient>
          <linearGradient id="ka-green" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#34d399"/>
            <stop offset="100%" stop-color="#059669"/>
          </linearGradient>
        </defs>
        <rect width="480" height="320" fill="url(#ka-bg)"/>
        <circle cx="120" cy="80" r="110" fill="#10b981" fill-opacity="0.12"/>
        <circle cx="380" cy="240" r="130" fill="#34d399" fill-opacity="0.08"/>

        <!-- Phone Mockup in Center -->
        <g transform="translate(160, 20)">
          <!-- Phone Body -->
          <rect x="0" y="0" width="160" height="280" rx="26" fill="#0a1d12" stroke="#1f4e34" stroke-width="2"/>
          <!-- Notch / Speaker -->
          <rect x="52" y="8" width="56" height="6" rx="3" fill="#1f4e34"/>
          <!-- Screen Area -->
          <rect x="8" y="22" width="144" height="246" rx="18" fill="#0d281a"/>
          <!-- App Header -->
          <rect x="16" y="32" width="80" height="10" rx="5" fill="#34d399"/>
          <text x="16" y="52" font-size="8" fill="#9ca3af" font-family="sans-serif">📍 Cheran Ma Nagar, CBE</text>
          <circle cx="138" cy="40" r="8" fill="#10b981" fill-opacity="0.3"/>

          <!-- Promo Banner Card -->
          <rect x="16" y="60" width="128" height="52" rx="10" fill="url(#ka-green)"/>
          <text x="26" y="80" font-size="10" font-weight="bold" fill="#ffffff" font-family="sans-serif">Weekly Harvest</text>
          <text x="26" y="94" font-size="8" fill="#ecfdf5" font-family="sans-serif">100% Organic Farm Direct</text>

          <!-- Product Grid -->
          <rect x="16" y="120" width="60" height="56" rx="8" fill="#133624"/>
          <circle cx="46" cy="140" r="12" fill="#10b981" fill-opacity="0.4"/>
          <rect x="22" y="160" width="36" height="5" rx="2.5" fill="#ffffff" fill-opacity="0.8"/>

          <rect x="84" y="120" width="60" height="56" rx="8" fill="#133624"/>
          <circle cx="114" cy="140" r="12" fill="#f59e0b" fill-opacity="0.4"/>
          <rect x="90" y="160" width="36" height="5" rx="2.5" fill="#ffffff" fill-opacity="0.8"/>

          <!-- Subscription Button -->
          <rect x="16" y="186" width="128" height="24" rx="8" fill="#10b981"/>
          <text x="32" y="201" font-size="8.5" font-weight="bold" fill="#ffffff" font-family="sans-serif">Subscribe Basket (₹499)</text>

          <!-- Delivery tracker pill -->
          <rect x="16" y="218" width="128" height="38" rx="8" fill="#081b10" stroke="#1f4e34" stroke-width="1"/>
          <circle cx="28" cy="237" r="6" fill="#10b981"/>
          <text x="40" y="234" font-size="7.5" font-weight="bold" fill="#ffffff" font-family="sans-serif">Out for Morning Delivery</text>
          <text x="40" y="246" font-size="7" fill="#6ee7b7" font-family="sans-serif">Arriving by 7:30 AM</text>
        </g>

        <!-- Floating Left Card: Organic Certification -->
        <g transform="translate(24, 70)">
          <rect width="120" height="64" rx="10" fill="#061a0f" stroke="#10b981" stroke-width="1.2"/>
          <circle cx="26" cy="26" r="12" fill="#10b981" fill-opacity="0.2"/>
          <path d="M26 18 C20 22 20 28 26 34 C32 28 32 22 26 18 Z" fill="#10b981"/>
          <text x="44" y="24" font-size="9" font-weight="bold" fill="#ffffff" font-family="sans-serif">100% Organic</text>
          <text x="44" y="36" font-size="7.5" fill="#a7f3d0" font-family="sans-serif">Zero Pesticides</text>
          <text x="14" y="52" font-size="8" fill="#34d399" font-family="sans-serif">Certified Organic Farm</text>
        </g>

        <!-- Floating Right Card: Retention Metric -->
        <g transform="translate(336, 170)">
          <rect width="124" height="64" rx="10" fill="#061a0f" stroke="#34d399" stroke-width="1.2"/>
          <circle cx="26" cy="26" r="12" fill="#34d399"/>
          <path d="M20 26 L24 30 L32 21" fill="none" stroke="#062817" stroke-width="2" stroke-linecap="round"/>
          <text x="44" y="24" font-size="9" font-weight="bold" fill="#ffffff" font-family="sans-serif">240% Growth</text>
          <text x="44" y="36" font-size="7.5" fill="#a7f3d0" font-family="sans-serif">Repeat Subscriptions</text>
          <text x="14" y="52" font-size="8" fill="#34d399" font-family="sans-serif">4.9 ★ Rating in CBE</text>
        </g>
      </svg>
    `,
  },
  {
    id: 'spark-dental',
    title: 'Spark Dental & Healthcare',
    category: 'SEO · Web Platform · Local Ads',
    summary: 'High-converting medical clinic platform with automated patient appointment booking, WhatsApp reminders, and localized Google Maps optimization.',
    metrics: ['#1 on Google Maps', '50+ New Patients/Mo', 'Zero No-Shows'],
    hue: 265,
    accent: '#7c3aed',
    drawSvg: () => `
      <svg viewBox="0 0 480 320" role="img" aria-label="Spark Dental & Healthcare booking platform mockup" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sd-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#18132d"/>
            <stop offset="100%" stop-color="#0b0817"/>
          </linearGradient>
          <linearGradient id="sd-purple" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#a78bfa"/>
            <stop offset="100%" stop-color="#6d28d9"/>
          </linearGradient>
        </defs>
        <rect width="480" height="320" fill="url(#sd-bg)"/>
        <circle cx="360" cy="100" r="120" fill="#8b5cf6" fill-opacity="0.1"/>

        <!-- Browser Window -->
        <rect x="36" y="28" width="408" height="264" rx="14" fill="#130e26" stroke="#2c214d" stroke-width="1.5"/>
        <rect x="36" y="28" width="408" height="34" rx="14" fill="#1c1538"/>
        <circle cx="56" cy="45" r="4.5" fill="#ef4444"/>
        <circle cx="70" cy="45" r="4.5" fill="#f59e0b"/>
        <circle cx="84" cy="45" r="4.5" fill="#10b981"/>
        <rect x="110" y="36" width="220" height="18" rx="9" fill="#090614"/>
        <text x="126" y="49" font-size="9" fill="#a78bfa" font-family="monospace">sparkdentalcare.in/appointment</text>

        <!-- Clinic Header & Booking Schedule -->
        <rect x="52" y="74" width="220" height="152" rx="10" fill="#1a1336" stroke="#2c214d" stroke-width="1"/>
        <!-- Doctor profile -->
        <circle cx="80" cy="106" r="18" fill="#a78bfa" fill-opacity="0.3"/>
        <path d="M72 104 C72 100 76 96 80 96 C84 96 88 100 88 104 C88 108 84 112 80 112 C76 112 72 108 72 104 Z" fill="#c4b5fd"/>
        <path d="M68 122 C68 116 74 114 80 114 C86 114 92 116 92 122 Z" fill="#a78bfa"/>
        <!-- Text -->
        <rect x="108" y="96" width="100" height="10" rx="5" fill="#ffffff" fill-opacity="0.9"/>
        <text x="108" y="118" font-size="8" fill="#a78bfa" font-family="sans-serif">MDS · Orthodontist & Implants</text>
        <text x="108" y="128" font-size="8" fill="#34d399" font-family="sans-serif">● Clinic Open · 9 AM - 8 PM</text>

        <!-- Time Slots -->
        <rect x="66" y="142" width="46" height="20" rx="5" fill="#2c214d"/>
        <text x="74" y="155" font-size="8" fill="#c4b5fd" font-family="sans-serif">10:00 AM</text>
        <rect x="118" y="142" width="46" height="20" rx="5" fill="#7c3aed"/>
        <text x="126" y="155" font-size="8" font-weight="bold" fill="#ffffff" font-family="sans-serif">11:30 AM</text>
        <rect x="170" y="142" width="46" height="20" rx="5" fill="#2c214d"/>
        <text x="178" y="155" font-size="8" fill="#c4b5fd" font-family="sans-serif">04:30 PM</text>

        <!-- Book button -->
        <rect x="66" y="174" width="190" height="28" rx="8" fill="url(#sd-purple)"/>
        <text x="108" y="192" font-size="9" font-weight="bold" fill="#ffffff" font-family="sans-serif">Book on WhatsApp →</text>

        <!-- Right Side: Google Review Card -->
        <rect x="284" y="74" width="146" height="152" rx="10" fill="#181133" stroke="#2c214d" stroke-width="1"/>
        <rect x="296" y="88" width="70" height="10" rx="5" fill="#f59e0b"/>
        <text x="296" y="112" font-size="10" font-weight="bold" fill="#ffffff" font-family="sans-serif">4.9 ★★★★★</text>
        <text x="296" y="124" font-size="8" fill="#9ca3af" font-family="sans-serif">210+ Google Reviews</text>
        <rect x="296" y="136" width="122" height="1" fill="#2c214d"/>
        <text x="296" y="152" font-size="8" fill="#c4b5fd" font-family="sans-serif">“Best dental clinic in</text>
        <text x="296" y="164" font-size="8" fill="#c4b5fd" font-family="sans-serif">Coimbatore! Painless &amp;</text>
        <text x="296" y="176" font-size="8" fill="#c4b5fd" font-family="sans-serif">caring staff.”</text>
        <text x="296" y="196" font-size="7.5" fill="#a78bfa" font-family="sans-serif">— Ramya S.</text>

        <!-- Floating Result Badge (Bottom Left) -->
        <g transform="translate(48, 236)">
          <rect width="196" height="44" rx="10" fill="#0b0817" stroke="#8b5cf6" stroke-width="1.5"/>
          <circle cx="22" cy="22" r="12" fill="#7c3aed"/>
          <path d="M16 22 L20 26 L28 17" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
          <text x="42" y="18" font-size="10" font-weight="bold" fill="#ffffff" font-family="sans-serif">#1 on Google Local Pack</text>
          <text x="42" y="32" font-size="8.5" fill="#a78bfa" font-family="sans-serif">50+ Verified Bookings / Mo</text>
        </g>
      </svg>
    `,
  },
];

export function renderWorkCard(w) {
  const altText = `${w.title} - ${w.category} case study: ${w.metrics.join(', ')} by Vintorex Digital Solutions Coimbatore`;
  return `
    <article class="card work-card">
      <div class="work-visual" style="--h:${w.hue}">
        <img class="work-img" src="/images/work/${w.id}.svg" alt="${esc(altText)}" width="960" height="640" loading="lazy" decoding="async">
        <span class="work-overlay-badge">${icon('arrow')} View Case Study</span>
      </div>
      <div class="work-content">
        <small class="work-cat">${esc(w.category)}</small>
        <h3>${esc(w.title)}</h3>
        <p>${esc(w.summary)}</p>
        <div class="work-metrics">
          ${w.metrics.map(m => `<span class="work-metric-pill">${icon('check')}${esc(m)}</span>`).join('')}
        </div>
      </div>
    </article>
  `;
}
