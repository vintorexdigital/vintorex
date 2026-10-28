// Catalog seed for Vintorex Digital Solutions.
// Prices in INR, exclusive of GST. Service details, add-ons and competitor
// benchmarks live in services.js.
import { SERVICES, ADDONS, COMPETITOR_SOURCES } from './services.js';
export { SERVICES, ADDONS, COMPETITOR_SOURCES };

// Bump when SERVICES / ADDONS / PLANS change so stored catalogs refresh.
export const CATALOG_VERSION = 6;

export const BUSINESS = {
  name: 'Vintorex Digital Solutions',
  short: 'Vintorex',
  tagline: 'Turning data into dollars.',
  phone: '+91 866 720 9838',
  whatsapp: 'https://wa.me/918667209838',
  email: 'vintorexdigital@gmail.com',
  address: '38 Bankers Colony Phase 2, Cheran Ma Nagar, Coimbatore 641035',
  // Google Business Profile, Maps place and embed for the office.
  google: 'https://share.google/ecgLIdKfKoap3hnMo',
  maps: 'https://maps.app.goo.gl/Z5dYBa4UCpSNU6m99',
  mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3915.6927226625253!2d77.0197313758046!3d11.06164868910501!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba8f9c83d370637%3A0xdd8ff0b730ce3276!2svintorex%20digital%20solutions!5e0!3m2!1sen!2sin!4v1793195448916!5m2!1sen!2sin',
  geo: { lat: 11.0616487, lng: 77.0223063 },
  postal: { street: '38 Bankers Colony Phase 2, Cheran Ma Nagar', city: 'Coimbatore', region: 'Tamil Nadu', code: '641035', country: 'IN' },
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
  { id: 'ai', name: 'AI & Automation', blurb: 'Chatbots, voice agents and automation' },
];

// Membership plans. `includes` are service:tier pairs and `extras` are add-on
// ids; their combined list price is shown as the plan's value.
export const PLANS = [
  {
    id: 'free', name: 'Basic', price: 0, tagline: 'For getting started',
    discount: 0,
    features: ['Shop all services & downloads', 'Customer dashboard', 'Order tracking & invoices', 'Email support (48h)'],
  },
  {
    id: 'premium', name: 'Premium Growth', price: 19999, tagline: 'Local businesses ready to grow', popular: true,
    discount: 10,
    includes: ['seo:Local', 'social-media:Starter', 'analytics:Essentials'], extras: ['gbp', 'priority'],
    features: ['Local SEO (10 keywords)', 'Social media — 2 platforms, 12 posts', 'GA4 tracking + monthly report', 'Google Business Profile management', '10% off every one-time service', 'Priority support (4h)'],
  },
  {
    id: 'elite', name: 'Elite Scale', price: 44999, tagline: 'Full-funnel marketing team',
    discount: 15,
    includes: ['seo:Growth', 'social-media:Growth', 'advertising:Starter', 'email-marketing:Starter', 'analytics:Growth'], extras: ['priority'],
    features: ['Growth SEO (25 keywords + 4 blogs)', 'Social media — 3 platforms, 20 posts + 4 reels', 'Ads management (up to ₹50k spend)', 'Email & WhatsApp campaigns', 'Looker Studio live dashboard', 'Dedicated account manager', '15% off every one-time service'],
  },
];
export const ANNUAL_MONTHS_PAID = 10; // pay 10, get 12

// Milestone payment plan offered on one-time projects at or above MILESTONE_MIN (ex-GST).
export const MILESTONES = [['Advance to start work', 40], ['Mid-project approval', 40], ['Delivery & handover', 20]];
export const MILESTONE_MIN = 10000;

