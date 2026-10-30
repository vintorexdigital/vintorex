// Chat assistant widget, loaded on every page (the app and the static pages).
// Answers come from /api/chat on the Node server (server/chat.mjs); on hosting
// without it the launcher never appears. The conversation lives in sessionStorage,
// so it follows the visitor between pages until the tab is closed.
import { esc, icon } from './ui.js';

const API = '/api/chat';
const KEY = 'vx_chat';
const MAX = 1000; // characters per question, as on the server
const small = () => matchMedia('(max-width: 640px)').matches;

let status, launcher, panel, log, input, live, controller;
let state = { messages: [], open: false };
try { state = { ...state, ...JSON.parse(sessionStorage.getItem(KEY)) }; } catch { /* storage unavailable */ }
const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ ...state, messages: state.messages.slice(-30) })); } catch { /* storage unavailable */ } };

// ---------- answer formatting ----------
// Escaped first, then a small Markdown subset. Links are kept only for this site,
// WhatsApp, phone and email; [n] citations link to the answer's sources.
const SITE_LINK = /^(\/|#\/|https:\/\/(vintorex\.com|wa\.me)\/|tel:|mailto:)/;
const link = (href, label) => `<a href="${href}"${/^https:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
const literal = s => esc(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CITES = /\[(\d+(?:\]\[\d+|,\s*\d+)*)\]/g;
const citeNums = list => list.split(/\]\[|,\s*/).map(Number);

function inline(t, sources) {
  // One pass, so a link that was just made is never matched again.
  const tokens = new RegExp([
    /\[([^\]]+)\]\(([^)\s]+)\)/.source,
    CITES.source,
    /(^|[\s(])(\/#\/[\w\-/#]*|\/(?:services|blog|faq|terms|privacy-policy|refund-policy|shipping-policy)\/[\w\-/]*|https:\/\/(?:vintorex\.com|wa\.me)\/[^\s<)]*)/.source,
    `(${literal(status.contact.phone)})`,
    `(${literal(status.contact.email)})`,
  ].join('|'), 'g');
  return t
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(?=\S)(.+?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(tokens, (m, label, href, cites, pre, path, phone, email) => {
      if (label) return SITE_LINK.test(href) ? link(href, label) : label;
      if (cites) return citeNums(cites).map(n => sources[n - 1] ? `<a class="vxc-cite" href="${esc(sources[n - 1].url)}" title="${esc(sources[n - 1].title)}">${n}</a>` : '').join('');
      if (path) return pre + link(path, path.replace(/^https:\/\//, ''));
      if (phone) return `<a href="tel:${phone.replace(/\s/g, '')}">${phone}</a>`;
      return `<a href="mailto:${email}">${email}</a>`;
    });
}

function format(text, sources = []) {
  let html = '', list = '';
  const close = () => { if (list) html += `</${list}>`; list = ''; };
  for (const line of esc(text).split('\n').map(l => l.trim())) {
    const item = line.match(/^(?:([-*•])|\d+[.)])\s+(.*)/);
    if (item) {
      const tag = item[1] ? 'ul' : 'ol';
      if (list !== tag) { close(); html += `<${tag}>`; list = tag; }
      html += `<li>${inline(item[2], sources)}</li>`;
    } else {
      close();
      if (line) html += `<p>${inline(line.replace(/^#+\s*/, ''), sources)}</p>`;
    }
  }
  close();
  return html;
}

// Sources the answer actually cites, one per page.
function cited(m) {
  const nums = new Set([...m.content.matchAll(CITES)].flatMap(x => citeNums(x[1])));
  const seen = new Set();
  return (m.sources || []).filter(s => nums.has(s.n) && !seen.has(s.url) && seen.add(s.url));
}

// ---------- rendering ----------
const lastQuestion = () => [...state.messages].reverse().find(m => m.role === 'user')?.content || '';
const whatsapp = () => `${status.contact.whatsapp}?text=${encodeURIComponent(`Hi Vintorex, I was chatting with your website assistant${lastQuestion() ? ` about: ${lastQuestion().slice(0, 300)}` : '.'}`)}`;

function handover() {
  return `<div class="vxc-handover"><span>Talk to a person:</span>
    <a class="chip" href="${esc(whatsapp())}" target="_blank" rel="noopener">${icon('wa')} WhatsApp</a>
    <a class="chip" href="tel:${status.contact.phone.replace(/\s/g, '')}">${icon('phoneCall')} Call</a>
    <a class="chip" href="/#/contact">${icon('mail')} Get a quote</a></div>`;
}

function message(m, last) {
  if (m.role === 'user') return `<div class="vxc-msg me"><div class="vxc-bubble">${esc(m.content).replace(/\n/g, '<br>')}</div></div>`;
  const body = m.content ? format(m.content, m.sources) : m.note ? '' : '<span class="vxc-typing" role="status" aria-label="The assistant is typing"><i></i><i></i><i></i></span>';
  const sources = cited(m);
  return `<div class="vxc-msg bot"><div class="vxc-bubble">${body}${m.note ? `<p class="vxc-note">${esc(m.note)}</p>` : ''}</div>
    ${sources.length ? `<div class="vxc-sources"><span>Sources</span>${sources.map(s => `<a href="${esc(s.url)}">${esc(s.title.replace(/^Guide: /, '').split(' — ')[0])}</a>`).join('')}</div>` : ''}
    ${last && (m.content || m.note) && !controller ? handover() : ''}</div>`;
}

function render() {
  if (!log) return;
  const welcome = `<div class="vxc-msg bot"><div class="vxc-bubble"><p>Hi! I’m the Vintorex assistant. Ask me about our services, packages, prices, payments or the free audit.</p>
    <p>I answer from this website${status.ai ? '' : ' (quick links mode)'}, and I can connect you with the team for a custom quote.</p></div></div>`;
  const chips = state.messages.length ? '' : `<div class="vxc-suggest">${status.suggestions.map(q => `<button type="button" class="chip" data-ask="${esc(q)}">${esc(q)}</button>`).join('')}</div>`;
  log.innerHTML = welcome + chips + state.messages.map((m, i) => message(m, i === state.messages.length - 1)).join('');
  log.scrollTop = log.scrollHeight;
}

// While an answer streams, only its bubble is redrawn (once per frame).
let frame;
function paint(m) {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const bubble = log.querySelector('.vxc-msg:last-child .vxc-bubble');
    if (!bubble) return;
    const stick = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    bubble.innerHTML = format(m.content, m.sources);
    if (stick) log.scrollTop = log.scrollHeight;
  });
}

