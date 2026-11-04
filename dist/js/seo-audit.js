import { esc } from './ui.js';

const $ = selector => document.querySelector(selector);
const form = $('#audit-form'), results = $('#audit-results'), progress = $('#audit-progress'), errorBox = $('#audit-error');
const reportPattern = /^[a-f0-9]{40}$/;
let currentReport, sites = [], findingsPage = 0, controller;
const value = item => item === null || item === undefined ? 'Unavailable' : typeof item === 'number' ? item.toLocaleString('en-IN') : esc(String(item));
const host = url => { try { return new URL(url).hostname; } catch { return String(url || 'Website'); } };
const safeLink = url => typeof url === 'string' && /^https?:\/\//i.test(url) ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>` : esc(url || 'Unavailable');
const table = (headers, rows) => `<div class="seo-table-wrap"><table class="seo-table"><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const row = cells => '<tr>' + cells.map(cell => '<td>' + cell + '</td>').join('') + '</tr>';
function showError(message) { errorBox.textContent = message; errorBox.hidden = false; }
function recent() { try { return JSON.parse(localStorage.getItem('vx_seo_reports') || '[]').filter(r => reportPattern.test(r.id)).slice(0, 6); } catch { return []; } }
function renderRecent() {
  const reports = recent();
  $('#recent-audits').hidden = !reports.length;
  $('#recent-list').innerHTML = reports.map(report => `<li><a href="#audit-${report.id}">${esc(report.domain)}</a> <small>· ${esc(new Date(report.at).toLocaleString())}</small></li>`).join('');
}
async function request(path, body, signal) {
  const res = await fetch(path, { method: body ? 'POST' : 'GET', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-VX-Request': '1' }, body: body ? JSON.stringify(body) : undefined, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Error(json.error || 'The audit service is unavailable. Please try again.');
  return json;
}
async function watch(id) {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  $('#audit-submit').disabled = true;
  errorBox.hidden = true; results.hidden = true; progress.hidden = false;
  try {
    for (;;) {
      const job = await request('/api/seo/audits/' + id, undefined, signal);
      if (job.status === 'failed') throw Error(job.error || 'The audit could not finish. Please start a new report.');
      if (job.status === 'complete') {
        renderReport(job.report);
        try {
          const saved = recent().filter(r => r.id !== id);
          localStorage.setItem('vx_seo_reports', JSON.stringify([{ id, domain: host(job.report.target.url), at: job.report.finishedAt }, ...saved].slice(0, 6)));
        } catch {}
        renderRecent(); progress.hidden = true;
        return;
      }
      const state = job.progress || {};
      $('#progress-title').textContent = state.message || 'Waiting for the audit to start…';
      $('#progress-detail').textContent = 'Website ' + ((state.domainIndex || 0) + 1) + ' of ' + (state.domains || 1) + ' · ' + (state.pages || 0) + ' of up to ' + (state.maxPages || 25) + ' pages · This scan may take a few minutes.';
      $('#progress-meter').value = Math.min(98, Math.round(((state.domainIndex || 0) + (state.pages || 0) / (state.maxPages || 25) * .9) / (state.domains || 1) * 100));
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 1800);
        function abort() { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }
        signal.addEventListener('abort', abort, { once: true });
      });
    }
  } catch (error) {
    if (error.name !== 'AbortError') { progress.hidden = true; showError(error.message); }
  } finally { if (!signal.aborted) $('#audit-submit').disabled = false; }
}
function internalIndexHtml(report) {
  const index = report.intelligence;
  if (!index) return '<p class="seo-empty">Run a fresh audit to build the internal content and link index.</p>';
  return `<section class="seo-panel" id="audit-content"><div class="seo-section-head"><h2>Content intelligence & link evidence</h2><span class="seo-pill">Built into Vintorex</span></div>
    <p class="seo-source-note">${index.documents} source documents across ${index.domains} domains · ${index.externalLinksIndexed} distinct external links indexed. ${esc(index.scope)}</p>
    ${index.sites.map(site => `<details ${site.url === report.target.url ? 'open' : ''}><summary>${esc(host(site.url))} · ${site.uniqueTerms} observed terms</summary>
      <h3>Observed content terms</h3>${site.topics.length ? table(['Term', 'Text occurrences', 'Pages', 'In titles / H1', 'Source examples'], site.topics.slice(0, 20).map(topic => row([esc(topic.term), value(topic.occurrences), value(topic.pageCount), topic.titlePages + ' / ' + topic.headingPages, topic.pages.map(safeLink).join('<br>')]))) : '<p class="seo-empty">No source terms indexed.</p>'}
      <h3>Observed incoming cross-domain links</h3><p class="seo-source-note">${site.observedBacklinks.length} link(s) from ${site.referringDomains} domain(s) within this report’s crawl. Other websites may contain additional links.</p>
      ${site.observedBacklinks.length ? table(['Source page', 'Destination', 'Anchor / rel', 'Observed'], site.observedBacklinks.slice(0, 50).map(link => row([safeLink(link.source), safeLink(link.destination), esc(link.anchor || 'No anchor text') + '<small>' + esc(link.rel || 'No rel attribute') + '</small>', esc(link.observedAt)]))) : '<p class="seo-empty">No cross-domain links to this site were observed in the sampled pages.</p>'}
    </details>`).join('')}
    <div class="seo-topic-gaps"><h3>Competitor content opportunities</h3><p class="seo-source-note">Terms found in competitor pages and absent from your sampled pages. Review relevance before planning new content.</p>
      ${index.topicGaps.length ? table(['Observed term', 'Competitor domains', 'Occurrences / pages', 'Evidence'], index.topicGaps.map(gap => row([esc(gap.term), gap.competitorDomains.map(esc).join('<br>'), gap.occurrences + ' / ' + gap.pageCount, gap.pages.map(safeLink).join('<br>')]))) : '<p class="seo-empty">No additional competitor terms found in this sample. Add competitors or widen the page sample to compare more content.</p>'}
    </div></section>`;
}
function renderReport(report) {
  currentReport = report; sites = [report.target, ...report.competitors]; findingsPage = 0;
  const target = report.target, summary = target.summary;
  const counts = summary ? [['Calculated health', summary.health + '/100'], ['Errors', summary.errors], ['Warnings', summary.warnings], ['HTML pages evaluated', target.coverage.htmlPages]] : [['Calculated health', null], ['Errors', null], ['Warnings', null], ['HTML pages evaluated', null]];
  const grouped = new Map();
  for (const issue of target.issues) {
    if (!grouped.has(issue.code)) grouped.set(issue.code, { ...issue, count: 0 });
    grouped.get(issue.code).count++;
  }
  const priorities = [...grouped.values()].sort((a, b) => ['Error', 'Warning', 'Notice'].indexOf(a.severity) - ['Error', 'Warning', 'Notice'].indexOf(b.severity) || b.count - a.count).slice(0, 5);
  const compared = [
    ['Calculated health', s => s.summary ? s.summary.health + '/100' : null],
    ['HTML pages evaluated', s => s.coverage?.htmlPages], ['Discovered URLs', s => s.coverage?.discovered],
    ['Indexable HTML pages', s => s.summary?.indexablePages], ['Errors', s => s.summary?.errors],
    ['Warnings', s => s.summary?.warnings], ['Avg response to headers (ms)', s => s.summary?.averageResponseMs],
    ['Avg source word count', s => s.summary?.averageWords], ['Images missing alt', s => s.summary?.missingAlt],
    ['Observed content terms', s => report.intelligence?.sites.find(entry => entry.url === s.url)?.uniqueTerms],
    ['Incoming links observed in this crawl', s => report.intelligence?.sites.find(entry => entry.url === s.url)?.observedBacklinks.length],
    ['Referring domains observed in this crawl', s => report.intelligence?.sites.find(entry => entry.url === s.url)?.referringDomains],
  ];
  results.innerHTML = `<nav class="seo-result-nav" aria-label="Report sections"><a href="#audit-summary">Overview</a><a href="#audit-findings">Findings</a><a href="#audit-pages">Crawled pages</a><a href="#audit-comparison">Competitors</a><a href="#audit-content">Content & links</a><a href="#audit-sources">Data sources</a></nav>
    <section class="seo-panel" id="audit-summary"><div class="seo-section-head"><div><p class="seo-kicker">YOUR LIVE REPORT</p><h2>${esc(host(target.url))}</h2></div><a class="btn primary" id="download-report" href="/api/seo/audits/${report.id}/report.pdf" download>Download PDF report ↓</a></div>
    <p class="seo-source-note">Observed ${esc(target.startedAt)} · Completed ${esc(report.finishedAt)}. ${target.coverage ? target.coverage.crawled + ' of ' + target.coverage.discovered + ' discovered URLs fetched; ' + target.coverage.htmlPages + ' HTML pages evaluated.' : ''}</p>
    ${target.error ? '<p class="seo-error">' + esc(target.error) + '</p>' : ''}
    ${target.coverage?.truncated || target.coverage?.timedOut ? '<p class="seo-source-note"><b>Partial coverage.</b> The page or time limit was reached. Findings apply to the evaluated sample.</p>' : ''}
    <p class="seo-source-note">${esc(report.methodology)}</p></section>
    <div class="seo-score-grid">${counts.map(([label, amount]) => `<article class="seo-score-card"><strong>${value(amount)}</strong><span>${esc(label)}</span></article>`).join('')}</div>
    <section class="seo-panel"><div class="seo-section-head"><h2>Start with these fixes</h2></div>${priorities.length ? '<ol class="seo-priorities">' + priorities.map(issue => `<li><span class="seo-severity ${issue.severity}">${issue.severity}</span> <b>${esc(issue.label)}</b> · ${issue.count} occurrence(s)<p>${esc(issue.recommendation)}</p></li>`).join('') + '</ol>' : '<p class="seo-empty">No prioritized findings returned. Review crawl coverage before drawing conclusions.</p>'}</section>
    <section class="seo-panel"><div class="seo-section-head"><h2>Checks by theme</h2></div><div class="seo-check-groups">${(target.groups || []).map(group => `<article><h3>${esc(group.name)}</h3><p>${group.passed} / ${group.checked} checks passed · ${group.findings} findings</p></article>`).join('')}</div></section>
    <section class="seo-panel" id="audit-findings"><div class="seo-section-head"><h2>Findings & recommended actions</h2></div>
      <div class="seo-filters"><select id="finding-site" aria-label="Website">${sites.map((site, i) => `<option value="${i}">${esc(host(site.url))}</option>`).join('')}</select><select id="finding-severity" aria-label="Severity"><option value="">All priorities</option><option>Error</option><option>Warning</option><option>Notice</option></select><select id="finding-group" aria-label="Theme"><option value="">All themes</option>${[...new Set(sites.flatMap(s => s.issues.map(i => i.group)))].map(group => `<option>${esc(group)}</option>`).join('')}</select><input id="finding-search" type="search" aria-label="Search findings" placeholder="Search a URL or finding"></div><div id="findings-table"></div><div class="seo-pagination"><button class="btn sm ghost" id="findings-prev">Previous</button><span id="findings-count"></span><button class="btn sm ghost" id="findings-next">Next</button></div></section>
    <section class="seo-panel" id="audit-pages"><div class="seo-section-head"><h2>Crawled pages & source evidence</h2></div>${sites.map(site => `<details ${site === target ? 'open' : ''}><summary>${esc(host(site.url))} · ${site.pages.length} URLs</summary>${table(['Page / title', 'HTTP', 'Response', 'Words', 'Canonical / incoming links'], site.pages.map(page => row([safeLink(page.url) + '<small>' + esc(page.title || page.error || 'Title unavailable') + '</small>', value(page.status), page.responseMs === undefined ? 'Unavailable' : value(page.responseMs) + ' ms', value(page.wordCount), safeLink(page.canonical) + '<small>' + page.sources.length + ' incoming links in the sample</small>'])))}</details>`).join('')}</section>
    <section class="seo-panel" id="audit-comparison"><div class="seo-section-head"><h2>Competitor benchmarks</h2></div><p class="seo-source-note">Live observations from the same check set. Page samples differ by domain. Response times are measured from this audit server. Content terms and incoming links are counted from the internal crawl index.</p>${sites.length > 1 ? table(['Metric', ...sites.map(site => host(site.url))], compared.map(([label, getter]) => row([esc(label), ...sites.map(site => value(getter(site)))]))) : '<p class="seo-empty">Add a competitor website to your next audit for a side-by-side comparison.</p>'}</section>
    ${internalIndexHtml(report)}
    <section class="seo-panel" id="audit-sources"><div class="seo-section-head"><h2>Data sources & crawler access</h2></div><div class="seo-data-grid"><div><h3>Live website measurements</h3><p>Public HTTP responses, source HTML, robots.txt and XML sitemaps. Headings, content and links generated only by JavaScript may be absent. Resource checks sample up to eight same-site URLs with HEAD requests.</p><h3>Performance scope</h3><p>Timing covers the server response to headers. HTML bytes and image dimensions are source observations. LCP, INP and CLS need real-user or browser performance measurements and are not inferred here.</p></div><div><h3>Search & AI crawler rules</h3>${table(['Crawler', 'Observed home-page access'], (target.crawlerAccess || []).map(bot => row([esc(bot.name), bot.allowed ? 'Allowed by robots.txt' : 'Blocked by robots.txt'])))}<p>Robots access does not establish indexing, ranking, AI citation or visibility.</p></div></div></section>`;
  results.hidden = false;
  for (const selector of ['#finding-site', '#finding-severity', '#finding-group', '#finding-search']) $(selector).addEventListener('input', () => { findingsPage = 0; renderFindings(); });
  $('#findings-prev').onclick = () => { findingsPage--; renderFindings(); };
  $('#findings-next').onclick = () => { findingsPage++; renderFindings(); };
  renderFindings();
}
function renderFindings() {
  const site = sites[Number($('#finding-site').value)];
  const severity = $('#finding-severity').value, group = $('#finding-group').value, query = $('#finding-search').value.toLowerCase();
  const list = site.issues.filter(issue => (!severity || issue.severity === severity) && (!group || issue.group === group) && (issue.label + issue.url + issue.evidence + issue.recommendation).toLowerCase().includes(query))
    .sort((a, b) => ['Error', 'Warning', 'Notice'].indexOf(a.severity) - ['Error', 'Warning', 'Notice'].indexOf(b.severity));
  const totalPages = Math.max(1, Math.ceil(list.length / 30));
  findingsPage = Math.max(0, Math.min(findingsPage, totalPages - 1));
  $('#findings-table').innerHTML = list.length ? table(['Priority', 'Finding / theme', 'Observed evidence', 'Recommended action'], list.slice(findingsPage * 30, (findingsPage + 1) * 30).map(issue => row([`<span class="seo-severity ${issue.severity}">${issue.severity}</span>`, '<b>' + esc(issue.label) + '</b><small>' + esc(issue.group) + '</small>', safeLink(issue.url) + '<small>' + esc(issue.evidence) + '</small>', esc(issue.recommendation)]))) : '<p class="seo-empty">No findings match these filters.</p>';
  $('#findings-count').textContent = list.length + ' findings · Page ' + (findingsPage + 1) + ' of ' + totalPages;
  $('#findings-prev').disabled = findingsPage === 0; $('#findings-next').disabled = findingsPage >= totalPages - 1;
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  controller?.abort();
  errorBox.hidden = true; $('#audit-submit').disabled = true;
  const fields = Object.fromEntries(new FormData(form));
  try {
    const job = await request('/api/seo/audits', { url: fields.url.trim(), competitors: [fields.competitor1.trim(), fields.competitor2.trim()].filter(Boolean), maxPages: Number(fields.maxPages) });
    history.replaceState(null, '', '#audit-' + job.id);
    await watch(job.id);
  } catch (error) { showError(error.message); $('#audit-submit').disabled = false; }
});
function openHash() {
  const id = location.hash.replace('#audit-', '');
  if (reportPattern.test(id) && currentReport?.id !== id) watch(id);
}
window.addEventListener('hashchange', openHash);
window.addEventListener('pagehide', () => controller?.abort());
renderRecent(); openHash();

window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  const id = location.hash.replace('#audit-', '');
  if (reportPattern.test(id) && !currentReport) watch(id);
  else $('#audit-submit').disabled = false;
});
