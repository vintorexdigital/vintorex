import { SERVICES, BUSINESS } from './data.js';
const dialog = document.querySelector('.offer-dialog');
const form = dialog.querySelector('form');
const reveal = dialog.querySelector('[data-reveal]');
const [choose, brief] = form.querySelectorAll('fieldset');
const ready = form.querySelector('[data-ready]');
const panels = [reveal, choose, brief, ready];
const labels = ['Welcome offer', 'Service', 'Project details', 'Review'];
let stage = 0;
let unlocked = false;
const storage = 'vx_offer_draft_v1';
let draft;
try { draft = JSON.parse(sessionStorage.getItem(storage)) || {}; } catch { draft = {}; }
let saved;
const status = dialog.querySelector('[data-status]');
const money = n => '₹' + n.toLocaleString('en-IN');
async function token() {
  const { auth } = await import('./firebase/auth.js');
  await auth.authStateReady();
  return auth.currentUser?.getIdToken();
}
async function api(path, body, id) {
  const res = await fetch('/api/offers/'+path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type':'application/json', ...(id ? {Authorization:'Bearer '+id} : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const result = await res.json();
  if (!res.ok) throw Error(result.error || 'Offer request failed.');
  return result;
}
function updateCards(amount) {
  for (const card of document.querySelectorAll('[data-from]')) {
    const service = SERVICES.find(s=>s.id===card.dataset.from);
    const base = Math.min(...service.tiers.map(t=>t.price));
    card.textContent = 'From '+money(Math.max(0,base-amount))+' with coupon (usually '+money(base)+') →';
  }
}
function persist() { sessionStorage.setItem(storage, JSON.stringify(draft)); }
function updatePrice() {
  const service = SERVICES.find(s => s.id === form.elements.service.value);
  const tier = service?.tiers.find(t => t.name === form.elements.tier.value);
  const net = tier && Math.max(0,tier.price - draft.amount);
  form.querySelector('[data-price]').textContent = tier ? `Package ${money(tier.price)} · After coupon ${money(net)} · Including GST ${money(net + Math.round(net * BUSINESS.gst/100))}` : '';
}
function tiers() {
  const service = SERVICES.find(s => s.id === form.elements.service.value);
  form.elements.tier.replaceChildren(...(service?.tiers || []).map(t => new Option(t.name,t.name)));
  updatePrice();
}
form.elements.service.onchange = tiers;
form.elements.tier.onchange = updatePrice;
function run(fn) {
  return async () => {
    try { status.textContent = ''; await fn(); }
    catch (err) { status.textContent = err.message; }
  };
}

function step(index) {
  stage = index;
  for (const [i, panel] of panels.entries()) {
    panel.hidden = i !== index;
    if (panel.tagName === 'FIELDSET') panel.disabled = panel.hidden;
  }
  dialog.querySelector('[data-progress]').textContent = `Step ${index + 1} of 4 · ${labels[index]}${index ? ' · ' + (saved?.code || draft.code || '') : ''}`;
  panels[index].querySelector('button,select,input,a')?.focus();
}
function openOffer() {
  if (!dialog.open) {
    dialog.showModal();
    step(stage);
    pageSky?.pause();
    dialogSky?.resume();
    if (stage === 0 && !unlocked) dialogSky?.welcome();
  }
}
document.querySelectorAll('[data-open-offer], .announce-cta').forEach(link => link.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  openOffer();
}));
dialog.querySelector('[data-close]').onclick = () => dialog.close();
dialog.addEventListener('close', () => {
  document.querySelector('#enquire a').focus({ preventScroll: true });
  dialogSky?.pause();
  pageSky?.resume();
  if (pageSky && !pageSky.greeted) {
    pageSky.greeted = true;
    pageSky.welcome();
  }
});

