import { esc, icon } from '../ui.js';
import { ART, serviceImagePath } from '../service-art.js';

const HUE = { build: 255, grow: 155, brand: 18, tech: 205, ai: 285 };
export const postUrl = p => `/blog/${p.slug}/`;

export function cover(p, s, size = '') {
  const h = HUE[s?.cat] ?? 255;
  const img = p?.image || (p?.slug ? `/images/blog/${p.slug}.jpg` : (s?.id ? serviceImagePath(s.id) : ''));
  const alt = p?.imageAlt || (p?.title ? `${p.title} guide cover` : (s?.id ? (ART[s.id]?.alt ? `${ART[s.id].alt}. Guide: ${p.title}` : '') : ''));
  return `<div class="cover ${size}" style="--h:${h}">
    ${img ? `<img class="cover-art-img" src="${img}" alt="${esc(alt)}" width="1600" height="900" loading="lazy">` : `
    <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="cg-${p.slug}-${size || 'card'}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 75% 58%)"/><stop offset="1" stop-color="hsl(${(h + 40) % 360} 70% 32%)"/></linearGradient></defs>
    <rect width="320" height="160" fill="url(#cg-${p.slug}-${size || 'card'})"/><circle cx="270" cy="20" r="70" fill="hsl(${h} 90% 85% / .18)"/><circle cx="40" cy="150" r="60" fill="hsl(${(h + 60) % 360} 90% 80% / .15)"/></svg>`}
    <div class="cover-overlay" aria-hidden="true"></div>
    <span class="cover-ic">${icon(s?.icon || 'star')}</span></div>`;
}

export const postCard = (p, s, attrs = '') => `<a class="card post-card" href="${postUrl(p)}" ${attrs}>
  ${cover(p, s)}
  <div class="post-body"><span class="tag">${esc(s?.name || '')}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p>
  <small class="muted">${icon('star')} ${p.minutes} min read · Evergreen guide</small></div></a>`;

