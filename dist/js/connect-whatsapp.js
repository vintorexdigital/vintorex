// /connect-whatsapp?invite=…: a client connects their own WhatsApp Business Account through Meta's Embedded Signup.
// The invite is a signed link made by Vintorex (POST /api/whatsapp/partner/invite). The server finishes the setup;
// this page only runs Meta's popup and passes on the code, which lasts 30 seconds, with the ids Meta reports.
import { esc, icon, $ } from './ui.js';

const SDK = 'https://connect.facebook.net/en_US/sdk.js';
let sdk;
const loadSdk = cfg => sdk ||= new Promise((resolve, reject) => {
  window.fbAsyncInit = () => { FB.init({ appId: cfg.appId, autoLogAppEvents: true, xfbml: false, version: cfg.graphVersion }); resolve(); };
  const s = document.createElement('script');
  s.src = SDK; s.async = true; s.crossOrigin = 'anonymous';
  s.onerror = () => { sdk = null; s.remove(); reject(new Error('Facebook could not be loaded. Check your connection and any ad blocker, then try again.')); };
  document.head.append(s);
});

async function api(path, options) {
  const res = await fetch('/api/whatsapp/' + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export function connectWhatsapp(params, query) {
  const invite = query.get('invite') || '';
  return {
    title: 'Connect WhatsApp', noindex: true,
    html: `<section class="shell section auth"><div class="card" id="connect">
      <h1>Connect your WhatsApp</h1>
      <p class="muted" data-intro>Checking your invite…</p>
      <p class="err" hidden></p>
      <div data-done hidden></div>
      <button class="btn primary block lg" data-start hidden>${icon('wa')} Connect with Facebook</button>
      <p class="fine muted center">Vintorex never sees your Facebook password. You choose which WhatsApp number to connect, and you can disconnect at any time in WhatsApp Manager.</p>
    </div></section>`,
    bind: root => {
      const box = $('#connect', root), intro = $('[data-intro]', box), err = $('.err', box), start = $('[data-start]', box), done = $('[data-done]', box);
      const fail = e => { err.hidden = false; err.textContent = e.message; start.disabled = false; };
      if (!invite) return (intro.textContent = '', fail(new Error('This page needs the invite link Vintorex sent you.')));

      let cfg, session, code, sent = false;
      // Meta reports the new account's ids in a message event and the code through FB.login's callback, in either order.
      const finish = async () => {
        if (sent || !session || !code) return;
        sent = true;
        intro.textContent = 'Finishing setup…';
        try {
          await api('signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invite, code, wabaId: session.waba_id, phoneNumberId: session.phone_number_id }) });
          intro.textContent = '';
          start.hidden = true;
          done.hidden = false;
          done.innerHTML = `<p><b>${icon('check')} Your WhatsApp number is connected.</b></p><p class="muted">Vintorex can now set up your messages. If you have not yet added a payment method, do it in <a href="https://business.facebook.com/wa/manage/home/" target="_blank" rel="noopener">WhatsApp Manager</a> → Overview → Add payment method.</p>`;
        } catch (e) { sent = false; session = code = null; intro.textContent = 'Setup did not finish.'; fail(e); }
      };
      window.addEventListener('message', e => {
        if (!e.origin.endsWith('facebook.com')) return;
        let data; try { data = JSON.parse(e.data); } catch { return; }
        if (data.type !== 'WA_EMBEDDED_SIGNUP') return;
        if (/^FINISH/.test(data.event) && data.data?.waba_id && data.data?.phone_number_id) { session = data.data; finish(); }
        else if (data.event === 'ERROR') fail(new Error(data.data?.error_message || 'WhatsApp reported an error. Please try again.'));
      });

      api('signup?invite=' + encodeURIComponent(invite)).then(c => {
        cfg = c;
        intro.innerHTML = `Hello <b>${esc(c.name)}</b>. Connect your WhatsApp Business account so Vintorex can send and receive messages for you.`;
        start.hidden = false;
      }).catch(e => { intro.textContent = ''; fail(e); });

      start.addEventListener('click', async () => {
        err.hidden = true; start.disabled = true; session = code = null; sent = false;
        try { await loadSdk(cfg); } catch (e) { return fail(e); }
        FB.login(r => {
          start.disabled = false;
          if (r.authResponse?.code) { code = r.authResponse.code; finish(); }
          else if (!session) fail(new Error('Setup was cancelled before it finished.'));
        }, { config_id: cfg.configId, response_type: 'code', override_default_response_type: true, extras: { version: 'v5' } });
      });
    },
  };
}
