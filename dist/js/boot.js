// Starts the one request every page of the app needs (/api/auth/session: catalog, prices and the signed-in user)
// while the browser is still downloading the app's modules, instead of after they have all arrived. Classic
// script, loaded async from index.html; db.js picks the promise up in init(). Same options as shared-store.js.
window.__vxSession = fetch('/api/auth/session', {
  credentials: 'same-origin', cache: 'no-store',
  headers: { 'Content-Type': 'application/json', 'X-VX-Request': '1' },
}).catch(() => null);
