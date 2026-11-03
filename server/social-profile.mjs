const platforms = {'instagram.com':'Instagram','facebook.com':'Facebook','linkedin.com':'LinkedIn','x.com':'X','twitter.com':'X','youtube.com':'YouTube','bsky.app':'Bluesky'};
const fail = message => Object.assign(new Error(message), {status:400});
async function json(url, headers) {
  const response = await fetch(url, {headers, redirect:'error',signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw Error('Unavailable');
  return response.json();
}
async function publicPage(address) {
  const response = await fetch(address, {
    headers:{'Accept-Language':'en-US'}, redirect:'error', signal:AbortSignal.timeout(10000)
  });
  if (!response.ok) throw Error('Unavailable');
  const html = await response.text();
  function metadata(key) {
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    const tag = tags.find(t => t.includes('property="og:'+key+'"'));
    return (tag?.match(/\bcontent="([^"]*)"/i)?.[1] || '').replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => {
      const n = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1),16) : Number(code);
      return n <= 0x10ffff ? String.fromCodePoint(n) : '';
    }).replace(/&quot;/g,'"').replace(/&amp;/g,'&');
  }
  return {html, metadata};
}
async function instagramPage(id) {
  const {metadata} = await publicPage('https://www.instagram.com/'+encodeURIComponent(id)+'/');
  const title = metadata('title');
  const marker = '(@'+id.toLowerCase()+')';
  const pos = title.toLowerCase().indexOf(marker);
  if (pos < 0) throw Error('Profile unavailable');
  const metrics = {Name:title.slice(0,pos).trim() || id};
  const description = metadata('description');
  for (const label of ['Followers','Following','Posts']) {
    const count = description.match(new RegExp('(?:^|,\\s*)([\\d,.]+[KMB]?)\\s+'+label+'\\b','i'));
    if (count) metrics[label] = count[1];
  }
  return metrics;
}
export async function socialProfile(value, list, cursor) {
  let url;
  try { url = new URL(value); } catch { throw fail('Enter a full profile URL.'); }
  const host = url.hostname.replace(/^(www\.|m\.)/, '');
  const platform = platforms[host];
  if (!platform || !['http:','https:'].includes(url.protocol)) throw fail('Choose one of the listed platforms.');
  const path = url.pathname.split('/').filter(Boolean);
  if (platform === 'YouTube' && ['videos','shorts','streams','about','featured','playlists','community'].includes(path.at(-1))) path.pop();
  const id = path.at(-1);
  if (!id || !/^[\w.@-]{1,120}$/.test(id)) throw fail('Enter a profile URL.');
  const valid = platform === 'LinkedIn' ? path.length === 2 && ['in','company','school'].includes(path[0])
    : platform === 'Bluesky' ? path.length === 2 && path[0] === 'profile'
    : platform === 'YouTube' ? (path.length === 1 && id.startsWith('@')) || (path.length === 2 && ['channel','user'].includes(path[0]))
    : path.length === 1 && !['watch','explore','home','groups','marketplace','p','reel','login'].includes(id);
  if (!valid) throw fail('Use a profile or channel URL rather than a post or video.');
  const result = {platform,url:'https://'+host+'/'+path.join('/'), metrics:{},note:''};
  if (list && (platform !== 'Bluesky' || !['Followers','Following'].includes(list))) throw fail('Unsupported list.');
  try {
    if (platform === 'Bluesky') {
      const endpoint = list ? (list === 'Followers' ? 'getFollowers' : 'getFollows') : 'getProfile';
      const api = new URL('https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile');
      if (list) api.pathname = '/xrpc/app.bsky.graph.' + endpoint;
      api.searchParams.set('actor',id);
      if (cursor) api.searchParams.set('cursor',String(cursor).slice(0,2048));
      const data = await json(api);
      if (list) return {accounts:(data.followers || data.follows || []).map(a=>a.handle),cursor:data.cursor};
      result.metrics = {Name:data.displayName || data.handle,Followers:data.followersCount,Following:data.followsCount,Posts:data.postsCount};
    } else if (platform === 'YouTube' && process.env.YOUTUBE_API_KEY) {
      const api = new URL('https://www.googleapis.com/youtube/v3/channels');
      api.search = new URLSearchParams({part:'snippet,statistics,contentDetails,topicDetails,status,brandingSettings,localizations',key:process.env.YOUTUBE_API_KEY,[path[0]==='channel'?'id':path[0]==='user'?'forUsername':'forHandle']:id});
      const c = (await json(api)).items?.[0];
      if (!c) throw Error('Unavailable');
      const {snippet = {}, statistics = {}, status = {}, brandingSettings = {}} = c;
      result.metrics = {
        Channel: snippet.title, 'Channel ID': c.id, Handle: snippet.customUrl,
        Description: snippet.description, Created: snippet.publishedAt,
        Country: snippet.country || brandingSettings.channel?.country,
        Language: snippet.defaultLanguage || brandingSettings.channel?.defaultLanguage,
        'Subscribers (rounded)': statistics.hiddenSubscriberCount ? 'Hidden' : statistics.subscriberCount,
        'Public videos': statistics.videoCount, 'Channel views': statistics.viewCount,
        Visibility: status.privacyStatus, 'Made for kids': status.madeForKids,
        Keywords: brandingSettings.channel?.keywords,
        Topics: c.topicDetails?.topicCategories?.map(topic => topic.split('/').pop().replaceAll('_', ' ')).join(', '),
        'Localised languages': Object.keys(c.localizations || {}).join(', ') || undefined
      };
      result.uploads = c.contentDetails?.relatedPlaylists?.uploads;
      result.thumbnail = snippet.thumbnails?.medium?.url;

    } else if (platform === 'Instagram') {
      const data = await json('https://www.instagram.com/api/v1/users/web_profile_info/?username='+encodeURIComponent(id),{'X-IG-App-ID':'936619743392459'}).catch(() => null);
      const u = data?.data?.user;
      if (!u) {
        result.metrics = await instagramPage(id);
        result.note = 'Counts are shown as published on the Instagram profile and may be rounded.';
      } else result.metrics = {Name:u.full_name,Followers:u.edge_followed_by?.count,Following:u.edge_follow?.count,Posts:u.edge_owner_to_timeline_media?.count,'Account type':u.is_business_account ? 'Business' : u.is_professional_account ? 'Professional' : undefined};
    } else {
      const {html, metadata} = await publicPage('https://'+(host === 'x.com' || host === 'twitter.com' ? 'x.com' : 'www.'+host)+'/'+path.join('/'));
      const title = metadata('title');
      const canonical = metadata('url');
      if (!title || /^(log in|sign in)$/i.test(title) || !canonical) throw Error('Unavailable');
      const source = new URL(canonical);
      if (platforms[source.hostname.replace(/^www\./,'')] !== platform) throw Error('Unavailable');
      const same = source.pathname.replace(/\/$/,'').toLowerCase() === ('/'+path.join('/')).toLowerCase();
      if (!same && !(platform === 'YouTube' && /^\/channel\/UC[\w-]+$/.test(source.pathname))) throw Error('Unavailable');
      result.metrics = {Name:title,Description:metadata('description') || undefined};
      if (platform === 'YouTube') {
        const header = html.match(/"pageHeaderRenderer"\s*:/)?.index;
        const info = header === undefined ? '' : html.slice(header, header+45000).split('"tabs":')[0];
        for (const [label, word] of [['Subscribers (rounded)','subscribers'],['Public videos (displayed)','videos']]) {
          const count = info.match(new RegExp('"content":"([0-9][0-9.,]*[KMB]?) '+word+'"','i'));
          if (count) result.metrics[label] = count[1];
        }
      }
      result.note = 'Source: public profile page. Displayed counts may be rounded.';
      if (platform === 'LinkedIn') result.metrics['Profile category'] = {in:'Personal profile',company:'Company page',school:'School page'}[path[0]];
    }
  } catch { if (list) throw Object.assign(new Error('Could not load this audience list.'),{status:502}); result.note = 'The platform did not return public data for this profile.'; }
  return result;
}
