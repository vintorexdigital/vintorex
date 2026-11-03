import { isIP } from 'node:net';

// Enable only when a local reverse proxy appends the actual peer address to X-Forwarded-For.
export function clientIp(req) {
  const peer = req.socket.remoteAddress;
  if (process.env.TRUST_LOCAL_PROXY !== '1' || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(peer)) return peer;
  const last = req.headers['x-forwarded-for']?.split(',').at(-1)?.trim();
  return last && isIP(last) ? last : peer;
}
