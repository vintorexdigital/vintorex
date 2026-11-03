import { esc, field, modal, confirmBox } from './ui.js';
import * as D from './db.js';
import { request } from './shared-store.js';

export function offerLeads() {
  return { title: 'Qualified offer leads', html: `<section class="dash-head"><div><h1>Qualified offer leads</h1><p>Registered service claims, payment status and follow-ups.</p></div><button class="btn primary" data-add-offer>Add offer</button></section>
    <p data-feedback role="status"></p><div class="cards2" data-offer-leads></div>`, bind(root) {
    const list = root.querySelector('[data-offer-leads]'), feedback = root.querySelector('[data-feedback]');
    async function load() {
      try {
        const rows = await request('/api/offers/admin');
        feedback.textContent = rows.length + ' qualified leads';
        list.innerHTML = rows.map(r => `<form class="card pad" data-uid="${esc(r.uid)}"><h3>${esc(r.name)}</h3><p>${esc(r.email)} · ${esc(r.business)}</p>
          <p>${r.paid ? 'Settled' : 'Awaiting payment'}</p><p>${esc(D.service(r.service)?.name || r.service)} · ${esc(r.tier)}</p>
          <p>${esc(r.goal)}</p><p>${esc(r.code)} · ₹${r.amount.toLocaleString('en-IN')} coupon · Final ₹${r.total.toLocaleString('en-IN')}</p>
          ${field('Next follow-up', 'followup', { type: 'date', required: true, value: r.followup })}
          ${field('Follow-up note', 'note', { rows: 3, value: r.note, attrs: 'maxlength="2000"' })}
          <div class="row gap"><button class="btn ghost">Save follow-up</button><button type="button" class="btn danger-ghost" data-delete-offer="${esc(r.uid)}" ${r.orderId || r.paid ? 'disabled title="Payment records must be retained"' : ''}>Delete</button></div></form>`).join('');
      } catch (error) { feedback.textContent = error.message; }
    }
    root.querySelector('[data-add-offer]').onclick = async () => {
      const services = D.catalog().services;
      const form = await modal({ title: 'Create offer', wide: true, body: `
        ${field('Firebase account UID', 'uid', { required: true })}
        ${field('Email', 'email', { type: 'email', required: true })}
        ${field('Name', 'name', { required: true })}
        ${field('Business', 'business')}
        ${field('Project goal', 'goal', { required: true, rows: 3 })}
        ${field('Service and package', 'package', { options: services.flatMap(s => s.tiers.map(t => [s.id + '|' + t.name, s.name + ' · ' + t.name])) })}` });
      if (!form) return;
      const data = Object.fromEntries(form);
      [data.service, data.tier] = data.package.split('|');
      try { await request('/api/offers/admin', { ...data, action: 'create' }); await load(); }
      catch (error) { feedback.textContent = error.message; }
    };
    list.onsubmit = async event => {
      event.preventDefault();
      try { await request('/api/offers/admin', { uid: event.target.dataset.uid, ...Object.fromEntries(new FormData(event.target)) }); feedback.textContent = 'Follow-up saved.'; }
      catch (error) { feedback.textContent = error.message; }
    };
    list.onclick = async event => {
      const button = event.target.closest('[data-delete-offer]');
      if (!button || !await confirmBox('Delete offer?', 'This removes the unpaid claim from the shared database.', 'Delete')) return;
      try { await request('/api/offers/admin', { uid: button.dataset.deleteOffer, action: 'delete' }); await load(); }
      catch (error) { feedback.textContent = error.message; }
    };
    load();
  }};
}
