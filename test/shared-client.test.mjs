import test from 'node:test';
import assert from 'node:assert/strict';

test('shared client saves profile edits, queues changes and recovers after a rejected write', async t => {
  const originalFetch = globalThis.fetch, originalDocument = globalThis.document;
  t.after(() => { globalThis.fetch = originalFetch; globalThis.document = originalDocument; });
  globalThis.document = new EventTarget();
  let revision = 0, rejectWrite = false;
  const state = {
    catalog: { services: [], plans: [], addons: [], products: [], coupons: [] },
    posts: [], users: [{ id: 'u_customer', name: 'Customer', role: 'customer' }], orders: [], subscriptions: [], leads: [], tickets: [], settings: { gst: 18 },
  };
  const snapshot = () => ({ revision, state: structuredClone(state), user: structuredClone(state.users[0]) });
  globalThis.fetch = async (path, options) => {
    if (options.method === 'POST') {
      if (rejectWrite) { rejectWrite = false; return Response.json({ error: 'Records changed on another device.' }, { status: 409 }); }
      const body = JSON.parse(options.body);
      assert.equal(body.revision, revision);
      for (const change of body.changes) {
        const rows = state.catalog[change.name] || state[change.name];
        const index = rows.findIndex(r => r.id === change.id);
        if (index < 0) rows.push(change.record); else rows[index] = change.record;
      }
      revision++;
    }
    return Response.json(snapshot());
  };
  const D = await import('../dist/js/db.js');
  await D.init();
  assert.equal(D.currentUser(), D.db().users[0]);
  D.currentUser().name = 'Updated customer';
  await D.save(); await D.flush();
  assert.equal(state.users[0].name, 'Updated customer');
  D.currentUser().phone = '1234567890';
  const first = D.save();
  D.currentUser().company = 'Example';
  const second = D.save();
  await Promise.all([first, second]); await D.flush();
  assert.equal(state.users[0].phone, '1234567890');
  assert.equal(state.users[0].company, 'Example');
  rejectWrite = true;
  D.currentUser().name = 'Rejected';
  await D.save();
  assert.equal(D.currentUser().name, 'Updated customer');
  // A later normal edit must work even if an existing caller never invoked flush after failure.
  D.currentUser().name = 'Recovered';
  await D.save(); await D.flush();
  assert.equal(state.users[0].name, 'Recovered');
});
