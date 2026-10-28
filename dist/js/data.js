// Catalog seed for Vintorex Digital Solutions.
// Prices in INR, exclusive of GST. Market ranges are India 2026 benchmarks
// compiled from public agency pricing guides (see SOURCES).

export const BUSINESS = {
  name: 'Vintorex Digital Solutions',
  short: 'Vintorex',
  tagline: 'Turning data into dollars.',
  phone: '+91 866 720 9838',
  whatsapp: 'https://wa.me/918667209838',
  email: 'vintorexdigital@gmail.com',
  address: '38 Bankers Colony Phase 2, Cheran Ma Nagar, Coimbatore 641035',
  gst: 18,
  social: {
    Facebook: 'https://www.facebook.com/profile.php?id=61562287629028',
    Instagram: 'https://www.instagram.com/vintorex_digital',
    YouTube: 'https://www.youtube.com/@Vintorex_Digital',
    X: 'https://x.com/Vintorex_DM',
  },
};

export const CATEGORIES = [
  { id: 'build', name: 'Build', blurb: 'Websites, stores and apps' },
  { id: 'grow', name: 'Grow', blurb: 'SEO, social and paid ads' },
  { id: 'brand', name: 'Brand & Content', blurb: 'Identity, content and video' },
  { id: 'tech', name: 'Cloud & Data', blurb: 'Hosting, cloud and analytics' },
];

