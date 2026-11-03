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
});

const canvas = reveal.querySelector('canvas');
const ctx = canvas.getContext('2d');
const claim = reveal.querySelector('[data-unlock]');
let drawing = false;
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ticket = reveal.querySelector('.offer-ticket');
  ticket.classList.add('celebrating');
  const colors = ['#8254de', '#e59c23', '#268c83', '#e16870'];
  for (let i = 0; i < 18; i++) {
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
    if (animate) celebrate();
  } finally { drawing = false; }
}
claim.onclick = run(() => unlocked ? step(1) : unlock());
if (ctx) {
  ctx.fillStyle = '#675387';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Scratch to reveal', 240, 80);
  ctx.globalCompositeOperation = 'destination-out';
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
if (!location.hash) openOffer();

run(restore)();