const canvas = reveal.querySelector('canvas');
const ctx = canvas.getContext('2d');
const claim = reveal.querySelector('[data-unlock]');
let drawing = false;
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ticket = reveal.querySelector('.offer-ticket');
  ticket.classList.add('celebrating');
  const colors = ['#ffd56a', '#ff5d2a', '#fff6d0', '#ff4d8d', '#f0b429'];
  for (let i = 0; i < 22; i++) {
    const piece = document.createElement('i');
    piece.className = 'offer-confetti';
    piece.setAttribute('aria-hidden', 'true');
    const angle = i * Math.PI * 2 / 18;
    piece.style.setProperty('--dx', Math.cos(angle) * (45 + Math.random() * 95) + 'px');
    piece.style.setProperty('--dy', Math.sin(angle) * 75 + 'px');
    piece.style.backgroundColor = colors[i % colors.length];
    ticket.append(piece);
  }
  setTimeout(() => {
    ticket.classList.remove('celebrating');
    ticket.querySelectorAll('.offer-confetti').forEach(piece => piece.remove());
  }, 950);
  const origin = ticketOrigin();
  dialogSky?.surprise(origin);
  ['Shubh Diwali', 'Surprise', 'Free audit'].forEach((text, i) => {
    setTimeout(() => popSurprise(dialog, origin.x + (i - 1) * Math.min(120, innerWidth * 0.28), origin.y - 28), 160 * i);
  });
}
async function unlock(animate = true) {
  if (drawing || unlocked) return;
  drawing = true;
  try {
    if (!draft.proof) { Object.assign(draft, await api('draw', {})); persist(); }
    unlocked = true;
    updateCards(draft.amount);
    canvas.hidden = true;
    reveal.querySelector('[data-value]').textContent = money(draft.amount) + ' off';
    reveal.querySelector('[data-code]').textContent = draft.code;
    claim.textContent = 'Choose my service →';
    reveal.querySelector('p').textContent = 'Your cracker burst open. This Diwali offer is yours to use on one service.';
    if (animate) {
      celebrate();
      status.textContent = `Your Diwali offer is open: ${money(draft.amount)} off.`;
    }
  } finally { drawing = false; }
}
claim.onclick = run(() => unlocked ? step(1) : unlock());
if (ctx) {
  paintCracker(ctx, canvas);
  const cells = new Set();
  function scratch(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    ctx.beginPath(); ctx.arc(x, y, 25, 0, 2 * Math.PI); ctx.fill();
    cells.add(Math.floor(x / 30) + ',' + Math.floor(y / 30));
    if (cells.size >= 10) run(unlock)();
  }
  canvas.onpointerdown = e => { canvas.setPointerCapture(e.pointerId); scratch(e); };
  canvas.onpointermove = e => { if (canvas.hasPointerCapture(e.pointerId)) scratch(e); };
}
form.querySelector('[data-next]').onclick = () => { if (form.reportValidity()) step(2); };
form.querySelector('[data-back]').onclick = () => step(1);
form.querySelector('[data-edit]').onclick = () => step(2);
form.addEventListener('submit', event => {
  event.preventDefault();
  if (stage === 1) { step(2); return; }
  const { name, business, service, goal } = form.elements;
  Object.assign(draft, { name:name.value.trim(), business:business.value.trim(), service:service.value, tier:form.elements.tier.value, goal:goal.value.trim() });
  persist();
  ready.querySelector('[data-preview]').textContent = [draft.name, SERVICES.find(s=>s.id===draft.service).name+' · '+draft.tier, draft.goal, form.querySelector('[data-price]').textContent].join('\n');
  step(3);
});
function showSaved(row) {
  saved = row;
  updateCards(row.amount);
  const svc = SERVICES.find(s=>s.id===row.service);
  ready.querySelector('[data-preview]').textContent = [row.name, svc.name+' · '+row.tier, row.code+' · '+money(row.amount)+' coupon',
    'Package '+money(row.price)+' · Discount '+money(Math.min(row.amount,row.price)),
    'Total including GST '+money(row.total), row.paid ? 'Settled' : 'Saved. Return here to pay whenever you’re ready.'].join('\n');
  for (const key of ['save','register','login','edit']) ready.querySelector('[data-'+key+']').hidden = true;
  ready.querySelector('[data-pay]').hidden = !!row.paid;
  sessionStorage.removeItem(storage);
  step(3);
}
const saveButton = ready.querySelector('[data-save]');
async function saveClaim() {
  saveButton.disabled = true;
  try {
    const id = await token();
    if (!id) {
      draft.awaiting = true; persist();
      saveButton.hidden = true;
      ready.querySelector('[data-register]').hidden = false;
      ready.querySelector('[data-login]').hidden = false;
      status.textContent = 'Register or sign in to attach this coupon to your account.';
      return;
    }
    showSaved(await api('claim',draft,id));
  } finally { saveButton.disabled = false; }
}
saveButton.onclick = run(saveClaim);
const payButton = ready.querySelector('[data-pay]');
payButton.onclick = run(async () => {
  payButton.disabled = true;
  try {
    const id = await token();
    const order = await api('pay',{},id);
    if (!order.paid) {
      const { pay } = await import('./pay.js');
      if (!await pay(order,{ name:saved.name,email:saved.email,description:saved.tier })) return;
    }
    showSaved((await api('me',undefined,id)).claim);
  } finally { payButton.disabled = false; }
});
async function restore() {
  const id = await token();
  if (id) {
    const { claim } = await api('me',undefined,id);
    if (claim) { showSaved(claim); return; }
    if (draft.awaiting) { await saveClaim(); return; }
  }
  if (draft.proof) await unlock(false);
  if (draft.service) {
    form.elements.service.value=draft.service; tiers(); form.elements.tier.value=draft.tier; updatePrice();
    for(const field of ['name','goal','business']) form.elements[field].value=draft[field] || '';
    step(2);
  }
}
if (location.hash === '#enquire') history.replaceState(history.state, '', location.pathname + location.search);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.body.classList.add('diwali-offer');
const announce = document.querySelector('.announce p');
if (announce) announce.innerHTML = '<span class="live-dot" aria-hidden="true"></span>Diwali special · scratch a cracker<span class="announce-more"> · a surprise off your project</span>';
const announceCta = document.querySelector('.announce-cta');
if (announceCta) announceCta.innerHTML = 'Light the surprise <span aria-hidden="true">→</span>';
let pageSky = null;
let dialogSky = null;
if (!reducedMotion) {
  pageSky = mountCrackerSky(document.body, 'diwali-sky');
  dialogSky = mountCrackerSky(dialog, 'diwali-burst');
  addEventListener('resize', () => { pageSky.resize(); dialogSky.resize(); });
  const gifts = ['A studio spark', 'Fresh work', 'Three calm steps', 'Your offer'];
  const seen = new WeakSet();
  const sections = [...document.querySelectorAll('.offer-page > section')];
  function sparkSection(section) {
    if (seen.has(section) || section.classList.contains('offer-hero')) return;
    const rect = section.getBoundingClientRect();
    const visible = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
    if (visible / Math.max(rect.height, 1) < 0.45) return;
    seen.add(section);
    pageSky.burst(rect.left + rect.width * 0.72, Math.max(88, rect.top + 36), 'flower');
    pageSky.chakri(rect.left + 48, Math.min(innerHeight - 20, rect.bottom - 8));
    popSurprise(document.body, rect.left + rect.width * 0.5, rect.top + 32, gifts[sections.indexOf(section)] || 'Surprise');
  }
  const watch = new IntersectionObserver(entries => {
    if (dialog.open) return;
    for (const entry of entries) if (entry.isIntersecting) sparkSection(entry.target);
  }, { threshold: 0.45 });
  for (const section of sections) watch.observe(section);
  dialog.addEventListener('close', () => {
    for (const section of sections) sparkSection(section);
  });
}
if (!location.hash) openOffer();
else if (pageSky) {
  pageSky.resume();
  pageSky.greeted = true;
  pageSky.welcome();
}

