// Blog: evergreen guides, at least two per service.
// Articles avoid prices, dates and tool-specific details that go stale; live
// package prices are pulled from the catalog on the article page instead.
//
// Body format (a small Markdown subset rendered by md()):
//   ## Heading / ### Subheading, "- " bullets, "1. " numbered lists,
//   "> " callout, **bold**, [link text](#/internal/route)
import { POSTS as BUILD } from './build.js';
import { POSTS as GROW } from './grow.js';
import { POSTS as BRAND } from './brand.js';
import { POSTS as TECH } from './tech.js';
import { esc } from '../ui.js';

export const POSTS = [...BUILD, ...GROW, ...BRAND, ...TECH].map(p => ({
  ...p,
  minutes: Math.ceil(words(p) / 200),
}));

function words(p) {
  const text = [p.body, ...p.takeaways, ...p.faqs.flat()].join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}

export const post = slug => POSTS.find(p => p.slug === slug);
export const postsFor = serviceId => POSTS.filter(p => p.service === serviceId);

export const slugify = t => t.toLowerCase().replace(/&amp;/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Escape first, then allow bold and internal (#/…) links only. `base` is
// prefixed to app links, e.g. '/' on static pages so they reach the app.
function inline(t, base) {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((#\/[^)\s]+)\)/g, `<a href="${base}$2">$1</a>`);
}

export function md(src, base = '') {
  return src.trim().split(/\n\s*\n/).map(block => {
    const lines = block.trim().split('\n').map(l => l.trim());
    const first = lines[0];
    const rest = lines.length > 1 ? md(lines.slice(1).join('\n'), base) : '';
    const il = t => inline(t, base);
    if (first.startsWith('### ')) return `<h3>${il(first.slice(4))}</h3>${rest}`;
    if (first.startsWith('## ')) { const t = first.slice(3); return `<h2 id="${slugify(t)}">${il(t)}</h2>${rest}`; }
    if (lines.every(l => l.startsWith('- '))) return `<ul>${lines.map(l => `<li>${il(l.slice(2))}</li>`).join('')}</ul>`;
    if (lines.every(l => /^\d+\. /.test(l))) return `<ol>${lines.map(l => `<li>${il(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
    if (first.startsWith('> ')) return `<aside class="callout">${il(lines.map(l => l.replace(/^> ?/, '')).join(' '))}</aside>`;
    return `<p>${il(lines.join(' '))}</p>`;
  }).join('');
}

// Table of contents from the article's ## headings.
export const toc = p => [...p.body.matchAll(/^\s*## (.+)$/gm)].map(m => [slugify(m[1]), m[1]]);
