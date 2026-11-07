import { readFile } from 'node:fs/promises';
import { siteHeader, siteFooter } from '../dist/js/chrome.js';
import { articleHtml, postCard } from '../dist/js/blog/render.js';
import { ART, serviceImagePath } from '../dist/js/service-art.js';
import { servicesIndexBody, serviceBody, serviceSchema } from '../dist/js/seo.js';
import { esc } from '../dist/js/ui.js';
import { readStore } from './store.mjs';

// Shared content is rendered on each request so edits also reach direct links and crawlers.
export async function contentPage(pathname, site, indexFile) {
  const path = pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
  const detail = path.match(/^\/services\/([\w-]+)$/);
  if (path !== '/blog' && !path.startsWith('/blog/') && path !== '/services' && !detail) return null;
  const { state } = readStore();
  const services = state.catalog.services;
  const service = id => services.find(s => s.id === id);
  const url = site + path + '/';
  let title, description, body, schema, keywords, status = 200;
  const published = state.posts.filter(p => p.published !== false);
  if (path === '/services') {
    title = 'Digital services and prices in Coimbatore';
    description = 'Compare website design, SEO, advertising and AI services in Coimbatore. Browse package prices in INR, delivery times and billing terms.';
    keywords = 'digital services Coimbatore, website design packages, SEO pricing, AI automation services';
    schema = { '@type': 'CollectionPage', name: title, url, mainEntity: { '@type': 'ItemList', itemListElement: services.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.name, url: site + '/services/' + encodeURIComponent(s.id) + '/' })) } };
    body = servicesIndexBody(services);
  } else if (detail) {
    const s = service(detail[1]);
    if (!s) return null;
    title = s.name + ' in Coimbatore | Packages and prices';
    description = s.summary || s.overview;
    keywords = ART[s.id]?.keywords || s.name;
    body = serviceBody(s, published);
    schema = serviceSchema(s, site, site + '/#business');
  } else if (path === '/blog') {
    title = 'Guides from our blog'; description = 'Guides for building and growing your business.';
    body = `<section class="shell section"><h1>${title}</h1><p class="lead">${description}</p><div class="grid3">${state.posts.filter(p => p.published !== false).map(p => postCard(p, service(p.service))).join('')}</div></section>`;
  } else {
    const slug = path.slice(6);
    const post = state.posts.find(p => p.slug === slug && p.published !== false);
    if (post) { schema = { '@type': 'BlogPosting', headline: post.title, description: post.excerpt, mainEntityOfPage: url, publisher: { '@id': site + '/#business' } }; title = post.title; description = post.excerpt; body = articleHtml(post, service, { url: site + path + '/', posts: state.posts.filter(p => p.published !== false) }); }
    else { title = 'Guide not found'; description = ''; body = '<section class="shell section"><h1>Guide not found</h1><a href="/blog/">Browse published guides</a></section>'; status = 404; }
  }
  let html = await readFile(indexFile, 'utf8');
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(title) + ' · Vintorex</title>')
    .replace(/(<meta name="description" content=")[^"]*(")/, (_, a, b) => a + esc(description || '') + b)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, (_, a, b) => a + esc(title) + b)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, (_, a, b) => a + esc(description || '') + b)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, (_, a, b) => a + esc(site + path + '/') + b)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, (_, a, b) => a + esc(site + path + '/') + b)
    .replace(/<div id="app">[\s\S]*?(?=<div id="toasts")/, () => '<div id="app">' + siteHeader() + '<main id="main">' + body + '</main>' + siteFooter({ services }) + '</div>')
    .replace('<script type="module" src="/js/main.js"></script>', '<script src="/js/static.js" defer></script>')
    .replace(/<!-- seo-noscript -->[\s\S]*?<!-- \/seo-noscript -->/, '');
  const attr = value => () => esc(value);
  html = html.replace(/(?<=<meta name="twitter:title" content=")[^"]*/, attr(title))
    .replace(/(?<=<meta name="twitter:description" content=")[^"]*/, attr(description))
    .replace(/(?<=<meta name="keywords" content=")[^"]*/, attr(keywords || title))
    .replace(/(<link rel="alternate" hreflang="[^"]*" href=")[^"]*/g, (_, prefix) => prefix + esc(url));
  if (schema) {
    const json = JSON.stringify({ '@context': 'https://schema.org', ...schema }).replace(/</g, '\\u003c');
    html = html.replace('</head>', () => '<script type="application/ld+json" data-page-url="' + esc(url) + '">' + json + '</script></head>');
  }
  if (detail) {
    const image = site + serviceImagePath(detail[1]);
    html = html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*/g, (_, prefix) => prefix + esc(image))
      .replace(/(<meta (?:property="og:image:alt"|name="twitter:image:alt") content=")[^"]*/g, (_, prefix) => prefix + esc(ART[detail[1]]?.alt || title))
      .replace('og:image:type" content="image/png', 'og:image:type" content="image/jpeg')
      .replace('og:image:width" content="1200', 'og:image:width" content="1600')
      .replace('og:image:height" content="630', 'og:image:height" content="900');
  }
  if (detail) html = html.replace('<script src="/js/static.js" defer></script>', '<script type="module" src="/js/main.js"></script>');
  // Pages that run static.js instead of the app only need the chat module and its two imports preloaded.
  else html = html.replace(/<!-- app-preload\b[\s\S]*?<!-- \/app-preload -->/, () => ['chat', 'ui', 'routes'].map(m => `<link rel="modulepreload" href="/js/${m}.js">`).join('\n  '));
  if (status === 404) html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">');
  return { html, status };
}

export async function sitemap(site, file) {
  const { state } = readStore();
  const source = await readFile(file, 'utf8');
  const fixed = [...source.matchAll(/<url>[\s\S]*?<\/url>/g)].map(m => m[0]).filter(entry => !/<loc>[^<]*\/(blog|services)(?:\/|<)/.test(entry));
  const paths = ['/services/', '/blog/', ...state.catalog.services.map(s => '/services/' + s.id + '/'), ...state.posts.filter(p => p.published !== false).map(p => '/blog/' + p.slug + '/')];
  return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + fixed.join('') + paths.map(path => '<url><loc>' + esc(site + path) + '</loc></url>').join('') + '</urlset>';
}