run(restore)();

function ticketOrigin() {
  const rect = reveal.querySelector('.offer-ticket').getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
function popSurprise(root, x, y, text) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const chip = document.createElement('span');
  chip.className = 'diwali-surprise';
  chip.setAttribute('aria-hidden', 'true');
  chip.textContent = text;
  chip.style.left = Math.max(24, Math.min(innerWidth - 24, x)) + 'px';
  chip.style.top = Math.max(24, y) + 'px';
  root.append(chip);
  setTimeout(() => chip.remove(), 1200);
}
function paintCracker(context, surface) {
  const foil = context.createLinearGradient(0, 0, surface.width, surface.height);
  foil.addColorStop(0, '#7a1a28');
  foil.addColorStop(0.38, '#d4651a');
  foil.addColorStop(0.72, '#f2c14e');
  foil.addColorStop(1, '#fff1c4');
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = foil;
  context.fillRect(0, 0, surface.width, surface.height);
  context.strokeStyle = 'rgba(255,248,220,.45)';
  context.lineWidth = 2;
  for (let x = -40; x < surface.width; x += 28) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + 70, surface.height);
    context.stroke();
  }
  context.fillStyle = '#fff8e8';
  context.font = 'bold 22px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Scratch the cracker', surface.width / 2, surface.height / 2 - 8);
  context.font = '13px sans-serif';
  context.fillStyle = 'rgba(255,248,232,.9)';
  context.fillText('a Diwali surprise is inside', surface.width / 2, surface.height / 2 + 18);
  context.globalCompositeOperation = 'destination-out';
}
function mountCrackerSky(parent, className) {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  canvas.setAttribute('aria-hidden', 'true');
  parent.append(canvas);
  const ctx = canvas.getContext('2d');
  const sparks = [];
  const rockets = [];
  const spinners = [];
  const timers = new Set();
  const palettes = [
    ['#fff6d0', '#ffd56a', '#ff9f1c', '#ff5d2a'],
    ['#fff', '#ffd6e8', '#ff4d8d', '#c81d5a'],
    ['#fffbe8', '#ffe08a', '#ffb703', '#e85d04'],
  ];
  let alive = false;
  let raf = 0;
  let ambientTimer = 0;
  const width = () => canvas.clientWidth || innerWidth;
  const height = () => canvas.clientHeight || innerHeight;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width() * dpr));
    canvas.height = Math.max(1, Math.floor(height() * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function pushSpark(spark) {
    if (sparks.length > 480) sparks.shift();
    sparks.push(spark);
  }
  function kick() {
    if (!raf && alive) raf = requestAnimationFrame(frame);
  }
  function burst(x, y, kind = 'flower') {
    const colors = palettes[Math.floor(Math.random() * palettes.length)];
    const count = kind === 'ring' ? 42 : kind === 'willow' ? 34 : 56;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.18;
      const speed = kind === 'ring' ? 2.2 + Math.random() * 0.7 : kind === 'willow' ? 0.8 + Math.random() * 2.6 : 1.2 + Math.random() * 4.1;
      pushSpark({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        g: kind === 'willow' ? 0.05 : 0.03, drag: 0.986,
        life: kind === 'willow' ? 78 : 48 + Math.random() * 18, age: 0,
        color: colors[i % colors.length], size: kind === 'ring' ? 2.1 : 1.5 + Math.random() * 1.6,
      });
    }
    pushSpark({ x, y, vx: 0, vy: 0, g: 0, drag: 1, life: 12, age: 0, color: '#fffaf0', size: 9, flash: true });
    kick();
  }
  function anaar(x, y) {
    for (let i = 0; i < 26; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.85;
      const speed = 2 + Math.random() * 5.2;
      pushSpark({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        g: 0.065, drag: 0.99, life: 34 + Math.random() * 18, age: 0,
        color: Math.random() > 0.25 ? '#ffd56a' : '#fff6d8', size: 1.3 + Math.random(),
      });
    }
    kick();
  }
  function chakri(x, y) {
    spinners.push({ x, y, age: 0, life: 46, angle: Math.random() * Math.PI * 2 });
    kick();
  }
  function launch(x, y, targetY) {
    rockets.push({
      x, y, targetY, vy: -8.2 - Math.random() * 2, vx: (Math.random() - 0.5) * 0.7,
      kind: ['flower', 'willow', 'ring'][Math.floor(Math.random() * 3)],
    });
    kick();
  }
  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); if (alive) fn(); }, ms);
    timers.add(id);
  }
  function frame() {
    const w = width();
    const h = height();
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const rocket of rockets) {
      rocket.x += rocket.vx;
      rocket.y += rocket.vy;
      rocket.vy *= 0.992;
      pushSpark({ x: rocket.x, y: rocket.y, vx: (Math.random() - 0.5) * 0.4, vy: 1.4, g: 0.02, drag: 0.96, life: 14, age: 0, color: '#ffd56a', size: 1.6 });
      if (rocket.y <= rocket.targetY) {
        burst(rocket.x, rocket.y, rocket.kind);
        rocket.dead = true;
      }
    }
    for (let i = rockets.length - 1; i >= 0; i--) if (rockets[i].dead) rockets.splice(i, 1);
    for (const spinner of spinners) {
      spinner.age += 1;
      spinner.angle += 0.48;
      for (let arm = 0; arm < 3; arm++) {
        const angle = spinner.angle + arm * (Math.PI * 2 / 3);
        pushSpark({
          x: spinner.x, y: spinner.y, vx: Math.cos(angle) * 3.4, vy: Math.sin(angle) * 3.4,
          g: 0.012, drag: 0.93, life: 16, age: 0, color: arm === 1 ? '#ff4d6a' : '#ffd56a', size: 1.7,
        });
      }
    }
    for (let i = spinners.length - 1; i >= 0; i--) if (spinners[i].age > spinners[i].life) spinners.splice(i, 1);
    for (const spark of sparks) {
      spark.age += 1;
      spark.vx *= spark.drag;
      spark.vy = spark.vy * spark.drag + spark.g;
      spark.x += spark.vx;
      spark.y += spark.vy;
      const fade = 1 - spark.age / spark.life;
      if (fade <= 0) continue;
      ctx.globalAlpha = Math.max(0, fade);
      ctx.fillStyle = spark.color;
      ctx.strokeStyle = spark.color;
      if (!spark.flash) {
        ctx.lineWidth = Math.max(1, spark.size * 0.7);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(spark.x, spark.y);
        ctx.lineTo(spark.x - spark.vx * 3.4, spark.y - spark.vy * 3.4);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.flash ? spark.size * fade : spark.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].age >= sparks[i].life) sparks.splice(i, 1);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    raf = alive && (sparks.length || rockets.length || spinners.length) ? requestAnimationFrame(frame) : 0;
  }
  function arm(delay) {
    clearTimeout(ambientTimer);
    if (!alive) return;
    ambientTimer = setTimeout(() => {
      if (!alive || document.hidden) return;
      const w = width();
      const h = height();
      const roll = Math.random();
      if (roll < 0.34) anaar(w * (0.08 + Math.random() * 0.84), h * 0.94);
      else if (roll < 0.62) chakri(w * (0.12 + Math.random() * 0.76), h * 0.9);
      else launch(w * (0.18 + Math.random() * 0.64), h + 8, h * (0.16 + Math.random() * 0.24));
      arm(4200 + Math.random() * 2800);
    }, delay);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(ambientTimer);
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (alive) {
      arm(700);
      kick();
    }
  });
  return {
    greeted: false,
    resize,
    resume() {
      if (alive) return;
      alive = true;
      resize();
      arm(1600);
    },
    pause() {
      alive = false;
      clearTimeout(ambientTimer);
      for (const id of timers) clearTimeout(id);
      timers.clear();
      sparks.length = 0;
      rockets.length = 0;
      spinners.length = 0;
      cancelAnimationFrame(raf);
      raf = 0;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width(), height());
    },
    welcome() {
      const w = width();
      const h = height();
      anaar(w * 0.08, h * 0.9);
      anaar(w * 0.92, h * 0.9);
      chakri(w * 0.2, h * 0.86);
      chakri(w * 0.8, h * 0.86);
      later(() => launch(w * 0.18, h * 0.96, h * 0.34), 180);
      later(() => launch(w * 0.82, h * 0.96, h * 0.28), 460);
      later(() => launch(w * 0.5, h * 0.96, h * 0.14), 760);
    },
    surprise(origin) {
      const w = width();
      const h = height();
      const x = origin?.x ?? w / 2;
      const y = origin?.y ?? h * 0.38;
      burst(x, y, 'flower');
      later(() => burst(x - Math.min(150, w * 0.18), y + 28, 'ring'), 160);
      later(() => burst(x + Math.min(160, w * 0.2), y - 18, 'willow'), 320);
      later(() => burst(x, Math.max(72, y - 96), 'flower'), 500);
      later(() => {
        anaar(w * 0.14, h * 0.94);
        anaar(w * 0.86, h * 0.94);
        chakri(w * 0.5, h * 0.92);
      }, 220);
    },
    burst, chakri,
  };
}