// ---------- talking to the server ----------
async function ask(question) {
  question = question.trim().slice(0, MAX);
  if (!question || controller) return;
  const history = state.messages.filter(m => m.content).map(({ role, content }) => ({ role, content }));
  const m = { role: 'assistant', content: '', sources: [] };
  state.messages.push({ role: 'user', content: question }, m);
  const mine = controller = new AbortController();
  render(); save();
  try {
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: mine.signal,
      body: JSON.stringify({ messages: [...history, { role: 'user', content: question }].slice(-9), page: location.pathname + location.hash }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'The assistant is unavailable right now.');
    const reader = res.body.getReader(), decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      const events = (buffer += decoder.decode(value, { stream: true })).split('\n\n');
      buffer = events.pop();
      for (const event of events) {
        let e;
        try { e = JSON.parse(event.replace(/^data: ?/, '')); } catch { continue; }
        if (e.type === 'sources') m.sources = e.sources;
        else if (e.type === 'text') { m.content += e.text; paint(m); }
        else if (e.type === 'error') m.note = e.message;
      }
    }
    if (!m.content && !m.note) m.note = 'Sorry, I couldn’t answer that. Please try again.';
  } catch (err) {
    if (mine.signal.aborted) return; // "New chat" dropped this conversation
    m.note = err instanceof TypeError ? 'I couldn’t reach the assistant. Check your connection and try again.' : err.message;
  } finally {
    if (controller === mine) controller = null;
    save();
    render();
  }
  if (live) live.textContent = `Assistant: ${(m.content || m.note || '').replace(/\[\d+\]|\*\*/g, '')}`;
  if (panel.hidden) launcher.classList.add('has-new');
}

