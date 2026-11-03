// The waves use CSS so they keep flowing even without pointer input.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let layer;
let lastRipple = -Infinity;

function ripple(event) {
  if (document.hidden || reducedMotion.matches || document.querySelector('.dash')) return;
  const now = performance.now();
  if (event.type === 'pointermove' && now - lastRipple < 135) return;
  lastRipple = now;
  if (!layer?.isConnected) {
    layer = document.createElement('div');
    layer.className = 'water-ripples';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
  }
  const ring = document.createElement('i');
  ring.style.left = event.clientX + 'px';
  ring.style.top = event.clientY + 'px';
  if (layer.childElementCount >= 16) layer.firstElementChild.remove();
  layer.append(ring);
  ring.addEventListener('animationend', () => ring.remove(), { once: true });
}
window.addEventListener('pointermove', ripple, { passive: true });
window.addEventListener('pointerdown', ripple, { passive: true });

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) layer?.replaceChildren();
});
