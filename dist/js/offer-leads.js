import { esc } from './ui.js';
import { SERVICES } from './data.js';

export function offerLeads() {
  return { title:'Qualified offer leads', html:`<section class="dash-head"><h1>Qualified offer leads</h1><p>Registered service claims, payment status, and the next follow-up.</p></section>
    <form class="card pad" data-unlock-leads><label>Offer admin key <input required type="password" autocomplete="off" name="key"></label>
    <button class="btn primary">Load leads</button></form><p data-feedback role="status"></p><div class="cards2" data-offer-leads></div>`, bind(root) {
    const auth = root.querySelector('[data-unlock-leads]');
    const list = root.querySelector('[data-offer-leads]');
    const feedback = root.querySelector('[data-feedback]');
    let key;
    async function request(body) {
      const res = await fetch('/api/offers/admin',{method:body?'POST':'GET',headers:{'x-offer-admin-key':key,'Content-Type':'application/json'},body:body&&JSON.stringify(body)});
      const data = await res.json();
      if (!res.ok) throw Error(data.error || 'Could not load offers.');
      return data;
    }
    auth.onsubmit = async e => {
      e.preventDefault(); key = auth.elements.key.value;
      try {
        const rows = await request();
        auth.elements.key.value = ''; feedback.textContent = rows.length+' qualified leads';
        list.innerHTML = rows.map(r => `<form class="card pad" data-uid="${esc(r.uid)}"><h3>${esc(r.name)}</h3><p>${esc(r.email)} · ${esc(r.business)}</p>
          <p>Qualified · ${r.paid?'Settled':'Awaiting payment'}</p><p>${esc(SERVICES.find(s=>s.id===r.service)?.name || r.service)} · ${esc(r.tier)}</p>
          <p>${esc(r.goal)}</p><p>${esc(r.code)} · ₹${r.amount.toLocaleString('en-IN')} coupon · Final ₹${r.total.toLocaleString('en-IN')}</p>
          <label class="field">Next follow-up<input type="date" required name="followup" value="${esc(r.followup)}"></label>
          <label class="field">Follow-up note<textarea name="note" maxlength="2000">${esc(r.note)}</textarea></label>
          <button class="btn ghost">Save follow-up</button></form>`).join('');
      } catch(err) { feedback.textContent=err.message; }
    };
    list.onsubmit = async e => {
      e.preventDefault(); const form=e.target;
      try { await request({uid:form.dataset.uid,...Object.fromEntries(new FormData(form))}); feedback.textContent='Follow-up saved.'; }
      catch(err) { feedback.textContent=err.message; }
    };
  }};
}
