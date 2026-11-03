import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const files = new Map();
const fail = (status, message) => Object.assign(new Error(message), { status });

export async function resolvePost(value) {
  let url;
  try { url = new URL(value); } catch { /* Invalid input is handled below. */ }
  const post = url?.pathname.match(/^\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]{1,32})\/?$/);
  if (!post || !['instagram.com', 'www.instagram.com', 'm.instagram.com'].includes(url.hostname) || !['https:', 'http:'].includes(url.protocol)) {
    throw fail(400, 'Enter a public Instagram post or Reel URL.');
  }
  let media;
  try {
    const response = await fetch('https://www.instagram.com/' + post[1] + '/' + post[2] + '/embed/captioned/', { redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (response.ok) {
      const html = await response.text();
      const payload = html.match(/"contextJSON"\s*:\s*("(?:\\.|[^"\\])*")/);
      const context = payload && JSON.parse(JSON.parse(payload[1]));
      if (context && !context.context?.copyright_blocked) media = context.gql_data?.shortcode_media;
    }
  } catch { throw fail(502, 'Instagram could not be reached. Try again shortly.'); }
  if (!media || media.shortcode !== post[2]) throw fail(422, 'Instagram did not provide downloadable media for this post.');
  const items = media.edge_sidecar_to_children?.edges.map(edge => edge.node) || [media];
  const downloads = [];
  for (const [index, item] of items.entries()) {
    const video = item.is_video || item.__typename === 'GraphVideo';
    const source = video ? item.video_url : item.display_url;
    if (!source) continue;
    const cdn = new URL(source);
    if (cdn.protocol !== 'https:' || cdn.port || cdn.username || cdn.password || !/\.(cdninstagram\.com|fbcdn\.net)$/.test(cdn.hostname)) continue;
    const token = randomUUID();
    for (const [key, entry] of files) if (entry.expires <= Date.now()) files.delete(key);
    if (files.size >= 1000) files.delete(files.keys().next().value);
    const name = post[2] + '-' + (index + 1) + (video ? '.mp4' : '.jpg');
    files.set(token, { url: cdn.href, name, video, expires: Date.now() + 600000 });
    downloads.push({ href: '/api/vintorent/file/' + token, label: 'Download ' + (video ? 'video' : 'photo') + (items.length > 1 ? ' ' + (index + 1) : '') });
  }
  if (!downloads.length) throw fail(422, 'No downloadable file was available for this post.');
  return { downloads };
}

export async function downloadFile(token, res) {
  const file = files.get(token);
  if (!file || file.expires <= Date.now()) throw fail(410, 'This download has expired. Submit the post again.');
  let upstream;
  try {
    upstream = await fetch(file.url, { redirect: 'error', signal: AbortSignal.timeout(120000) });
  } catch { throw fail(502, 'Instagram could not deliver the file. Submit the post again.'); }
  const type = upstream.headers.get('content-type')?.split(';')[0];
  if (!upstream.ok || !(file.video ? ['video/mp4', 'application/octet-stream'] : ['image/jpeg', 'image/webp', 'image/png']).includes(type)) {
    await upstream.body?.cancel();
    throw fail(502, 'Instagram could not deliver the file. Submit the post again.');
  }
  const name = file.name.replace(/\.jpg$/, type === 'image/webp' ? '.webp' : type === 'image/png' ? '.png' : '.jpg');
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Content-Disposition': 'attachment; filename="' + name + '"' });
  await pipeline(Readable.fromWeb(upstream.body), res);
}
