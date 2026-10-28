// Catalog seed for Vintorex Digital Solutions.
// Prices in INR, exclusive of GST. Service details, add-ons and competitor
// benchmarks live in services.js.
import { SERVICES, ADDONS, COMPETITOR_SOURCES } from './services.js';
export { SERVICES, ADDONS, COMPETITOR_SOURCES };

// Bump when SERVICES / ADDONS / PLANS change so stored catalogs refresh.
export const CATALOG_VERSION = 3;

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
