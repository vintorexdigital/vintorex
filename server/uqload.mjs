import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const fail = message => Object.assign(new Error(message),{status:422});
const player = id => 'https://uqload.vc/embed-'+id+'.html';
async function page(url,referer) {
  const r = await fetch(url,{redirect:'error',headers:{Referer:referer},signal:AbortSignal.timeout(15000)});
  if (!r.ok) throw fail('The source page is unavailable.');
  return r.text();
}
async function mediaUrl(id) {
  const html = await page(player(id),'https://1tamilyogi.ro/');
  const source = await new Promise((resolve,reject)=>{
    const proc = execFile(fileURLToPath(new URL('../.venv/bin/python',import.meta.url)),[fileURLToPath(new URL('./uqload-source.py',import.meta.url))],{timeout:10000},(error,out)=>error?reject(error):resolve(out.trim()));
    proc.stdin.on('error',()=>{});
    proc.stdin.end(html);
  });
  if (!source) throw fail('The embedded player did not publish a video file.');
  const url = new URL(source);
  if (url.protocol !== 'https:' || !/^strm\d+\.uqload\.vc$/.test(url.hostname) || url.port || url.username || url.password) throw fail('Unsupported player media host.');
  return url;
}
const searchVideoPath = /^\/search-video\/[A-Za-z0-9_=-]{1,2500}\/[a-f0-9]{32}\/?$/;
const directVideoPath = /^\/video-[a-z0-9]{1,32}\/[a-z0-9_-]{1,240}\/?$/i;
async function xnxxMedia(path) {
  if (!searchVideoPath.test(path) && !directVideoPath.test(path)) throw fail('Invalid source page.');
  const html = await page('https://xnxx.health'+path,'https://xnxx.health/');
  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try { data = JSON.parse(script[1]); } catch { continue; }
    for (const item of [data].flat().flatMap(node=>node?.['@graph'] || [node])) {
      if (item?.['@type'] !== 'VideoObject' || !item.contentUrl) continue;
      const media = new URL(item.contentUrl);
      if (media.protocol === 'https:' && /^mp4-[a-z0-9-]+\.xnxx-cdn\.com$/.test(media.hostname) && !media.port && !media.username && !media.password && /\.mp4$/i.test(media.pathname)) return {url:media,title:item.name};
    }
  }
  throw fail('The page did not publish a supported MP4 source.');
}
const mp4Sites = {
  fn: {host:'fapnfuck.com',source:/^https:\/\/cdn\d*\.fapnfuck\.com\/[\w/-]+\.mp4(?:\?|$)/i},
  hr: {host:'hard3r.com',source:/^https:\/\/cdn\d*\.w4nkr\.com\/[\w/-]+\.mp4(?:\?|$)/i}
};
async function playerMp4(path,site) {
  if (!/^\/video\/\d{1,12}\/[a-z0-9-]{1,180}\/?$/.test(path)) throw fail('Invalid video page.');
  const html = await page('https://'+site.host+path,'https://'+site.host+'/');
  const raw = html.match(/\bdata-sources='([^']+)'/)?.[1];
  const entries = Object.entries(JSON.parse(raw || '{}')).filter(([quality,source]) =>
    /^\d{2,4}$/.test(quality) && site.source.test(source));
  if (!entries.length) throw fail('This player did not publish an MP4 source.');
  return new URL(entries.sort((a,b)=>Number(b[0])-Number(a[0]))[0][1]);
}
export async function inspectMovie(value) {
  const url = new URL(value);
  const siteKey = Object.keys(mp4Sites).find(key=>mp4Sites[key].host === url.hostname.replace(/^www\./,''));
  if (siteKey) {
    await playerMp4(url.pathname,mp4Sites[siteKey]);
    const key = Buffer.from(url.pathname).toString('base64url');
    return {downloads:[{label:'Download source MP4',href:'/api/vintorent/source/'+siteKey+'-'+key}]};
  }
  if (['xnxx.health','www.xnxx.health'].includes(url.hostname)) {
    const media = await xnxxMedia(url.pathname);
    const key = Buffer.from(url.pathname).toString('base64url');
    return {title:media.title,downloads:[{label:'Download source MP4',href:'/api/vintorent/source/xn-'+key}]};
  }
  if (['tamilgun.now','www.tamilgun.now'].includes(url.hostname) && /^\/video\/[a-z0-9-]+\/?$/.test(url.pathname)) {
    const html = await page('https://tamilgun.now'+url.pathname,'https://tamilgun.now/');
    const players = [...new Set(Array.from(html.matchAll(/<iframe\b[^>]*\bsrc=["'](https:\/\/(?:player3\.spirituallifewell\.com\/embed\/[a-f0-9]{32}|play\.playallu\.xyz\/play\/v1\/[a-f0-9]{24}))["']/gi), match=>match[1]))];
    const uq = html.match(/<iframe\b[^>]*\bsrc=["']https:\/\/uqload\.vc\/embed-([a-z0-9]{12})\.html["']/i)?.[1];
    const downloads = [];
    if (uq) {
      await mediaUrl(uq);
      downloads.push({label:'Download source video',href:'/api/vintorent/source/'+uq});
    }
    if (!downloads.length && !players.length) throw fail('No supported video source was found on this page.');
    return {title:url.pathname.split('/')[2].replaceAll('-',' '),downloads,players};
  }
  if (!['1tamilyogi.ro','www.1tamilyogi.ro'].includes(url.hostname) || !/^\/[a-z0-9-]+\/?$/.test(url.pathname)) throw fail('Enter a supported movie page.');
  const html = await page('https://1tamilyogi.ro'+url.pathname,'https://1tamilyogi.ro/');
  const id = html.match(/<iframe\b[^>]*\bsrc=["']https:\/\/uqload\.vc\/embed-([a-z0-9]{12})\.html["']/i)?.[1];
  if (!id) throw fail('This page has no supported embedded player.');
  await mediaUrl(id);
  return {title:url.pathname.split('/')[1].replaceAll('-',' '),downloads:[{label:'Download source video',href:'/api/vintorent/source/'+id}]};
}
export async function streamMovie(id,req,res) {
  const xn = /^xn-[A-Za-z0-9_-]{1,3500}$/.test(id);
  const site = /^(fn|hr)-[A-Za-z0-9_-]{1,300}$/.test(id) && mp4Sites[id.slice(0,2)];
  if (!site && !xn && !/^[a-z0-9]{12}$/.test(id)) throw fail('Invalid player link.');
  const path = (xn || site) && Buffer.from(id.slice(3),'base64url').toString();
  const url = site ? await playerMp4(path,site) : xn ? (await xnxxMedia(path)).url : await mediaUrl(id);
  const headers = {Referer:site ? 'https://'+site.host+'/' : xn ? 'https://xnxx.health/' : player(id)};
  if (/^bytes=\d*-\d*$/.test(req.headers.range || '')) headers.Range=req.headers.range;
  const source = await fetch(url,{headers,redirect:'error',signal:AbortSignal.timeout(3600000)});
  if (source.ok && /mpegurl/i.test(source.headers.get('content-type') || '')) {
    const controller = new AbortController();
    res.once('close',()=>controller.abort());
    const mediaFetch = async relative => {
      const target = new URL(relative,url);
      if (target.origin !== url.origin || target.username || target.password) throw fail('Unsupported media segment host.');
      const response = await fetch(target,{headers:{Referer:player(id)},redirect:'error',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])});
      if (!response.ok) throw fail('A video segment was unavailable.');
      return response;
    };
    let playlist = await source.text();
    let playlistUrl = url;
    if (playlist.includes('#EXT-X-STREAM-INF:')) {
      const variant = playlist.match(/#EXT-X-STREAM-INF:[^\n]*\n([^#\s][^\r\n]*)/)?.[1];
      if (!variant) throw fail('The player has no video variant.');
      playlistUrl = new URL(variant,url);
      playlist = await (await mediaFetch(playlistUrl)).text();
    }
    const parts = playlist.split(/\r?\n/).filter(line=>line && !line.startsWith('#'));
    if (!parts.length || !playlist.includes('#EXT-X-ENDLIST') || /#EXT-X-(KEY|MAP|BYTERANGE):/.test(playlist)) throw fail('Unsupported video playlist.');
    async function* segments() {
      for (const part of parts) {
        const response = await mediaFetch(new URL(part,playlistUrl));
        for await (const bytes of response.body) yield bytes;
      }
    }
    res.writeHead(200,{'Content-Type':'video/mp2t','Content-Disposition':'attachment; filename="'+id+'.ts"','Cache-Control':'no-store'});
    await pipeline(Readable.from(segments()),res);
    return;
  }
  if (![200,206].includes(source.status) || !/^(video\/|application\/octet-stream)/i.test(source.headers.get('content-type') || '')) {
    await source.body?.cancel();throw fail('The player could not serve the video.');
  }
  const out={'Content-Type':source.headers.get('content-type'),'Content-Disposition':'attachment; filename="'+((xn || site) ? path.split('/').filter(Boolean).at(-1) : id)+'.mp4"','Cache-Control':'no-store'};
  for(const name of ['content-length','content-range','accept-ranges']) if(source.headers.has(name)) out[name]=source.headers.get(name);
  res.writeHead(source.status,out);
  await pipeline(Readable.fromWeb(source.body),res);
}
