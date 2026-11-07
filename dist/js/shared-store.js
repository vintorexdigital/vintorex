export const collectionNames = ['services', 'plans', 'addons', 'products', 'coupons', 'posts', 'users', 'orders', 'subscriptions', 'leads', 'tickets'];
export const records = (state, name) => state.catalog[name] || state[name];
export const recordId = (name, row) => row[name === 'posts' ? 'slug' : name === 'coupons' ? 'code' : 'id'];
// `started` is an optional fetch already in flight for the same GET (js/boot.js starts the session request early).
export async function request(path, body, started) {
  const response = (body === undefined && await started) || await fetch(path, {
    credentials: 'same-origin', cache: 'no-store',
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-VX-Request': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('The shared database requires the application server. Start the project with npm start.'); }
  if (!response.ok) throw Object.assign(new Error(result.error || 'The change could not be saved.'), { status: response.status });
  return result;
}
export function changesBetween(before, after) {
  const changes = [];
  for (const name of collectionNames) {
    const old = new Map((records(before, name) || []).map(r => [recordId(name, r), r]));
    const next = new Map((records(after, name) || []).map(r => [recordId(name, r), r]));
    for (const [id, record] of next) {
      if (JSON.stringify(old.get(id)) !== JSON.stringify(record)) changes.push({ name, id, record });
    }
    for (const id of old.keys()) if (!next.has(id)) changes.push({ name, id, record: null });
  }
  return changes;
}
