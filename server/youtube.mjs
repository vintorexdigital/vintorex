import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp, rm, readdir, stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pipeline} from 'node:stream/promises';

const run = promisify(execFile);
const bin = fileURLToPath(new URL('../.venv/bin/yt-dlp', import.meta.url));
const fail = (status,message) => Object.assign(new Error(message),{status});
let active = 0;
function videoId(value) {
  let url;
  try {url = new URL(value);} catch {}
  const host = url?.hostname.replace(/^(www\.|m\.|music\.)/, '');
  if (url && ['http:', 'https:'].includes(url.protocol)) {
    const clip = ['xhamster.com','xhamster.desi'].includes(host) && url.pathname.match(/^\/videos\/([a-zA-Z0-9-]{1,240}-[a-zA-Z0-9]{1,20})\/?$/);
    if (clip) return (host === 'xhamster.desi' ? 'xhdesi-' : 'xhvideo-')+clip[1];
    const vimeo = host === 'vimeo.com' && url.pathname.match(/^\/(\d{1,15})\/?$/);
    if (vimeo) return 'vimeo-'+vimeo[1];
    const daily = host === 'dailymotion.com' ? url.pathname.match(/^\/video\/([a-zA-Z0-9]{1,16})(?:_[^/]*)?\/?$/) :
      host === 'dai.ly' && url.pathname.match(/^\/([a-zA-Z0-9]{1,16})\/?$/);
    if (daily) return 'daily-'+daily[1];
  }
  const id = host === 'youtu.be' ? url.pathname.slice(1) : host === 'youtube.com' ?
    (url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)\/?$/)?.[1]) : null;
  if (!/^[\w-]{11}$/.test(id || '') || !['https:','http:'].includes(url.protocol)) throw fail(400,'Paste a supported single-video page link.');
  return id;
}
function sourceUrl(id) {
  if (id.startsWith('xhdesi-') && id.length > 11) return 'https://xhamster.desi/videos/'+id.slice(7);
  if (id.startsWith('xhvideo-') && id.length > 11) return 'https://xhamster.com/videos/'+id.slice(8);
  if (/^vimeo-\d{1,15}$/.test(id)) return 'https://vimeo.com/'+id.slice(6);
  if (/^daily-[a-zA-Z0-9]{1,16}$/.test(id)) return 'https://www.dailymotion.com/video/'+id.slice(6);
  return 'https://www.youtube.com/watch?v='+id;
}
async function extract(id,args,timeout,signal) {
  if (active >= 3) throw fail(429,'Three video jobs are running. Try again shortly.');
  active++;
  try {
    return await run(bin,['--ignore-config','--no-playlist','--no-cache-dir','--no-warnings','--no-progress','--socket-timeout','15','--retries','1','--js-runtimes','node','--ffmpeg-location',fileURLToPath(new URL('../.venv/bin/',import.meta.url)),...args,sourceUrl(id)],{timeout,signal,maxBuffer:8*1024*1024});
  } catch(error) {
    if (error.code === 'ENOENT') throw fail(503,'The server needs its YouTube download tools installed.');
    const reason = (error.stderr || '').match(/ERROR: (?:\[youtube\] [\w-]+: )?([^\n]+)/)?.[1];
    throw fail(422,reason?.split('Use --cookies')[0].slice(0,240) || 'The source could not deliver this video or format. Try another public video.');
  } finally {active--;}
}
export async function inspectYoutube(value) {
  const id = videoId(value);
  const {stdout} = await extract(id,['--dump-single-json','--skip-download'],60000);
  const info = JSON.parse(stdout);
  if (info.is_live || !(info.duration > 0 && info.duration <= 3600)) throw fail(422,'Choose a completed video up to one hour long.');
  const formats = info.formats.filter(f => !f.has_drm);
  const choices = [...new Set(formats.filter(f => f.vcodec !== 'none' && f.ext === 'mp4' && f.height > 0 && f.height <= 1080).map(f=>f.height))].sort((a,b)=>b-a);
  const downloads = choices.map(h=>({label:h+'p MP4',href:'/api/vintorent/youtube/'+id+'/'+h}));
  if (formats.some(f=>f.acodec && f.acodec !== 'none')) downloads.push({label:'MP3 audio',href:'/api/vintorent/youtube/'+id+'/audio'});
  if (!downloads.length) throw fail(422,'No supported download format is available.');
  return {title:info.title,creator:info.uploader,duration:info.duration,source:info.extractor_key,downloads};
}
export async function youtubeFile(id,quality,res) {
  if (!/^(?:[\w-]{11}|vimeo-\d{1,15}|daily-[a-zA-Z0-9]{1,16}|(?:xhvideo|xhdesi)-[a-zA-Z0-9-]{1,240}-[a-zA-Z0-9]{1,20})$/.test(id) || !(quality==='audio' || (/^\d{2,4}$/.test(quality) && +quality <= 1080))) throw fail(400,'Invalid YouTube download.');
  const dir = await mkdtemp(join(tmpdir(),'vintorent-yt-'));
  const controller = new AbortController();
  res.once('close',()=>controller.abort());
  try {
    const format = quality === 'audio' ? ['-f','ba/b','-x','--audio-format','mp3'] :
      ['-f','bv[ext=mp4][height='+quality+']+ba[ext=m4a]/b[ext=mp4][height='+quality+']','--merge-output-format','mp4'];
    await extract(id,['--match-filter','!is_live & duration<=3600','--max-filesize','256M','--no-part','-o',join(dir,'media.%(ext)s'),...format],300000,controller.signal);
    const ext = quality === 'audio'?'mp3':'mp4';
    const name = 'media.'+ext;
    if (!(await readdir(dir)).includes(name)) throw fail(422,'File unavailable or larger than the download limit.');
    const file = join(dir,name);
    const size = (await stat(file)).size;
    if (!size || size > 256*1024*1024) throw fail(422,'File unavailable or larger than 256 MB.');
    res.writeHead(200,{'Content-Type':ext==='mp3'?'audio/mpeg':'video/mp4','Content-Length':size,'Content-Disposition':'attachment; filename="'+id.slice(-80)+'-'+quality+'.'+ext+'"','Cache-Control':'no-store'});
    await pipeline(createReadStream(file),res);
  } finally { await rm(dir,{recursive:true,force:true}); }
}