// billing: 'once' | 'month'
export const SERVICES = [
  {
    id: 'web-design', cat: 'build', icon: 'web', name: 'Website Design & Development',
    summary: 'Responsive, SEO-friendly business websites built to convert visitors into enquiries.',
    billing: 'once', market: [15000, 60000], delivery: '7–21 days',
    tiers: [
      { name: 'Starter', price: 14999, features: ['Up to 5 pages', 'Mobile responsive', 'Contact & WhatsApp forms', 'Basic on-page SEO', '1 revision round'] },
      { name: 'Growth', price: 27999, popular: true, features: ['Up to 12 pages', 'Blog / CMS', 'Lead capture + CRM sync', 'Speed optimisation (90+)', 'Google Analytics 4', '3 revision rounds'] },
      { name: 'Premium', price: 54999, features: ['Unlimited pages', 'Custom UI/UX design', 'Animations & micro-interactions', 'Multilingual ready', 'Schema + technical SEO', '3 months free maintenance'] },
    ],
  },
  {
    id: 'ecommerce', cat: 'build', icon: 'cart', name: 'E-commerce Store',
    summary: 'Online stores with payments, shipping, GST invoices and inventory built in.',
    billing: 'once', market: [35000, 400000], delivery: '3–6 weeks',
    tiers: [
      { name: 'Starter', price: 34999, features: ['Up to 50 products', 'Razorpay / UPI payments', 'Shipping integration', 'GST invoices', 'Order emails'] },
      { name: 'Growth', price: 74999, popular: true, features: ['Up to 500 products', 'Coupons & offers', 'Abandoned cart recovery', 'WhatsApp order alerts', 'Product filters & reviews', 'Analytics dashboard'] },
      { name: 'Premium', price: 149999, features: ['Unlimited products', 'Custom design system', 'Multi-vendor or B2B pricing', 'ERP / CRM integration', 'Loyalty & subscriptions', 'Dedicated launch manager'] },
    ],
  },
  {
    id: 'mobile-app', cat: 'build', icon: 'phone', name: 'Mobile App Development',
    summary: 'Android and iOS apps that put your business one tap away from your customers.',
    billing: 'once', market: [100000, 1000000], delivery: '6–14 weeks',
    tiers: [
      { name: 'Starter', price: 79999, features: ['Android app (Flutter)', 'Up to 8 screens', 'Push notifications', 'Play Store publishing'] },
      { name: 'Growth', price: 149999, popular: true, features: ['Android + iOS', 'Up to 20 screens', 'Login & user profiles', 'Payments integration', 'Admin web panel'] },
      { name: 'Premium', price: 299999, features: ['Custom native features', 'Real-time chat / tracking', 'Analytics & crash reports', 'Scalable cloud backend', '6 months support'] },
    ],
  },
  {
    id: 'seo', cat: 'grow', icon: 'search', name: 'Search Engine Optimisation',
    summary: 'Rank higher on Google with technical, on-page, local and content SEO.',
    billing: 'month', market: [8000, 50000], delivery: 'Results in 3–6 months',
    tiers: [
      { name: 'Local', price: 7999, features: ['10 target keywords', 'Google Business Profile', 'On-page fixes', 'Monthly ranking report'] },
      { name: 'Growth', price: 14999, popular: true, features: ['25 target keywords', 'Technical SEO audit', '4 SEO blog posts', 'Quality backlinks', 'GA4 + Search Console'] },
      { name: 'Premium', price: 29999, features: ['60 target keywords', 'AI search / answer-engine optimisation', '8 SEO blog posts', 'Digital PR backlinks', 'Competitor tracking', 'Dedicated SEO manager'] },
    ],
  },
  {
    id: 'social-media', cat: 'grow', icon: 'social', name: 'Social Media Marketing',
    summary: 'Build relationships and trust on Instagram, Facebook, LinkedIn and X.',
    billing: 'month', market: [8000, 50000], delivery: 'Monthly',
    tiers: [
      { name: 'Starter', price: 8999, features: ['2 platforms', '12 posts / month', 'Content calendar', 'Hashtag research', 'Monthly report'] },
      { name: 'Growth', price: 17999, popular: true, features: ['3 platforms', '20 posts + 4 reels', 'Community management', 'Story designs', 'Bi-weekly report'] },
      { name: 'Premium', price: 34999, features: ['4 platforms', '30 posts + 8 reels', 'Influencer outreach', 'Shoot direction', 'Weekly report & strategy call'] },
    ],
  },
  {
    id: 'advertising', cat: 'grow', icon: 'ads', name: 'Paid Advertising (PPC)',
    summary: 'Google, Meta and YouTube ads targeted by demographics, interests, behaviour and location.',
    billing: 'month', market: [10000, 60000], delivery: 'Live in 5 days',
    note: 'Ad spend is billed directly by the ad platform.',
    tiers: [
      { name: 'Starter', price: 9999, features: ['1 platform', 'Up to ₹50k ad spend', '2 campaigns', 'Conversion tracking', 'Monthly report'] },
      { name: 'Growth', price: 19999, popular: true, features: ['2 platforms', 'Up to ₹2L ad spend', 'A/B creative testing', 'Retargeting', 'Landing page tips'] },
      { name: 'Premium', price: 39999, features: ['All platforms', 'Up to ₹6L ad spend', 'Full-funnel strategy', 'Custom creatives', 'Weekly optimisation calls'] },
    ],
  },
  {
    id: 'email-marketing', cat: 'grow', icon: 'mail', name: 'Email & WhatsApp Marketing',
    summary: 'Automated newsletters, drips and WhatsApp broadcasts that bring customers back.',
    billing: 'month', market: [5000, 30000], delivery: 'Monthly',
    tiers: [
      { name: 'Starter', price: 4999, features: ['4 campaigns / month', 'Up to 5k contacts', 'Template design', 'Open & click report'] },
      { name: 'Growth', price: 9999, popular: true, features: ['8 campaigns / month', 'Up to 25k contacts', 'Welcome & cart automations', 'WhatsApp broadcasts', 'Segmentation'] },
      { name: 'Premium', price: 19999, features: ['Unlimited campaigns', 'Up to 1L contacts', 'Lifecycle journeys', 'A/B testing', 'Deliverability monitoring'] },
    ],
  },
  {
    id: 'branding', cat: 'brand', icon: 'brand', name: 'Digital Branding',
    summary: 'A brand identity that communicates your values, products and services clearly.',
    billing: 'once', market: [5000, 100000], delivery: '5–15 days',
    tiers: [
      { name: 'Logo', price: 4999, features: ['3 logo concepts', '2 revisions', 'All file formats', 'Colour palette'] },
      { name: 'Brand Kit', price: 14999, popular: true, features: ['Logo + variations', 'Typography & colours', 'Business card & letterhead', 'Social media kit', 'Mini brand guide'] },
      { name: 'Identity', price: 34999, features: ['Brand strategy workshop', 'Full visual identity', 'Brand book (30+ pages)', 'Packaging / signage design', 'Brand voice & messaging'] },
    ],
  },
  {
    id: 'content-writing', cat: 'brand', icon: 'pen', name: 'SEO Content Writing',
    summary: 'Speed-optimised, keyword-rich articles and web copy that rank and convert.',
    billing: 'month', market: [4000, 30000], delivery: 'Monthly',
    tiers: [
      { name: 'Starter', price: 3999, features: ['4 articles (1,000 words)', 'Keyword research', 'Meta titles & descriptions'] },
      { name: 'Growth', price: 7499, popular: true, features: ['8 articles (1,200 words)', 'Topic clusters', 'Internal linking', 'Royalty-free images'] },
      { name: 'Premium', price: 13999, features: ['16 articles (1,500 words)', 'Expert-reviewed content', 'Content refresh of old posts', 'Publishing on your CMS'] },
    ],
  },
  {
    id: 'video', cat: 'brand', icon: 'video', name: 'Reels & Video Production',
    summary: 'Short-form reels, explainers and ad videos made for the feed.',
    billing: 'once', market: [6000, 60000], delivery: '5–10 days',
    tiers: [
      { name: '4 Reels', price: 5999, features: ['4 edited reels', 'Captions & music', 'Script ideas'] },
      { name: '8 Reels', price: 10999, popular: true, features: ['8 edited reels', 'Motion graphics', 'Thumbnail designs', 'Hook scripting'] },
      { name: 'Brand Film', price: 24999, features: ['60–90s brand video', 'On-site shoot (Coimbatore)', 'Voice-over', '3 cut-downs for ads'] },
    ],
  },
  {
    id: 'industrial-design', cat: 'brand', icon: 'cube', name: 'Industrial & Product Design',
    summary: '3D product renders, catalogues and technical visuals for manufacturers.',
    billing: 'once', market: [3000, 80000], delivery: '5–20 days',
    tiers: [
      { name: '3D Render', price: 2499, features: ['1 product, 3 views', 'Studio lighting', 'High-res output'] },
      { name: 'Catalogue', price: 9999, popular: true, features: ['Up to 16-page catalogue', 'Product photo editing', 'Print + PDF ready'] },
      { name: 'Product Design', price: 29999, features: ['Concept sketches', '3D CAD model', 'Photoreal renders', 'Exploded views'] },
    ],
  },
  {
    id: 'cloud', cat: 'tech', icon: 'cloud', name: 'Cloud Services',
    summary: 'Scalable cloud hosting, migration and management that grows with demand.',
    billing: 'month', market: [1000, 25000], delivery: 'Setup in 48h',
    tiers: [
      { name: 'Managed Hosting', price: 999, features: ['Fast SSD hosting', 'Free SSL', 'Daily backups', 'Uptime monitoring'] },
      { name: 'Cloud VPS', price: 4999, popular: true, features: ['AWS / GCP / Azure', 'Auto-scaling', 'Security patches', 'CDN & firewall', 'Monthly health report'] },
      { name: 'Enterprise Cloud', price: 14999, features: ['Multi-region setup', 'CI/CD pipelines', 'Disaster recovery', '24×7 monitoring', 'Cost optimisation'] },
    ],
  },
  {
    id: 'analytics', cat: 'tech', icon: 'chart', name: 'Data Insights & Analytics',
    summary: 'GA4, tag tracking and live dashboards so every rupee is measured.',
    billing: 'month', market: [5000, 40000], delivery: 'Monthly',
    tiers: [
      { name: 'Essentials', price: 4999, features: ['GA4 + GTM setup', 'Conversion tracking', 'Monthly report'] },
      { name: 'Growth', price: 9999, popular: true, features: ['Looker Studio dashboard', 'Funnel analysis', 'Call & WhatsApp tracking', 'Bi-weekly insights'] },
      { name: 'Premium', price: 19999, features: ['Attribution modelling', 'CRM revenue reporting', 'Predictive insights', 'Weekly analyst call'] },
    ],
  },
  {
    id: 'maintenance', cat: 'tech', icon: 'shield', name: 'Website Maintenance (AMC)',
    summary: 'Updates, backups, security and small edits so your site never falls behind.',
    billing: 'month', market: [1500, 15000], delivery: 'Monthly',
    tiers: [
      { name: 'Basic', price: 1499, features: ['Plugin & core updates', 'Weekly backups', '1 hr content edits'] },
      { name: 'Pro', price: 2999, popular: true, features: ['Daily backups', 'Malware scanning', '3 hrs content edits', 'Speed checks'] },
      { name: 'Business', price: 5999, features: ['Real-time backups', 'Priority fixes (4h)', '8 hrs content edits', 'Monthly UX improvements'] },
    ],
  },
];

