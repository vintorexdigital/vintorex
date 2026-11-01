// Navigation over real URLs with the History API. Links to the app's own pages (routes.js) change the view
// without a reload; guides, service pages and files load as ordinary pages.
import { matchRoute, trimPath } from './routes.js';

export const NAVIGATE = 'vx:navigate';

// Go to a path of this site, with an optional ?query and #fragment. It never leaves the site, so a crafted
// `next` address cannot send anyone elsewhere. Pages that are not app pages load normally.
export function navigate(to, { replace = false } = {}) {
  const url = new URL(to, location.href);
  if (url.origin !== location.origin) return;
  const path = trimPath(url.pathname);
  if (!matchRoute(path)) { location[replace ? 'replace' : 'assign'](url.href); return; }
  const next = path + url.search + url.hash;
  if (next !== location.pathname + location.search + location.hash) history[replace ? 'replaceState' : 'pushState'](null, '', next);
  window.dispatchEvent(new Event(NAVIGATE));
}

// Clicks on links to app pages become navigations. Anything else is left to the browser: modified clicks and
// new tabs, downloads, links to the same page's #fragments, other sites, and static pages.
export function interceptLinks() {
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.getAttribute('href').startsWith('#')) return;
    if (a.origin !== location.origin || !matchRoute(trimPath(a.pathname))) return;
    e.preventDefault();
    navigate(a.href);
  });
}

// Links from before the app had real URLs looked like /#/contact or /#/#audit. This is the page they meant,
// or null when the address is not one of them. Services and guides moved to their static pages.
export function legacyUrl(hash = location.hash) {
  if (!hash.startsWith('#/')) return null;
  const rest = hash.slice(1);
  const cut = rest.search(/[?#]/);
  const path = trimPath(cut < 0 ? rest : rest.slice(0, cut));
  const tail = cut < 0 ? '' : rest.slice(cut);
  const param = name => new URLSearchParams(tail.split('#')[0]).get(name);
  if (path === '/services') return '/services/' + (param('cat') ? '#' + param('cat') : '');
  const service = path.match(/^\/services\/([\w-]+)$/)?.[1];
  if (service) return `/services/${service}/packages${tail}`;
  if (path === '/blog') return '/blog/' + (param('s') ? '#' + encodeURIComponent(param('s')) : '');
  const guide = path.match(/^\/blog\/([\w-]+)$/)?.[1];
  if (guide) return `/blog/${guide}/`;
  if (path === '/terms') return '/terms/';
  return path + tail;
}
