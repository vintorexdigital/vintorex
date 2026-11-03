import("./water.js");
// Small enhancements for the static blog pages (no app code is loaded there).
(() => {
  const $ = s => document.querySelector(s);

  // Mobile menu: opening it focuses the first link (the menu sits before its button);
  // a link or Escape closes it.
  const menu = $('.menu-btn'), links = $('#nav-links');
  const setMenu = open => { links.classList.toggle('open', open); menu.setAttribute('aria-expanded', open); };
  menu?.addEventListener('click', () => {
    const open = !links.classList.contains('open');
    setMenu(open);
    if (open) links.querySelector('a')?.focus();
  });
  links?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links?.classList.contains('open')) { setMenu(false); menu.focus(); }
  });

  // The floating header firms up once the page scrolls under it
  const bar = $('.topbar');
  const markScrolled = () => bar?.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', markScrolled, { passive: true });
  markScrolled();

  // Cart badge from the app's saved cart
  try {
    const n = (JSON.parse(localStorage.getItem('vx_cart')) || []).reduce((s, i) => s + (i.qty || 1), 0);
    const badge = $('.cart-btn .count');
    if (badge && n) { badge.textContent = n; badge.hidden = false; }
  } catch { /* storage unavailable */ }

  // Copy-link button on articles
  $('[data-copy]')?.addEventListener('click', async e => {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); e.target.textContent = 'Copied!'; }
    catch { e.target.textContent = 'Copy failed'; }
  });

  // Search on the blog index
  const q = $('#blog-q');
  if (q) {
    const cards = [...document.querySelectorAll('[data-search]')];
    const groups = [...document.querySelectorAll('.blog-group')];
    const count = $('#blog-count');
    const run = () => {
      const term = q.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach(c => { const hit = !term || c.dataset.search.includes(term); c.hidden = !hit; if (hit) shown++; });
      groups.forEach(g => { g.hidden = !g.querySelector('[data-search]:not([hidden])'); });
      count.textContent = term ? `${shown} guide${shown === 1 ? '' : 's'} match “${q.value.trim()}”` : '';
    };
    q.addEventListener('input', run);
    $('#blog-search')?.addEventListener('submit', e => { e.preventDefault(); run(); });
  }
})();