// Membership / subscription plans shown on /pricing.
export const PLANS = [
  {
    id: 'free', name: 'Basic', price: 0, tagline: 'For getting started',
    discount: 0,
    features: ['Shop all services & downloads', 'Customer dashboard', 'Order tracking & invoices', 'Email support (48h)'],
  },
  {
    id: 'premium', name: 'Premium Growth', price: 19999, tagline: 'Local businesses ready to grow', popular: true,
    discount: 10, value: 30997,
    includes: ['seo:Local', 'social-media:Starter', 'analytics:Essentials'],
    features: ['Local SEO (10 keywords)', 'Social media — 2 platforms, 12 posts', 'GA4 tracking + monthly report', 'Google Business Profile management', '10% off every one-time service', 'Priority support (24h)'],
  },
  {
    id: 'elite', name: 'Elite Scale', price: 44999, tagline: 'Full-funnel marketing team',
    discount: 15, value: 67995,
    includes: ['seo:Growth', 'social-media:Growth', 'advertising:Starter', 'email-marketing:Starter', 'analytics:Growth'],
    features: ['Growth SEO (25 keywords + 4 blogs)', 'Social media — 3 platforms, 20 posts + 4 reels', 'Ads management (up to ₹50k spend)', 'Email & WhatsApp campaigns', 'Looker Studio live dashboard', 'Dedicated account manager', '15% off every one-time service'],
  },
];
export const ANNUAL_MONTHS_PAID = 10; // pay 10, get 12

