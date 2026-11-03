const profileForm = document.querySelector('#profile-form');
const results = document.querySelector('#profile-results');
async function query(payload) {
  const response = await fetch('/api/vintorent/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data = await response.json();
  if (!response.ok) throw Error(data.error);
  return data;
}
function element(parent,tag,text) {
  const node = document.createElement(tag);
  node.textContent = text;
  parent.append(node);
  return node;
}
function revenueScenario() {
  const box = element(results,'section','');
  element(box,'h3','YouTube revenue estimate');
  element(box,'p','Use views and creator RPM for the same period and currency. For Shorts, enter engaged views. RPM already accounts for YouTube’s share.');
  box.innerHTML += `<form class="revenue-form"><label>Video views or Shorts engaged views <input type="number" min="0" step="1" required name="views"></label>
    <label>Creator RPM per 1,000 views <input type="number" min="0" step="any" required name="rpm"></label>
    <label>Currency <select name="currency"><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label>
    <button class="btn ghost">Calculate estimate</button></form><p role="status"></p>`;
  const form = box.querySelector('form');
  const output = box.querySelector('[role=status]');
  form.oninput = () => {output.textContent='';};
  form.onsubmit = event => {
    event.preventDefault();
    const fields = new FormData(form);
    const amount = Number(fields.get('views')) / 1000 * Number(fields.get('rpm'));
    output.textContent = Number.isFinite(amount) ? 'Estimated creator revenue for these inputs: ' +
      new Intl.NumberFormat(undefined,{style:'currency',currency:fields.get('currency')}).format(amount) : 'Enter a smaller value.';
  };
}
profileForm.onsubmit = async event => {
  event.preventDefault();
  const url = document.querySelector('#profile-url').value;
  results.textContent = 'Checking profile…';
  profileForm.querySelector('button').disabled = true;
  try {
    const data = await query({url});
    results.replaceChildren();
    const a = element(results,'a','View profile on '+data.platform);
    a.href=data.url; a.target='_blank'; a.rel='noopener noreferrer';
    if (data.thumbnail && new URL(data.thumbnail).protocol === 'https:') {
      const image = element(results,'img','');
      image.src = data.thumbnail; image.alt = 'Channel thumbnail'; image.width = 88;
    }
    if (data.uploads) {
      const uploads = element(results,'a','Browse channel uploads');
      uploads.href = 'https://www.youtube.com/playlist?list=' + encodeURIComponent(data.uploads);
      uploads.target = '_blank'; uploads.rel = 'noopener noreferrer';
    }
    for (const [key,value] of Object.entries(data.metrics)) element(results,'p',key+' · '+(typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value));
    if (data.note) element(results,'p',data.note);
    if (data.platform === 'YouTube') revenueScenario();
    if (data.platform === 'YouTube') element(results,'p','Watch time and revenue by source require the channel owner’s authorised analytics. Public views do not establish earnings.');
    if (data.platform === 'Bluesky') for (const list of ['Followers','Following']) {
      const section = element(results,'section','');
      const button = element(section,'button','Show '+list.toLowerCase());
      button.className='btn ghost';
      let cursor;
      button.onclick=async()=>{
        button.disabled=true;
        try {
          const page=await query({url,list,cursor});
          page.accounts.forEach(handle=>element(section,'p','@'+handle));
          if (!page.accounts.length) element(section,'p','No accounts returned.');
          cursor=page.cursor; button.hidden=!cursor;
          button.textContent='Load more '+list.toLowerCase();
        } catch(error) {element(section,'p',error.message);}
        finally {button.disabled=false;}
      };
    }
  } catch(error) {results.textContent=error.message;}
  finally {profileForm.querySelector('button').disabled=false;}
};
