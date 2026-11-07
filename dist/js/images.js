// Responsive photographs. Every JPEG under /images/{blog,services,shop,work} and the studio photos have WebP
// copies at the widths below, made by `npm run build:images:webp` (scripts/optimize-images.mjs). The browser
// picks the smallest copy that fills its slot, so a phone downloads ~30 KB instead of the 800 KB original.
// The JPEG stays as the social-preview (og:image) file and as the source for the WebP copies.
export const IMAGE_WIDTHS = [480, 800, 1200, 1600];

// `sizes` presets for the places photographs appear. Percentages follow the card grids in app.css.
export const SIZES = {
  card: '(max-width: 640px) 94vw, (max-width: 1100px) 46vw, 31vw',          // cards3 / post-card / product / svc thumb
  wide: 'calc(100vw - 2 * clamp(16px, 3vw, 80px))',                          // article hero, service page hero (full .shell width)
  serviceArt: '(max-width: 640px) 94vw, (max-width: 1000px) 520px, 40vw',   // .service-art in the detail header
  half: '(max-width: 900px) 94vw, 46vw',                                     // two-column rows (work, about)
};

const escapeAttr = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// `/images/blog/seo-fundamentals.jpg` at 800px wide is `/images/blog/seo-fundamentals-800.webp`.
export const variantPath = (source, width) => source.replace(/\.(jpe?g|png)$/i, `-${width}.webp`);

// Widths that make sense for a photograph that is `width` pixels wide at most (never upscale).
export const widthsFor = width => IMAGE_WIDTHS.filter(w => w <= (width || 1600));

export const srcsetFor = (source, width) => widthsFor(width).map(w => `${variantPath(source, w)} ${w}w`).join(', ');

// Responsive <img> for a photograph. `source` is the original JPEG path, `width`/`height` its intrinsic size
// (keeps the layout stable before it loads). Pass `priority: true` for the one picture above the fold.
export function photo(source, { alt = '', sizes = SIZES.card, width = 1600, height = 900, className = '', priority = false, loading, attrs = '' } = {}) {
  const widths = widthsFor(width);
  const fallback = variantPath(source, widths.includes(800) ? 800 : widths[widths.length - 1]);
  const lazy = loading || (priority ? 'eager' : 'lazy');
  return `<img${className ? ` class="${className}"` : ''} src="${fallback}" srcset="${srcsetFor(source, width)}" sizes="${sizes}" alt="${escapeAttr(alt)}" width="${width}" height="${height}" loading="${lazy}"${priority ? ' fetchpriority="high"' : ''} decoding="async"${attrs ? ' ' + attrs : ''}>`;
}