// ---------- panel ----------
function build() {
  if (panel) return;
  panel = document.createElement('section');
  panel.className = 'vxc-panel';
  panel.id = 'vxc-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'vxc-title');
  panel.innerHTML = `<header class="vxc-head">
      <img src="/images/vintorex-logo.png" alt="" width="38" height="38" decoding="async">
      <div class="grow"><h2 id="vxc-title">Vintorex Assistant</h2><p><span class="vxc-dot"></span>${status.ai ? 'AI answers from our website' : 'Quick answers from our website'}</p></div>
      <button type="button" class="vxc-icon" data-new aria-label="Start a new chat" title="New chat">${icon('repeat')}</button>
      <button type="button" class="vxc-icon" data-close aria-label="Close chat" title="Close">${icon('x')}</button>
    </header>
    <div class="vxc-log" aria-label="Conversation"></div>
    <form class="vxc-form">
      <textarea rows="1" maxlength="${MAX}" placeholder="Ask about prices or services…" aria-label="Your question" enterkeyhint="send"></textarea>
      <button class="vxc-send" aria-label="Send">${icon('arrow')}</button>
    </form>
    <p class="vxc-fine">AI answers can be wrong: check prices on the service page. Please don’t share passwords or payment details.</p>
    <div class="vxc-live" aria-live="polite"></div>`;
  document.body.append(panel);
  log = panel.querySelector('.vxc-log');
  input = panel.querySelector('textarea');
  live = panel.querySelector('.vxc-live');

  const send = () => { const q = input.value; input.value = ''; grow(); ask(q); };
  const grow = () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    input.style.overflowY = input.scrollHeight > 120 ? 'auto' : '';
  };
  panel.querySelector('form').addEventListener('submit', e => { e.preventDefault(); send(); });
  input.addEventListener('input', grow);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  panel.querySelector('[data-close]').addEventListener('click', close);
  panel.querySelector('[data-new]').addEventListener('click', () => { controller?.abort(); controller = null; state.messages = []; save(); render(); input.focus(); });
  log.addEventListener('click', e => {
    const chip = e.target.closest('[data-ask]');
    if (chip) return ask(chip.dataset.ask);
    // On phones the panel covers the page, so following a link closes it.
    if (e.target.closest('a') && small()) close(false);
  });

  // Keep the full-screen panel above the on-screen keyboard on phones.
  const fit = () => {
    const v = visualViewport;
    panel.style.height = small() && v ? `${v.height}px` : '';
    panel.style.top = small() && v ? `${v.offsetTop}px` : '';
  };
  visualViewport?.addEventListener('resize', fit);
  visualViewport?.addEventListener('scroll', fit);
  render();
}

function open() {
  build();
  panel.hidden = false;
  launcher.setAttribute('aria-expanded', 'true');
  launcher.classList.remove('has-new');
  document.documentElement.classList.add('vxc-open');
  state.open = true;
  save();
  log.scrollTop = log.scrollHeight;
  if (!small() || !state.messages.length) input.focus();
}

function close(focus = true) {
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  launcher.setAttribute('aria-expanded', 'false');
  document.documentElement.classList.remove('vxc-open');
  state.open = false;
  save();
  if (focus) launcher.focus();
}

// Asked once per tab session (refreshed after 10 minutes). Static hosting answers 404.
async function start() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY + '_status'));
    if (saved && Date.now() - saved.at < 600e3) status = saved;
  } catch { /* storage unavailable */ }
  if (!status) {
    try {
      const res = await fetch(API, { signal: AbortSignal.timeout(4000) });
      if (!res.ok || !res.headers.get('content-type')?.includes('json')) return;
      status = { ...await res.json(), at: Date.now() };
      try { sessionStorage.setItem(KEY + '_status', JSON.stringify(status)); } catch { /* storage unavailable */ }
    } catch { return; }
  }
  if (!status.enabled) return;
  launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'vxc-launch';
  launcher.setAttribute('aria-label', 'Chat with the Vintorex assistant');
  launcher.setAttribute('aria-controls', 'vxc-panel');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.innerHTML = `${icon('spark', 'vxc-ic-open')}${icon('x', 'vxc-ic-close')}`;
  launcher.addEventListener('click', () => panel && !panel.hidden ? close() : open());
  document.body.append(launcher);
  if (state.open && !small()) open();
}

start();
