// The app's pages as real URLs (/contact, /account/orders, ...). The server answers them with the app shell
// (index.html) and the browser's router matches them, so one list serves both and they cannot drift apart.
// Everything else under dist/ (guides, service pages, the FAQ, policies and files) is a static page that loads on its own.
export const ROUTES = [
  '/', '/pricing', '/compare', '/shop', '/cart', '/checkout', '/contact', '/about', '/login', '/register', '/connect-whatsapp',
  '/services/:id', '/services/:id/packages', '/order/:id', '/invoice/:id',
  '/account', '/account/:tab', '/admin', '/admin/:tab', '/admin/:tab/:id',
];

export const trimPath = path => path.length > 1 ? path.replace(/\/+$/, '') : path;

// `path` is a pathname without a trailing slash. Returns { pattern, params }, or null when it is not an app page.
export function matchRoute(path) {
  const parts = path.split('/');
  for (const pattern of ROUTES) {
    const want = pattern.split('/');
    if (want.length !== parts.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; ok && i < want.length; i++) {
      if (!want[i].startsWith(':')) { ok = want[i] === parts[i]; continue; }
      const name = want[i].slice(1);
      try { params[name] = decodeURIComponent(parts[i]); } catch { return null; } // malformed %-escape in the URL
      ok = params[name] !== '';
    }
    if (ok) return { pattern, params };
  }
  return null;
}

// Sign-in, cart, checkout, orders and dashboards are for people, not for search results.
export const isPrivate = path => /^\/(cart|checkout|order|invoice|login|register|connect-whatsapp|account|admin|seo-audit|integrations)(\/|$)/.test(path);

// The page search engines should treat as the original: the package picker repeats its service page.
export const canonicalPath = path => path.replace(/^(\/services\/[\w-]+)(?:\/packages)?$/, '$1/');

export const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

export const competitorNames = services => [...new Set(services.flatMap(s => s.competitors.filter(x => !/market|listings/i.test(x.kind)).map(x => x.name)))];

const META = {
  '/pricing': { title: 'Pricing', description: 'Simple, transparent pricing for all digital services, monthly growth memberships, and project add-ons with milestone payment options.' },
  '/shop': { title: 'Shop', description: 'Digital downloads, templates, SEO spreadsheets, client agreements, and quick add-on services with instant delivery from Vintorex Digital.' },
  '/contact': { title: 'Contact', description: 'Get in touch with Vintorex Digital in Coimbatore. Call, WhatsApp, email, or visit our office for a free digital audit and custom project quote.' },
  '/about': { title: 'About Vintorex Digital', description: 'Learn about Vintorex Digital Solutions in Coimbatore, founded by Ranjith Kumar to deliver transparent, data-driven web development, SEO, ads and AI automation.' },
};

// Title and description of an app page. The views use them, and so does the server, which writes them into the raw
// HTML so shared links and crawlers that do not run scripts see the right page. Returns undefined when there is none.
export function pageMeta(path, services = []) {
  if (path === '/compare') {
    return { title: 'Competitor analysis', description: `We benchmarked Vintorex pricing against ${competitorNames(services).length} competitors across Coimbatore agencies, national agencies and DIY platforms. 100% transparent rate cards with milestone billing.` };
  }
  const id = path.match(/^\/services\/([\w-]+)(?:\/packages)?$/)?.[1];
  if (id) {
    const s = services.find(x => x.id === id);
    if (!s) return;
    if (path.endsWith('/packages')) return { title: s.name + ' packages', description: `Compare ${s.name} packages, prices, included work and optional add-ons. Choose the package that fits your project.` };
    return { title: s.name, description: s.summary || s.overview };
  }
  return META[path];
}
