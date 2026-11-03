const form = document.querySelector('#instagram-form');
const transfers = document.querySelector('#transfers');
let client;
function action(parent, label, handler) {
  const button = document.createElement('button');
  button.className = 'btn ghost sm';
  button.textContent = label;
  button.onclick = handler;
  parent.append(button);
  return button;
}
function link(parent, label, href) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label;
  a.download = '';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  parent.append(a);
}
async function add(value) {
  const row = document.createElement('article');
  row.className = 'transfer';
  const title = document.createElement('strong');
  title.textContent = value.name || String(value);
  const status = document.createElement('p');
  status.textContent = 'Looking up files…';
  const progress = document.createElement('progress');
  progress.max = 1;
  row.append(title, status, progress);
  transfers.prepend(row);
  const controller = new AbortController();
  let torrent, timer;
  const blobs = [];
  action(row, 'Remove', () => {
    controller.abort();
    clearInterval(timer);
    if (torrent && !torrent.destroyed) torrent.destroy();
    blobs.forEach(url => URL.revokeObjectURL(url));
    row.remove();
  });
  try {
    const local = value instanceof File;
    const url = local ? null : new URL(value);
    if (!local && !['http:', 'https:', 'magnet:'].includes(url.protocol)) throw Error('Use an HTTP, HTTPS or magnet link.');
    if (local || url.protocol === 'magnet:' || /\.torrent$/i.test(url.pathname)) {
      const {default: WebTorrent} = await import('/js/vendor/webtorrent/webtorrent.min.js');
      if (controller.signal.aborted) return;
      client ||= new WebTorrent();
      let source = value;
      if (local) source = new Uint8Array(await value.arrayBuffer());
      if (controller.signal.aborted) return;
      torrent = client.add(source, {deselect:true});
      status.textContent = 'Waiting for torrent metadata and browser-compatible peers…';
      torrent.on('error', error => { status.textContent = error.message; clearInterval(timer); });
      torrent.on('ready', () => {
        status.textContent = 'Choose a file to retrieve.';
        for (const f of torrent.files) {
          const button = action(row, f.name, async () => {
            button.disabled = true;
            f.select();
            try {
              const blob = await f.blob();
              if (controller.signal.aborted) return;
              const href = URL.createObjectURL(blob);
              blobs.push(href);
              link(row, 'Save ' + f.name, href);
            } catch (error) {status.textContent = error.message;}
          });
        }
        timer = setInterval(() => { progress.value = torrent.progress; status.textContent = torrent.numPeers + ' peers · ' + Math.round(torrent.downloadSpeed / 1024) + ' KB/s'; }, 1000);
        action(row, 'Pause', event => {
          if (torrent.paused) { torrent.resume(); event.target.textContent = 'Pause'; }
          else { torrent.pause(); event.target.textContent = 'Resume'; }
        });
      });
      return;
    }
    const videoSite = /^(?:(?:www|music|m)\.)?(?:youtube\.com|vimeo\.com|dailymotion\.com|xhamster\.(?:com|desi))$|^(?:youtu\.be|dai\.ly)$/.test(url.hostname);
    const movieSite = /^(?:www\.)?(?:1tamilyogi\.ro|tamilgun\.now|xnxx\.health|fapnfuck\.com|hard3r\.com)$/.test(url.hostname);
    if (movieSite || videoSite || /^(?:www\.|m\.)?instagram\.com$/.test(url.hostname)) {
      const res = await fetch(movieSite ? '/api/vintorent/source' : videoSite ? '/api/vintorent/youtube' : '/api/vintorent', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url:value}),signal:controller.signal});
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      if (data.title) title.textContent = data.title;
      if (data.duration) {
        const details = document.createElement('p');
        details.textContent = [data.source,data.creator,Math.floor(data.duration / 60)+'m '+Math.floor(data.duration % 60)+'s'].filter(Boolean).join(' · ');
        row.append(details);
      }
      for (const [index,href] of (data.players || []).entries()) {
        const player = document.createElement('a');
        player.href = href;
        player.target = '_blank';
        player.rel = 'noopener noreferrer';
        player.textContent = 'Open source player '+(index+1);
        row.append(player);
      }
      if (!data.downloads.length && data.players?.length) {
        progress.hidden = true;
        status.textContent = 'Embedded players found. No direct download is available through Vintorent.';
        return;
      }
      data.downloads.forEach(file => link(row,file.label,file.href));
    } else {
      link(row, 'Open original link', url.href);
      const res = await fetch('/api/vintorent/public',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url.href}),signal:controller.signal});
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      if (data.file) {
        link(row,'Save file','/api/vintorent/public?url='+encodeURIComponent(data.file));
      } else {
        const template=document.createElement('template');
        template.innerHTML=data.html;
        const baseTag=template.content.querySelector('base[href]');
        const base=baseTag ? new URL(baseTag.getAttribute('href'),data.url) : data.url;
        const found=new Set();
        function collect(raw) {
          if (!raw) return;
          try {
            const target=new URL(raw,base);
            if (!['http:','https:'].includes(target.protocol)) return;
            target.hash='';found.add(target.href);
          } catch {}
        }
        for (const el of template.content.querySelectorAll('video[src],audio[src],source[src],a[href],meta[property^="og:video"],meta[property^="og:audio"]')) {
          if (el.matches('meta') && !/^og:(audio|video)(:url|:secure_url)?$/.test(el.getAttribute('property'))) continue;
          const raw=el.getAttribute('src') || el.getAttribute('content') || el.getAttribute('href');
          if (el.matches('a') && !el.hasAttribute('download') && !/\.(mp4|webm|mkv|mov|mp3|ogg|wav|m4a|pdf|docx?|xlsx?|pptx?|csv|zip|7z|rar|gz|jpg|jpeg|png|webp|gif|torrent)(?:[?#]|$)/i.test(raw)) continue;
          collect(raw);
        }
        for (const script of template.content.querySelectorAll('script[type="application/ld+json"]')) {
          try {
            JSON.parse(script.textContent,(key,value)=>{if(key==='contentUrl' && typeof value==='string') collect(value);return value;});
          } catch {}
        }
        if(!found.size) throw Error('No downloadable files were found in the public page HTML.');
        for(const href of found) link(row,'Save '+(new URL(href).pathname.split('/').pop() || 'file'),'/api/vintorent/public?url='+encodeURIComponent(href));
        status.textContent=found.size+' downloadable link'+(found.size===1?'':'s')+' found. Choose a file to save.';
        progress.value=1;return;
      }
    }
    progress.value = 1;
    status.textContent = 'Ready.';
  } catch (error) {
    progress.hidden = true;
    status.textContent = error instanceof TypeError ? 'This source could not be read in the browser. Check the address or use the original link.' : error.message;
  }
}
form.addEventListener('submit', event => {event.preventDefault(); add(form.querySelector('input').value.trim());});
document.querySelector('#torrent-file').onchange = event => {if (event.target.files[0]) add(event.target.files[0]); event.target.value = '';};
