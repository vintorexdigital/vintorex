// A decorative aquarium behind the page. All coordinates use viewport pixels.
const canvas = document.createElement('canvas');
canvas.className = 'water-background';
canvas.setAttribute('aria-hidden', 'true');
canvas.setAttribute('role', 'presentation');
document.body.prepend(canvas);
const context = canvas.getContext('2d');
if (context) startAquarium();
else canvas.remove();

function startAquarium() {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = [18, 38, 55, 145, 176, 205, 248, 278, 315, 345];
  const fish = [];
  const ripples = [];
  let width = 1, height = 1, frame = 0, lastFrame = 0, elapsed = 0;
  let dashboard = Boolean(document.querySelector('.dash'));
  let lastRipple = -Infinity;
  let pointer = null;
  let nextAppearance = 10 + Math.random() * 8;

  function resize() {
    const oldWidth = width;
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    fish.forEach(item => { item.x *= width / oldWidth; });
    pointer = null;
    draw();
  }

  function appear() {
    const direction = Math.random() < .5 ? -1 : 1;
    fish.push({
      x: width * (direction > 0 ? .15 : .85),
      depth: .2 + Math.random() * .6,
      hue: colors[Math.floor(Math.random() * colors.length)],
      size: (width < 600 ? 15 : 20) + Math.random() * 6,
      direction,
      speed: 14 + Math.random() * 8,
      phase: Math.random() * Math.PI * 2,
      offsetX: 0, offsetY: 0,
      appearedAt: elapsed,
      nextJump: Math.random() < .45 ? elapsed + 2 + Math.random() : Infinity,
      jumpStart: null,
    });
  }

  function addRipple(x, y, strength = 1) {
    if (ripples.length >= 24) ripples.shift();
    ripples.push({ x, y, age: 0, strength });
  }

  function interact(event) {
    if (motion.matches || dashboard || document.hidden) return;
    pointer = { x: event.clientX, y: event.clientY, at: elapsed };
    const now = performance.now();
    if (event.type === 'pointerdown' || now - lastRipple > 100) {
      lastRipple = now;
      addRipple(pointer.x, pointer.y, event.type === 'pointerdown' ? 1.5 : 1);
    }
  }

  function waves() {
    context.fillStyle = '#edf9fc';
    context.fillRect(0, 0, width, height);
    const wash = context.createLinearGradient(0, 0, width, height);
    wash.addColorStop(0, '#f4f8ff');
    wash.addColorStop(.5, '#e0f4f7');
    wash.addColorStop(1, '#e9ecff');
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height);
    const spacing = Math.max(110, height / 5);
    for (let row = -1; row < height / spacing + 1; row++) {
      context.beginPath();
      for (let x = -20; x <= width + 20; x += 12) {
        const y = row * spacing + 50
          + Math.sin(x / Math.max(85, width * .16) + elapsed * .45 + row) * 18
          + Math.sin(x / 170 - elapsed * .3 + row * 2) * 10;
        if (x === -20) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = 'rgba(255,255,255,.8)';
      context.lineWidth = 2;
      context.stroke();
      context.lineTo(width + 20, (row + 1) * spacing + 70);
      context.lineTo(-20, (row + 1) * spacing + 70);
      context.closePath();
      const water = context.createLinearGradient(0, row * spacing, 0, (row + 1) * spacing + 70);
      water.addColorStop(0, 'rgba(79,172,195,.15)');
      water.addColorStop(1, 'rgba(145,216,226,0)');
      context.fillStyle = water;
      context.fill();
    }
  }

  function drawFish(item) {
    const age = elapsed - item.appearedAt;
    const opacity = Math.max(0, Math.min(1, age / 1.2, (7 - age) / 1.5));
    const baseY = height * item.depth + Math.sin(elapsed * .8 + item.phase) * 14;
    const jumping = item.jumpStart !== null;
    const progress = jumping ? Math.min(1, (elapsed - item.jumpStart) / 1.6) : 0;
    const lift = jumping ? Math.sin(progress * Math.PI) * Math.min(100, height * .15) : 0;
    const x = item.x + item.offsetX, y = baseY + item.offsetY - lift;
    context.save();
    context.globalAlpha = .67 * opacity;
    if (jumping) {
      context.beginPath();
      context.ellipse(x, baseY + 8, item.size * (1 - progress * .3), 4, 0, 0, Math.PI * 2);
      context.fillStyle = 'rgba(45,128,155,.1)';
      context.fill();
    }
    context.translate(x, y);
    context.scale(item.direction, 1);
    context.rotate(jumping ? (progress - .5) * 1.2 : Math.sin(elapsed + item.phase) * .06);
    context.scale(item.size / 24, item.size / 24);
    const flap = Math.sin(elapsed * 7 + item.phase);
    // Forked tail, fins, and a rounded body with a two-color sheen.
    context.fillStyle = `hsl(${item.hue + 25} 80% 64%)`;
    context.beginPath();
    context.moveTo(-15, 0);
    context.bezierCurveTo(-23, -7, -33, -14 - flap * 3, -31, -6);
    context.lineTo(-26 + flap * 2, 0);
    context.lineTo(-32, 12 + flap * 2);
    context.quadraticCurveTo(-22, 9, -15, 0);
    context.fill();
    context.beginPath();
    context.moveTo(-7, -9);
    context.quadraticCurveTo(-3, -26, 11, -9);
    context.moveTo(-4, 8);
    context.quadraticCurveTo(4, 24, 12, 8);
    context.fill();
    const body = context.createLinearGradient(0, -13, 4, 13);
    body.addColorStop(0, `hsl(${item.hue} 90% 71%)`);
    body.addColorStop(.55, `hsl(${item.hue} 83% 53%)`);
    body.addColorStop(1, `hsl(${item.hue + 35} 88% 77%)`);
    context.fillStyle = body;
    context.beginPath();
    context.moveTo(25, 0);
    context.bezierCurveTo(13, -17, -7, -18, -19, 0);
    context.bezierCurveTo(-6, 16, 13, 16, 25, 0);
    context.fill();
    context.strokeStyle = 'rgba(255,255,255,.65)';
    context.lineWidth = 3;
    for (let stripe = 0; stripe < 3; stripe++) {
      context.beginPath();
      context.moveTo(-10 + stripe * 8, -8);
      context.quadraticCurveTo(-4 + stripe * 8, 0, -10 + stripe * 8, 8);
      context.stroke();
    }
    context.fillStyle = 'rgba(255,255,255,.8)';
    context.beginPath();
    context.ellipse(16, -3, 3.6, 4, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#203f58';
    context.beginPath();
    context.arc(17, -3, 1.9, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    waves();
    fish.forEach(drawFish);
    for (const ripple of ripples) {
      const progress = ripple.age / 1.6;
      const radius = (8 + progress * Math.min(width * .22, 140)) * ripple.strength;
      context.lineWidth = 1.8 * (1 - progress) + .3;
      for (let ring = 0; ring < 3; ring++) {
        context.strokeStyle = ring % 2 ? `rgba(255,255,255,${(1 - progress) * .85})` : `rgba(52,147,184,${(1 - progress) * .48})`;
        context.beginPath();
        context.ellipse(ripple.x, ripple.y, Math.max(1, radius - ring * 7), Math.max(1, radius * .65 - ring * 5), 0, 0, Math.PI * 2);
        context.stroke();
      }
    }
  }

  function animate(timestamp) {
    frame = requestAnimationFrame(animate);
    if (lastFrame && timestamp - lastFrame < 1000 / 30) return;
    const delta = lastFrame ? Math.min((timestamp - lastFrame) / 1000, .06) : 0;
    lastFrame = timestamp;
    elapsed += delta;
    if (pointer && elapsed - pointer.at > 1.2) pointer = null;
    if (fish.length && elapsed - fish[0].appearedAt >= 7) {
      fish.length = 0;
      nextAppearance = elapsed + 22 + Math.random() * 20;
    }
    if (!fish.length && elapsed >= nextAppearance) appear();
    for (const item of fish) {
      item.x += item.direction * item.speed * delta;
      if (item.x > width + 65) item.x = -65;
      if (item.x < -65) item.x = width + 65;
      const dx = item.x - (pointer?.x ?? -1000);
      const dy = height * item.depth - (pointer?.y ?? -1000);
      const distance = Math.hypot(dx, dy);
      const influence = pointer ? Math.max(0, 1 - distance / 150) : 0;
      const smoothing = Math.min(1, delta * 3);
      item.offsetX += ((dx / (distance || 1)) * influence * 60 - item.offsetX) * smoothing;
      item.offsetY += ((dy / (distance || 1)) * influence * 45 - item.offsetY) * smoothing;
      if (item.jumpStart === null && elapsed >= item.nextJump && item.x > 50 && item.x < width - 50) {
        item.jumpStart = elapsed;
        addRipple(item.x, height * item.depth, .65);
      }
      if (item.jumpStart !== null && elapsed - item.jumpStart >= 1.6) {
        item.jumpStart = null;
        item.nextJump = Infinity;
        addRipple(item.x, height * item.depth, 1.1);
      }
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].age += delta;
      if (ripples[i].age >= 1.6) ripples.splice(i, 1);
    }
    draw();
  }

  function syncAnimation() {
    cancelAnimationFrame(frame);
    lastFrame = 0;
    dashboard = Boolean(document.querySelector('.dash'));
    canvas.hidden = dashboard;
    if (motion.matches) {
      ripples.length = 0;
      fish.length = 0;
      nextAppearance = elapsed + 10 + Math.random() * 8;
      draw();
    } else if (!document.hidden && !dashboard) frame = requestAnimationFrame(animate);
  }
  resize();
  syncAnimation();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', interact, { passive: true });
  window.addEventListener('pointerdown', interact, { passive: true });
  window.addEventListener('pointerout', event => { if (!event.relatedTarget) pointer = null; });
  document.addEventListener('visibilitychange', syncAnimation);
  motion.addEventListener('change', syncAnimation);
  const app = document.getElementById('app');
  if (app) new MutationObserver(syncAnimation).observe(app, { childList: true });
}
