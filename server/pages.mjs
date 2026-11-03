import { readFile } from 'node:fs/promises';
import { siteHeader, siteFooter } from '../dist/js/chrome.js';
import { articleHtml, postCard } from '../dist/js/blog/render.js';
import { esc } from '../dist/js/ui.js';
import { readStore } from './store.mjs';

// Shared content is rendered on each request so edits also reach direct links and crawlers.
export async function contentPage(pathname, site, indexFile) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path !== '/blog' && !path.startsWith('/blog/') && path !== '/services') return null;
  const { state } = readStore();
  const services = state.catalog.services;
  const service = id => services.find(s => s.id === id);
  let title, description, body, status = 200;
  if (path === '/services') {
    title = 'Services'; description = 'Explore our services and current packages.';
    body = `<section class="shell section"><h1>Services</h1><p class="lead">${description}</p><div class="grid3">${services.map(s => `<a class="card pad" href="/services/${encodeURIComponent(s.id)}/"><h2>${esc(s.name)}</h2><p>${esc(s.summary)}</p><b>From ₹${Math.min(...s.tiers.map(t => t.price)).toLocaleString('en-IN')}</b></a>`).join('')}</div></section>`;
  } else if (path === '/blog') {
    title = 'Guides from our blog'; description = 'Guides for building and growing your business.';
    body = `<section class="shell section"><h1>${title}</h1><p class="lead">${description}</p><div class="grid3">${state.posts.filter(p => p.published !== false).map(p => postCard(p, service(p.service))).join('')}</div></section>`;
  } else {
    const slug = path.slice(6);
    const post = state.posts.find(p => p.slug === slug && p.published !== false);
    if (post) { title = post.title; description = post.excerpt; body = articleHtml(post, service, { url: site + path + '/', posts: state.posts.filter(p => p.published !== false) }); }
    else { title = 'Guide not found'; description = ''; body = '<section class="shell section"><h1>Guide not found</h1><a href="/blog/">Browse published guides</a></section>'; status = 404; }
  }
  let html = await readFile(indexFile, 'utf8');
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(title) + ' · Vintorex</title>')
    .replace(/(<meta name="description" content=")[^"]*(")/, (_, a, b) => a + esc(description || '') + b)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, (_, a, b) => a + esc(title) + b)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, (_, a, b) => a + esc(description || '') + b)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, (_, a, b) => a + esc(site + path + '/') + b)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, (_, a, b) => a + esc(site + path + '/') + b)
    .replace(/<div id="app">[\s\S]*?(?=<div id="toasts")/, '<div id="app">' + siteHeader() + '<main id="main">' + body + '</main>' + siteFooter({ services }) + '</div>')
    .replace('<script type="module" src="/js/main.js"></script>', '<script src="/js/static.js" defer></script>')
    .replace(/<!-- seo-noscript -->[\s\S]*?<!-- \/seo-noscript -->/, '');
  return { html, status };
}

export async function sitemap(site, file) {
  const { state } = readStore();
  const source = await readFile(file, 'utf8');
  const fixed = [...source.matchAll(/<url>[\s\S]*?<\/url>/g)].map(m => m[0]).filter(entry => !/<loc>[^<]*\/(blog|services)(?:\/|<)/.test(entry));
  const paths = ['/services/', '/blog/', ...state.catalog.services.map(s => '/services/' + s.id + '/'), ...state.posts.filter(p => p.published !== false).map(p => '/blog/' + p.slug + '/')];
  return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + fixed.join('') + paths.map(path => '<url><loc>' + esc(site + path) + '</loc></url>').join('') + '</urlset>';
}
