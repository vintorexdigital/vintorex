import { pipeline } from 'node:stream';
import { createGzip } from 'node:zlib';

// Stream compression without blocking the event loop or caching private responses.
export function sendAsset(req, res, status, headers, size, openStream) {
  const compressible = size >= 1024 && /^(text\/|application\/(json|xml|manifest\+json)|image\/svg)/.test(headers['Content-Type']);
  const gzip = compressible && (req.headers['accept-encoding'] || '').split(',').some(entry => {
    const [name, quality = 'q=1'] = entry.trim().toLowerCase().split(/\s*;\s*/);
    return name === 'gzip' && Number(quality.slice(2)) > 0;
  });
  if (compressible) headers.Vary = 'Accept-Encoding';
  if (gzip) headers['Content-Encoding'] = 'gzip';
  else headers['Content-Length'] = size;
  if (headers.ETag && req.headers['if-none-match']?.split(/\s*,\s*/).includes(headers.ETag)) {
    delete headers['Content-Length'];
    res.writeHead(304, headers);
    return res.end();
  }
  res.writeHead(status, headers);
  if (req.method === 'HEAD') return res.end();
  const streams = [openStream()];
  if (gzip) streams.push(createGzip({ level: 4 }));
  pipeline(...streams, res, () => {});
}

