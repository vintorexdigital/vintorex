import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { createGunzip, createBrotliDecompress, createInflate } from 'node:zlib';

const blocked = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 3],
]) blocked.addSubnet(address, prefix);
const error = message => Object.assign(new Error(message), { status: 422 });

export function auditUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) throw error('Enter a public website address.');
  let url;
  try { url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value.trim()) ? value.trim() : 'https://' + value.trim()); }
  catch { throw error('Enter a valid website address.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port ||
      !url.hostname.includes('.') || url.hostname.endsWith('.') || isIP(url.hostname.replace(/[\[\]]/g, '')) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example|onion)$/.test(url.hostname)) {
    throw error('Use a public HTTP or HTTPS domain without credentials or a custom port.');
  }
  // Public audit URLs carry no query strings or fragments, which can contain private tokens.
  url.search = ''; url.hash = '';
  return url;
}

export async function publicAddress(hostname, resolver = lookup) {
  const addresses = await resolver(hostname, { family: 4, all: true }).catch(() => { throw error('Could not resolve this domain.'); });
  if (!addresses.length || addresses.some(({ address }) => isIP(address) !== 4 || blocked.check(address, 'ipv4'))) throw error('This domain does not resolve to a public internet address.');
  return addresses[0].address;
}

// Resolve and pin every hop to a public IP. Redirects cannot reach local services or metadata endpoints.
export async function fetchAudit(value, { signal, maxBytes = 2 * 1024 * 1024, method = 'GET' } = {}) {
  let url = auditUrl(String(value));
  const redirects = [];
  for (let hop = 0; hop <= 4; hop++) {
    const timeout = AbortSignal.timeout(8000);
    const stop = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const address = await Promise.race([
      publicAddress(url.hostname),
      new Promise((_, reject) => stop.addEventListener('abort', () => reject(error('Website request timed out.')), { once: true })),
    ]);
    const start = performance.now();
    const response = await new Promise((resolve, reject) => {
      const request = (url.protocol === 'https:' ? https : http).get(url, {
        method, hostname: address, servername: url.hostname, agent: false, signal: stop,
        headers: { Host: url.host, 'User-Agent': 'VintorexAudit/1.0 (+https://vintorex.com/seo-audit)', Accept: 'text/html,application/xml,text/plain', 'Accept-Encoding': 'gzip, br, deflate' },
      }, resolve);
      request.on('error', () => reject(error('Could not retrieve this public URL.')));
    });
    const responseMs = Math.round(performance.now() - start);
    if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
      redirects.push({ url: url.href, status: response.statusCode });
      response.destroy();
      url = auditUrl(new URL(response.headers.location, url).href);
      continue;
    }
    const headers = new Headers();
    for (const [name, value] of Object.entries(response.headers)) if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    const encoding = response.headers['content-encoding'];
    const decoder = method === 'HEAD' ? null : { gzip: createGunzip, br: createBrotliDecompress, deflate: createInflate }[encoding];
    const stream = decoder ? response.pipe(decoder()) : response;
    if (stream !== response) response.on('error', err => stream.destroy(err));
    const chunks = [];
    let size = 0;
    try {
      for await (const chunk of stream) {
        size += chunk.length;
        if (size > maxBytes) throw error('This response exceeds the 2 MB analysis limit.');
        chunks.push(chunk);
      }
    } finally { stream.destroy(); response.destroy(); }
    return { url: url.href, status: response.statusCode, ok: response.statusCode >= 200 && response.statusCode < 300,
      headers, text: Buffer.concat(chunks).toString('utf8'), bytes: size, responseMs, redirects };
  }
  throw error('The website redirected too many times.');
}