// Digital downloads (from the Vintorex shop).
export const PRODUCTS = [
  { id: 'cosmic-galaxy', name: 'Cosmic Galaxy Exploration', mrp: 149, price: 98, kind: 'Art print', hue: 250 },
  { id: 'celestial-night', name: 'Dreamy Celestial Night', mrp: 149, price: 99, kind: 'Art print', hue: 220 },
  { id: 'enchanted-castle', name: 'Enchanted Castle Landscape', mrp: 135, price: 52, kind: 'Art print', hue: 280 },
  { id: 'funky-floral', name: 'Funky Floral Fantasy', mrp: 127, price: 63, kind: 'Art print', hue: 330 },
  { id: 'mythical-creatures', name: 'Magical Mythical Creatures', mrp: 136, price: 67, kind: 'Art print', hue: 160 },
  { id: 'underwater', name: 'Underwater Wonderland', mrp: 125, price: 63, kind: 'Art print', hue: 190 },
  { id: 'forest-adventure', name: 'Whimsical Forest Adventure', mrp: 149, price: 86, kind: 'Art print', hue: 120 },
  { id: 'aurora-borealis-dreams', name: 'Aurora Borealis Dreams', mrp: 119, price: 48, kind: 'Art print', hue: 15 },
  { id: 'midnight-lantern-festival', name: 'Midnight Lantern Festival', mrp: 136, price: 102, kind: 'Art print', hue: 52 },
  { id: 'crystal-cave-mystery', name: 'Crystal Cave Mystery', mrp: 153, price: 99, kind: 'Art print', hue: 89 },
  { id: 'golden-savannah-sunset', name: 'Golden Savannah Sunset', mrp: 130, price: 72, kind: 'Poster', hue: 126 },
  { id: 'misty-mountain-sunrise', name: 'Misty Mountain Sunrise', mrp: 147, price: 66, kind: 'Wall art', hue: 163 },
  { id: 'neon-cyber-city', name: 'Neon Cyber City', mrp: 124, price: 99, kind: 'Art print', hue: 200 },
  { id: 'retro-synthwave-horizon', name: 'Retro Synthwave Horizon', mrp: 141, price: 99, kind: 'Art print', hue: 237 },
  { id: 'tropical-paradise-escape', name: 'Tropical Paradise Escape', mrp: 158, price: 95, kind: 'Art print', hue: 274 },
  { id: 'arctic-fox-wilderness', name: 'Arctic Fox Wilderness', mrp: 135, price: 68, kind: 'Poster', hue: 311 },
  { id: 'samurai-cherry-blossom', name: 'Samurai Cherry Blossom', mrp: 152, price: 61, kind: 'Wall art', hue: 348 },
  { id: 'steampunk-sky-voyage', name: 'Steampunk Sky Voyage', mrp: 129, price: 97, kind: 'Art print', hue: 25 },
  { id: 'desert-oasis-mirage', name: 'Desert Oasis Mirage', mrp: 146, price: 95, kind: 'Art print', hue: 62 },
  { id: 'lunar-garden-whispers', name: 'Lunar Garden Whispers', mrp: 123, price: 68, kind: 'Art print', hue: 99 },
  { id: 'pastel-cloud-kingdom', name: 'Pastel Cloud Kingdom', mrp: 140, price: 63, kind: 'Poster', hue: 136 },
  { id: 'ocean-wave-serenity', name: 'Ocean Wave Serenity', mrp: 157, price: 126, kind: 'Wall art', hue: 173 },
  { id: 'autumn-harvest-valley', name: 'Autumn Harvest Valley', mrp: 134, price: 94, kind: 'Art print', hue: 210 },
  { id: 'winter-wonderland-village', name: 'Winter Wonderland Village', mrp: 151, price: 91, kind: 'Art print', hue: 247 },
  { id: 'dancing-fireflies-meadow', name: 'Dancing Fireflies Meadow', mrp: 128, price: 64, kind: 'Art print', hue: 284 },
  { id: 'phoenix-rising-flames', name: 'Phoenix Rising Flames', mrp: 145, price: 58, kind: 'Poster', hue: 321 },
  { id: 'jungle-canopy-secrets', name: 'Jungle Canopy Secrets', mrp: 122, price: 92, kind: 'Wall art', hue: 358 },
  { id: 'starlit-desert-caravan', name: 'Starlit Desert Caravan', mrp: 139, price: 90, kind: 'Art print', hue: 35 },
  { id: 'mermaid-lagoon-magic', name: 'Mermaid Lagoon Magic', mrp: 156, price: 86, kind: 'Art print', hue: 72 },
  { id: 'alpine-lake-reflections', name: 'Alpine Lake Reflections', mrp: 133, price: 60, kind: 'Art print', hue: 109 },
  { id: 'vintage-botanical-bloom', name: 'Vintage Botanical Bloom', mrp: 150, price: 120, kind: 'Poster', hue: 146 },
  { id: 'geometric-mandala-harmony', name: 'Geometric Mandala Harmony', mrp: 127, price: 89, kind: 'Wall art', hue: 183 },
  { id: 'cosmic-jellyfish-drift', name: 'Cosmic Jellyfish Drift', mrp: 144, price: 86, kind: 'Art print', hue: 220 },
  { id: 'samurai-moon-duel', name: 'Samurai Moon Duel', mrp: 121, price: 61, kind: 'Art print', hue: 257 },
  { id: 'floating-islands-fantasy', name: 'Floating Islands Fantasy', mrp: 138, price: 55, kind: 'Art print', hue: 294 },
  { id: 'spring-meadow-butterflies', name: 'Spring Meadow Butterflies', mrp: 155, price: 116, kind: 'Poster', hue: 331 },
  { id: 'volcano-island-twilight', name: 'Volcano Island Twilight', mrp: 132, price: 86, kind: 'Wall art', hue: 8 },
  { id: 'hidden-waterfall-grotto', name: 'Hidden Waterfall Grotto', mrp: 149, price: 82, kind: 'Art print', hue: 45 },
  { id: 'gothic-moonlit-manor', name: 'Gothic Moonlit Manor', mrp: 126, price: 57, kind: 'Art print', hue: 82 },
  { id: 'rainbow-unicorn-valley', name: 'Rainbow Unicorn Valley', mrp: 143, price: 114, kind: 'Art print', hue: 119 },
  { id: 'nordic-fjord-morning', name: 'Nordic Fjord Morning', mrp: 120, price: 84, kind: 'Poster', hue: 156 },
  { id: 'pixel-art-adventure', name: 'Pixel Art Adventure', mrp: 137, price: 82, kind: 'Wall art', hue: 193 },
  { id: 'kawaii-candy-land', name: 'Kawaii Candy Land', mrp: 154, price: 77, kind: 'Art print', hue: 230 },
  { id: 'ancient-temple-ruins', name: 'Ancient Temple Ruins', mrp: 131, price: 52, kind: 'Art print', hue: 267 },
  { id: 'hot-air-balloon-festival', name: 'Hot Air Balloon Festival', mrp: 148, price: 111, kind: 'Art print', hue: 304 },
  { id: 'zen-bamboo-garden', name: 'Zen Bamboo Garden', mrp: 125, price: 81, kind: 'Poster', hue: 341 },
  { id: 'northern-lights-cabin', name: 'Northern Lights Cabin', mrp: 142, price: 78, kind: 'Wall art', hue: 18 },
  { id: 'sunflower-field-glow', name: 'Sunflower Field Glow', mrp: 119, price: 54, kind: 'Art print', hue: 55 },
  { id: 'coral-reef-treasure', name: 'Coral Reef Treasure', mrp: 136, price: 109, kind: 'Art print', hue: 92 },
  { id: 'haunted-pumpkin-patch', name: 'Haunted Pumpkin Patch', mrp: 153, price: 107, kind: 'Art print', hue: 129 },
  { id: 'galactic-space-station', name: 'Galactic Space Station', mrp: 130, price: 78, kind: 'Poster', hue: 166 },
  { id: 'venetian-canal-dusk', name: 'Venetian Canal Dusk', mrp: 147, price: 74, kind: 'Wall art', hue: 203 },
  { id: 'dragon-mountain-legend', name: 'Dragon Mountain Legend', mrp: 124, price: 50, kind: 'Art print', hue: 240 },
  { id: 'paper-lantern-skies', name: 'Paper Lantern Skies', mrp: 141, price: 106, kind: 'Art print', hue: 277 },
  { id: 'wildflower-hummingbird-haven', name: 'Wildflower Hummingbird Haven', mrp: 158, price: 103, kind: 'Art print', hue: 314 },
  { id: 'moroccan-tile-mosaic', name: 'Moroccan Tile Mosaic', mrp: 135, price: 74, kind: 'Poster', hue: 351 },
  { id: 'lighthouse-storm-watch', name: 'Lighthouse Storm Watch', mrp: 152, price: 68, kind: 'Wall art', hue: 28 },
  { id: 'owl-moon-forest', name: 'Owl Moon Forest', mrp: 129, price: 103, kind: 'Art print', hue: 65 },
  { id: 'tidal-pool-treasures', name: 'Tidal Pool Treasures', mrp: 146, price: 102, kind: 'Art print', hue: 102 },
  { id: 'fairy-tale-windmill', name: 'Fairy Tale Windmill', mrp: 123, price: 74, kind: 'Art print', hue: 139 },
  { id: 'mystic-tarot-constellations', name: 'Mystic Tarot Constellations', mrp: 140, price: 70, kind: 'Poster', hue: 176 },
  { id: 'lavender-hills-provence', name: 'Lavender Hills Provence', mrp: 157, price: 63, kind: 'Wall art', hue: 213 },
  { id: 'abstract-fluid-gold', name: 'Abstract Fluid Gold', mrp: 134, price: 101, kind: 'Art print', hue: 250 },
  { id: 'safari-sunrise-herd', name: 'Safari Sunrise Herd', mrp: 151, price: 98, kind: 'Art print', hue: 287 },
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

// General market-range guides used alongside the named competitor sources.
export const SOURCES = [
  ['Upgrowth — Social media management pricing', 'https://upgrowth.in/social-media-management-pricing/'],
  ['Noir and Blanco — Digital marketing packages cost', 'https://noirandblanco.com/digital-marketing-packages-cost/'],
  ['PW Skills — Digital marketing pricing', 'https://pwskills.com/blog/digital-marketing-pricing/'],
  ...Object.values(COMPETITOR_SOURCES),
];