export const ADDONS = [
  { id: 'extra-reels', name: 'Extra 4 Reels', price: 4999, billing: 'month', desc: 'Four more edited reels each month.' },
  { id: 'extra-blogs', name: 'Extra 4 SEO Blogs', price: 3499, billing: 'month', desc: 'Four extra 1,000-word articles.' },
  { id: 'priority', name: 'Priority Support (4h)', price: 1999, billing: 'month', desc: 'Same-day replies and fixes.' },
  { id: 'extra-platform', name: 'Extra Ad / Social Platform', price: 3999, billing: 'month', desc: 'Add LinkedIn, YouTube or X.' },
  { id: 'gbp', name: 'Google Business Profile', price: 2999, billing: 'month', desc: 'Posts, reviews and Q&A management.' },
  { id: 'landing-page', name: 'Landing Page', price: 4999, billing: 'once', desc: 'High-converting page for a campaign.' },
  { id: 'whatsapp-api', name: 'WhatsApp Business API Setup', price: 4999, billing: 'once', desc: 'Verified number, templates and chatbot.' },
  { id: 'domain-hosting', name: 'Domain + Hosting (1 year)', price: 3499, billing: 'once', desc: '.com/.in domain, SSL and hosting.' },
  { id: 'speed', name: 'Speed Optimisation', price: 3999, billing: 'once', desc: 'Core Web Vitals fixes to 90+ score.' },
  { id: 'audit', name: 'Competitor Analysis Report', price: 2999, billing: 'once', desc: '20-page audit of your top 3 rivals.' },
  { id: 'photo-edit', name: 'Product Photo Editing (25)', price: 1999, billing: 'once', desc: 'Background removal and retouching.' },
];

// Digital downloads (from the Vintorex shop).
export const PRODUCTS = [
  { id: 'cosmic-galaxy', name: 'Cosmic Galaxy Exploration', mrp: 149, price: 98, kind: 'Art print', hue: 250 },
  { id: 'celestial-night', name: 'Dreamy Celestial Night', mrp: 149, price: 99, kind: 'Art print', hue: 220 },
  { id: 'enchanted-castle', name: 'Enchanted Castle Landscape', mrp: 135, price: 52, kind: 'Art print', hue: 280 },
  { id: 'funky-floral', name: 'Funky Floral Fantasy', mrp: 127, price: 63, kind: 'Art print', hue: 330 },
  { id: 'mythical-creatures', name: 'Magical Mythical Creatures', mrp: 136, price: 67, kind: 'Art print', hue: 160 },
  { id: 'underwater', name: 'Underwater Wonderland', mrp: 125, price: 63, kind: 'Art print', hue: 190 },
  { id: 'forest-adventure', name: 'Whimsical Forest Adventure', mrp: 149, price: 86, kind: 'Art print', hue: 120 },
  { id: 'social-templates', name: 'Social Media Template Pack (60)', mrp: 999, price: 499, kind: 'Template', hue: 20 },
  { id: 'seo-checklist', name: 'Local SEO Checklist 2026', mrp: 399, price: 199, kind: 'Guide', hue: 45 },
  { id: 'content-calendar', name: '12-Month Content Calendar', mrp: 599, price: 299, kind: 'Template', hue: 0 },
];

export const COUPONS = [
  { code: 'WELCOME10', pct: 10, desc: '10% off your first order' },
  { code: 'DIWALI20', pct: 20, desc: '20% festive discount' },
];

export const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
export const LEAD_SOURCES = ['Website form', 'Free audit', 'Service quote', 'WhatsApp', 'Instagram', 'Google Ads', 'Referral', 'Walk-in'];
export const ORDER_STATUSES = ['Pending', 'In progress', 'Review', 'Delivered', 'Cancelled'];

export const SOURCES = [
  ['Upgrowth — Social media management pricing', 'https://upgrowth.in/social-media-management-pricing/'],
  ['Noir and Blanco — Digital marketing packages cost', 'https://noirandblanco.com/digital-marketing-packages-cost/'],
  ['Noir and Blanco — E-commerce development packages in India', 'https://noirandblanco.com/ecommerce-website-development-packages-in-india/'],
  ['Hostinger — Website cost in India 2026', 'https://www.hostinger.com/in/tutorials/website-cost'],
  ['Hostinger — E-commerce website cost 2026', 'https://www.hostinger.com/in/tutorials/ecommerce-website-cost/'],
  ['PW Skills — Digital marketing pricing', 'https://pwskills.com/blog/digital-marketing-pricing/'],
];
