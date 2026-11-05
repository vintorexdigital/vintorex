import { esc, icon } from './ui.js';
import { reportInput, filterIssues, filterPages, issueKey, csvDocument, groupPriorities } from './seo-audit-data.js';

const $ = selector => document.querySelector(selector);
const form = $('#audit-form');
const pattern = /^[a-f0-9]{40}$/;
const titles = { overview: 'Overview', issues: 'Issues & actions', pages: 'Crawled pages', content: 'Content & topic gaps', competitors: 'Competitor comparison', links: 'Link evidence', access: 'Crawler access', reports: 'Saved reports' };
const state = { view: 'overview', site: 0, page: 0, busy: false, filters: {} };
let report = null, job = null, controller, activeId, exportData;
const host = url => { try { return new URL(url).hostname; } catch { return 'Website'; } };
const value = item => item === null || item === undefined ? 'Unavailable' : typeof item === 'number' ? item.toLocaleString('en-IN') : esc(item);
const link = url => typeof url === 'string' && /^https?:\/\//i.test(url) ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>` : value(url);
const button = (label, attrs = '') => `<button type="button" class="seo-button seo-outline" ${attrs}>${label}</button>`;
const panel = (title, content) => `<section class="seo-panel"><h3>${title}</h3>${content}</section>`;
const note = text => `<p class="seo-source-note">${esc(text)}</p>`;
const row = (cells, headers) => '<tr>' + cells.map((cell, index) => '<td data-label="' + esc(headers[index]) + '"><div class="seo-cell">' + cell + '</div></td>').join('') + '</tr>';
const table = (headers, rows) => '<div class="seo-table-wrap"><table class="seo-table"><thead><tr>' + headers.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
const sites = () => report ? [report.target, ...report.competitors] : [];
const selectedSite = () => sites()[state.site];
const selectedIndex = () => report?.intelligence?.sites.find(site => site.url === selectedSite()?.url);
const date = time => time ? new Date(time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Unavailable';
function stored(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function store(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} }
function historyItems() { const items = stored('vx_seo_reports', []); return Array.isArray(items) ? items.filter(item => pattern.test(item.id)).slice(0, 6) : []; }
function reviewed() { const items = stored('vx_seo_review_' + report.id, []); return new Set(Array.isArray(items) ? items : []); }
function feedback(message) { $('#workspace-feedback').textContent = message; $('#workspace-feedback').hidden = !message; }
function status(label, kind = '') { $('#report-status').textContent = label; $('#report-status').dataset.state = kind; }
function busy(running) {
  state.busy = running;
  form.querySelectorAll('input,select,button').forEach(input => { input.disabled = running; });
  $('#run-again').disabled = running || !report;
  $('#share-report').disabled = running || !report;
  $('#cancel-audit').disabled = false;
  $('#download-report').hidden = running || !report;
  $('#pdf-placeholder').hidden = !running && Boolean(report);
}
async function request(path, body, signal) {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'X-VX-Request': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(data.error || 'The audit service is unavailable. Please try again.');
  return data;
}
function fillForm(input) {
  if (!input) return;
  form.elements.url.value = input.url || '';
  form.elements.competitor1.value = input.competitors?.[0] || '';
  form.elements.competitor2.value = input.competitors?.[1] || '';
  form.elements.maxPages.value = String(input.maxPages || 25);
}
function remember(result) {
  store('vx_seo_reports', [{ id: result.id, domain: host(result.report.target.url), at: result.report.finishedAt, expiresAt: result.expiresAt, input: reportInput(result.report) }, ...historyItems().filter(item => item.id !== result.id)].slice(0, 6));
}
function selectView(view) {
  state.view = Object.hasOwn(titles, view) ? view : 'overview';
  state.page = 0; state.filters = {};
  document.querySelectorAll('[data-view]').forEach(tab => {
    const active = tab.dataset.view === state.view;
    tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
  });
  $('#audit-view').setAttribute('aria-labelledby', 'tab-' + state.view);
  $('#view-heading').textContent = titles[state.view];
  $('#view-eyebrow').textContent = state.view === 'reports' ? 'YOUR REPORT HISTORY' : report ? host(selectedSite().url) : 'YOUR AUDIT WORKSPACE';
  renderView();
}
function setupControls() {
  const search = '<input type="search" data-filter="query" aria-label="Search this view" placeholder="Search URLs, terms or findings">';
  const select = (key, label, options) => `<select data-filter="${key}" aria-label="${label}">${options.map(([id, title]) => `<option value="${esc(id)}">${esc(title)}</option>`).join('')}</select>`;
  const site = selectedSite();
  const controls = {
    issues: search + select('severity', 'Priority', [['', 'All priorities'], ['Error', 'Errors'], ['Warning', 'Warnings'], ['Notice', 'Notices']]) +
      select('group', 'Issue category', [['', 'All categories'], ...[...new Set(site?.issues.map(issue => issue.group) || [])].map(name => [name, name])]) +
      select('review', 'Review status', [['', 'All review states'], ['unreviewed', 'Not reviewed'], ['reviewed', 'Reviewed']]),
    pages: search + select('status', 'Page status', [['', 'All pages'], ['successful', 'HTTP success'], ['failed', 'Failed responses'], ['indexable', 'Indexing allowed'], ['blocked', 'Indexing blocked']]),
    content: search + select('kind', 'Content analysis', [['topics', 'Observed content terms'], ['gaps', 'Competitor topic gaps']]),
    links: search + select('kind', 'Link direction', [['incoming', 'Observed incoming links'], ['outgoing', 'Observed outgoing links']]),
  };
  $('#view-controls').innerHTML = report && controls[state.view] ? '<div class="seo-filters">' + controls[state.view] + '</div>' : '';
  $('#view-controls').querySelectorAll('[data-filter]').forEach(input => input.addEventListener('input', () => {
    state.filters[input.dataset.filter] = input.value; state.page = 0; renderContent();
  }));
}
function renderView() {
  $('#report-site-label').hidden = !report || ['competitors', 'reports'].includes(state.view);
  if (report) {
    $('#report-site').innerHTML = sites().map((site, i) => `<option value="${i}" ${i === state.site ? 'selected' : ''}>${esc(host(site.url))}${i ? ' · competitor' : ' · your website'}</option>`).join('');
  }
  setupControls(); renderContent();
}
function dataTable(headers, records, plainCells, htmlCells = record => plainCells(record).map(value)) {
  exportData = { headers, rows: records.map(plainCells) };
  const pages = Math.max(1, Math.ceil(records.length / 20));
  state.page = Math.max(0, Math.min(state.page, pages - 1));
  $('#view-pagination').innerHTML = `<div class="seo-pagination">${button('Previous', 'data-page-step="-1" ' + (state.page ? '' : 'disabled'))}<span>${records.length} rows · Page ${state.page + 1} of ${pages}</span>${button('Next', 'data-page-step="1" ' + (state.page >= pages - 1 ? 'disabled' : ''))}</div>`;
  return records.length ? table(headers, records.slice(state.page * 20, (state.page + 1) * 20).map(record => row(htmlCells(record), headers))) : '<p class="seo-source-note">No records match this selection. Check the filters and crawl coverage.</p>';
}
function welcome() {
  const features = [
    ['shield', 'Issues you can investigate', 'Filter findings, inspect the source page and track what you have reviewed.'],
    ['target', 'Competitors you choose', 'Run the same checks against your website and up to two competitor domains.'],
    ['pen', 'Content and link evidence', 'Explore observed terms, competitor topic gaps and links from the sampled pages.'],
    ['download', 'Reports you can use', 'Download the PDF, export filtered CSV data and share a report link.'],
  ];
  return `<section class="seo-empty">${icon('search')}<h3>Start with your website</h3><p>Enter a public website, add competitors if you want a comparison, and choose how many pages to scan.</p>${button('Set up my audit ' + icon('arrow'), 'data-setup')}<div class="seo-empty-capabilities">${features.map(([symbol, title, description]) => `<article>${icon(symbol)}<div><h4>${title}</h4><p>${description}</p></div></article>`).join('')}</div></section>`;
}
function overview() {
  const site = selectedSite(), summary = site.summary, coverage = site.coverage;
  if (!summary) return panel('The website could not be fully evaluated', '<p class="seo-error">' + esc(site.error || 'No HTML pages could be evaluated.') + '</p>' + note('Review the response and access evidence in Crawled pages or Crawler access. A new scan can be started with Run again.'));
  const stats = [['HTML pages evaluated', coverage.htmlPages], ['Errors', summary.errors], ['Warnings', summary.warnings], ['Checks passed', summary.passed + ' / ' + summary.checks], ['Avg response to headers', summary.averageResponseMs + ' ms'], ['Content terms indexed', selectedIndex()?.uniqueTerms ?? null]];
  const priorities = groupPriorities(site).slice(0, 4);
  return `<div class="seo-score-grid">${stats.map(([label, amount]) => `<article class="seo-score-card"><strong>${value(amount)}</strong><span>${label}</span></article>`).join('')}</div>
    <div class="seo-overview-grid">${panel('Calculated audit health', `<div class="seo-health"><div class="seo-health-ring" style="--health:${Math.max(0, Math.min(100, summary.health))}" aria-label="Audit health ${summary.health} out of 100"><div><b>${summary.health}</b><small>out of 100</small></div></div><p>${summary.passed} of ${summary.checks} observed checks passed.<br>Reviewing a finding does not change its measured result.</p></div>`)}
    ${panel('Your next actions', priorities.length ? '<ol class="seo-priorities">' + priorities.map(issue => `<li><span class="seo-severity ${issue.severity}">${issue.severity}</span> <b>${esc(issue.label)}</b><p>${issue.count} occurrence(s). ${esc(issue.recommendation)}</p></li>`).join('') + '</ol>' + button('Investigate issues ' + icon('arrow'), 'data-open-view="issues"') : note('No findings returned by these checks. Review the sample coverage.'))}</div>
    ${panel('Checks by category', '<div class="seo-check-groups">' + (site.groups || []).map(group => `<article><h4>${esc(group.name)}</h4><div class="seo-check-bar"><span style="width:${group.checked ? Math.round(group.passed / group.checked * 100) : 0}%"></span></div><p>${group.passed} / ${group.checked} passed · ${group.findings} findings</p></article>`).join('') + '</div>')}
    ${panel('Coverage and measurement method', note(coverage.crawled + ' of ' + coverage.discovered + ' discovered URLs fetched. ' + coverage.htmlPages + ' HTML pages evaluated. Limit ' + coverage.limit + ' URLs per website. ' + (coverage.truncated || coverage.timedOut ? 'This is a partial sample. ' : '') + 'Observed ' + date(site.startedAt) + ' to ' + date(site.finishedAt) + '.') + note(report.methodology))}`;
}
function issues() {
  const seen = reviewed(), records = filterIssues(selectedSite(), state.filters, seen);
  const headers = ['Priority', 'Finding and page', 'Evidence and action', 'Review'];
  return panel('Findings for ' + esc(host(selectedSite().url)), note('Review status is saved in this browser. Verify fixes with a fresh audit after making changes.') + dataTable(headers, records,
    issue => [issue.severity, issue.label + ' | ' + issue.url, issue.evidence + ' | ' + issue.recommendation, seen.has(issueKey(issue)) ? 'Reviewed' : 'Not reviewed'],
    issue => [`<span class="seo-severity ${issue.severity}">${issue.severity}</span><small>${esc(issue.group)}</small>`, '<b>' + esc(issue.label) + '</b><small>' + link(issue.url) + '</small>', esc(issue.evidence) + '<small><b>Action</b> ' + esc(issue.recommendation) + '</small>',
      button(seen.has(issueKey(issue)) ? 'Reviewed ✓' : 'Mark reviewed', 'data-review="' + esc(issueKey(issue)) + '" aria-pressed="' + seen.has(issueKey(issue)) + '"')]));
}
function pagesView() {
  return panel('Page inventory', note('Open a page to inspect its title, headings, canonical, structured data and page-specific findings.') + dataTable(
    ['Page / title', 'HTTP', 'Response', 'Words', 'Indexing / details'], filterPages(selectedSite(), state.filters),
    page => [page.url + ' | ' + (page.title || page.error || ''), page.status, page.responseMs, page.wordCount, page.indexable === undefined ? 'Unavailable' : page.indexable ? 'Allowed' : 'Blocked'],
    page => [link(page.url) + '<small>' + esc(page.title || page.error || 'Title unavailable') + '</small>', value(page.status), page.responseMs === undefined ? 'Unavailable' : value(page.responseMs) + ' ms', value(page.wordCount), (page.indexable === undefined ? 'Unavailable' : page.indexable ? 'Allowed' : 'Blocked') + '<br>' + button('Inspect page', 'data-inspect="' + esc(page.url) + '"')]));
}
function contentView() {
  const query = (state.filters.query || '').toLowerCase();
  if (state.filters.kind === 'gaps') {
    const gaps = (report.intelligence?.topicGaps || []).filter(gap => [gap.term, ...gap.competitorDomains].join(' ').toLowerCase().includes(query));
    return panel('Competitor topic opportunities', note('Terms observed on competitor pages and absent from the primary website’s sampled pages. Review relevance before creating content.') + dataTable(
      ['Observed term', 'Competitor domains', 'Occurrences / pages', 'Evidence'], gaps,
      gap => [gap.term, gap.competitorDomains.join('; '), gap.occurrences + ' / ' + gap.pageCount, gap.pages.join('; ')],
      gap => [esc(gap.term), gap.competitorDomains.map(esc).join('<br>'), gap.occurrences + ' / ' + gap.pageCount, gap.pages.map(link).join('<br>')]));
  }
  const index = selectedIndex();
  const topics = (index?.topics || []).filter(topic => topic.term.toLowerCase().includes(query));
  return panel('Observed content terms', note('Showing up to ' + (index?.topics.length || 0) + ' leading terms from ' + (index?.uniqueTerms || 0) + ' indexed terms for this website. Occurrences are counted from sampled titles, descriptions and main text.') + dataTable(
    ['Term', 'Occurrences', 'Pages', 'Titles / H1', 'Source examples'], topics,
    topic => [topic.term, topic.occurrences, topic.pageCount, topic.titlePages + ' / ' + topic.headingPages, topic.pages.join('; ')],
    topic => [esc(topic.term), value(topic.occurrences), value(topic.pageCount), topic.titlePages + ' / ' + topic.headingPages, topic.pages.map(link).join('<br>')]));
}
function comparison() {
  const data = [
    ['Calculated health /100', site => site.summary?.health], ['HTML pages evaluated', site => site.coverage?.htmlPages],
    ['Discovered URLs', site => site.coverage?.discovered], ['Errors', site => site.summary?.errors], ['Warnings', site => site.summary?.warnings],
    ['Indexing-allowed pages', site => site.summary?.indexablePages], ['Avg response to headers (ms)', site => site.summary?.averageResponseMs],
    ['Avg source word count', site => site.summary?.averageWords], ['Missing image alt attributes', site => site.summary?.missingAlt],
    ['Content terms indexed', site => report.intelligence?.sites.find(item => item.url === site.url)?.uniqueTerms],
    ['Incoming links observed', site => report.intelligence?.sites.find(item => item.url === site.url)?.observedBacklinks.length],
    ['Referring domains observed', site => report.intelligence?.sites.find(item => item.url === site.url)?.referringDomains],
  ];
  if (sites().length < 2) return panel('Add a competitor to compare', note('This report contains one website. Add a competitor in the setup form and run a new audit for a comparison.') + button('Edit audit setup', 'data-setup'));
  return panel('Side-by-side website measurements', note('Every domain uses the same checks and page limit. Discovered content and sample coverage vary. Response times are measured from this audit server.') + dataTable(
    ['Measurement', ...sites().map(site => host(site.url))], data, ([label, measure]) => [label, ...sites().map(measure)]));
}
function linkRecords() {
  if (state.filters.kind !== 'outgoing') return selectedIndex()?.observedBacklinks || [];
  const distinct = new Map();
  for (const page of selectedSite().pages) for (const item of page.outboundLinks || []) {
    if (host(item.url).replace(/^www\./, '') === host(page.url).replace(/^www\./, '')) continue;
    const entry = { source: page.url, destination: item.url, anchor: item.anchor, rel: item.rel, observedAt: selectedSite().finishedAt };
    distinct.set(entry.source + '\n' + entry.destination, entry);
  }
  return [...distinct.values()];
}
function linksView() {
  const query = (state.filters.query || '').toLowerCase();
  const records = linkRecords().filter(item => [item.source, item.destination, item.anchor, item.rel].join(' ').toLowerCase().includes(query));
  return panel('Cross-domain link evidence', note('These are distinct page-to-destination links observed within this report’s crawl. This sample does not establish a web-wide backlink total.') + dataTable(
    ['Referring page', 'Destination', 'Anchor / rel', 'Observed'], records,
    item => [item.source, item.destination, (item.anchor || '') + ' | ' + (item.rel || ''), item.observedAt],
    item => [link(item.source), link(item.destination), esc(item.anchor || 'No anchor text') + '<small>' + esc(item.rel || 'No rel attribute') + '</small>', date(item.observedAt)]));
}
function accessView() {
  const site = selectedSite();
  return panel('Search and AI crawler rules', '<div class="seo-access-grid">' + (site.crawlerAccess || []).map(bot => `<article><h4>${esc(bot.name)}</h4><span class="${bot.allowed ? 'seo-allowed' : 'seo-blocked'}">${bot.allowed ? 'Allowed' : 'Blocked'}</span></article>`).join('') + '</div>' +
    note('Access is based on the home-page rules in robots.txt. Allowed access does not establish indexing, search positions or AI citations.') +
    '<p class="seo-source-note">Robots file ' + link(site.robots?.url) + ' · HTTP ' + value(site.robots?.status) + '</p>') +
    panel('What was measured', note('Public HTTP responses and source HTML, plus robots.txt and XML sitemaps. Resource checks sample up to eight same-site URLs. JavaScript-only content, browser usability and real-user Core Web Vitals require additional measurements.') +
      note(report.intelligence?.scope || 'Content and link evidence comes from the evaluated source pages.'));
}
function historyView() {
  const items = historyItems();
  if (!items.length) return '<section class="seo-empty">' + icon('receipt') + '<h3>Your reports will be saved here</h3><p>After a scan completes, you can reopen its report, request a fresh scan or download its PDF. Reports remain available for 24 hours.</p>' + button('Start an audit', 'data-setup') + '</section>';
  return '<div class="seo-history">' + items.map(item => {
    const expired = Date.now() > (item.expiresAt ? new Date(item.expiresAt).getTime() : new Date(item.at).getTime() + 86400000);
    return `<article><div><h3>${esc(item.domain)}</h3><p>${date(item.at)} · ${expired ? 'Report expired' : 'Available until ' + date(item.expiresAt || new Date(new Date(item.at).getTime() + 86400000))}</p></div><div class="seo-history-actions">${button('Open', 'data-history-open="' + item.id + '" ' + (expired ? 'disabled' : ''))}${button('Run again', 'data-history-rerun="' + item.id + '"')}${!expired ? '<a class="seo-button seo-primary" href="/api/seo/audits/' + item.id + '/report.pdf" download>PDF</a>' : ''}${button('Remove from history', 'data-history-remove="' + item.id + '"')}</div></article>`;
  }).join('') + note('This list belongs to this browser. Removing a history entry does not delete the shared report. Anyone with its report link can view it until expiry.');
}
function renderContent() {
  exportData = null;
  $('#view-pagination').innerHTML = '';
  const renders = { overview, issues, pages: pagesView, content: contentView, competitors: comparison, links: linksView, access: accessView, reports: historyView };
  $('#view-content').innerHTML = state.view === 'reports' ? historyView() : !report ? welcome() : renders[state.view]();
  $('#export-csv').hidden = !exportData || !exportData.rows.length;
  const scopeIsTarget = state.view === 'content' && state.filters.kind === 'gaps';
  $('#report-site-label').hidden = !report || ['competitors', 'reports'].includes(state.view) || scopeIsTarget;
}
function setup() {
  $('#audit-setup').scrollIntoView?.({ block: 'start' });
  form.elements.url.focus();
}
async function watch(id) {
  controller?.abort(); controller = new AbortController();
  const { signal } = controller;
  activeId = id; report = null; state.site = 0;
  $('#share-fallback').hidden = true;
  busy(true); status('Connecting', 'running'); feedback(''); $('#audit-error').hidden = true; $('#audit-progress').hidden = false;
  $('#report-heading').textContent = 'Building your report';
  $('#report-meta').textContent = 'Your live crawl is being prepared.';
  selectView('overview');
  try {
    for (;;) {
      const result = await request('/api/seo/audits/' + id, undefined, signal);
      if (result.input) fillForm(result.input);
      if (result.status === 'failed') throw Error(result.error || 'The audit could not finish.');
      if (result.status === 'cancelled') {
        status('Scan stopped', 'cancelled'); feedback(result.error); return;
      }
      if (result.status === 'complete') {
        job = result; report = result.report; remember(result); fillForm(reportInput(report));
        $('#report-heading').textContent = host(report.target.url);
        $('#report-meta').textContent = 'Observed ' + date(report.target.startedAt) + ' · Report available until ' + date(result.expiresAt);
        $('#download-report').href = '/api/seo/audits/' + report.id + '/report.pdf';
        status(report.target.summary ? 'Report ready' : 'Coverage needs review');
        $('#audit-progress').hidden = true; selectView('overview'); return;
      }
      const step = result.progress || {};
      status(result.status === 'queued' ? 'Queued' : 'Scanning', 'running');
      $('#progress-title').textContent = step.message || 'Waiting to start…';
      $('#progress-detail').textContent = 'Website ' + ((step.domainIndex || 0) + 1) + ' of ' + (step.domains || 1) + ' · ' + (step.pages || 0) + ' of up to ' + (step.maxPages || 25) + ' pages. The full audit may take a few minutes.';
      $('#progress-meter').value = Math.min(98, Math.round(((step.domainIndex || 0) + (step.pages || 0) / (step.maxPages || 25) * .9) / (step.domains || 1) * 100));
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { signal.removeEventListener('abort', stop); resolve(); }, 1500);
        function stop() { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }
        signal.addEventListener('abort', stop, { once: true });
      });
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      status('Audit unavailable', 'failed');
      $('#audit-error').textContent = error.message; $('#audit-error').hidden = false;
      feedback(error.message + ' Review the setup or try a new audit.');
    }
  } finally {
    if (!signal.aborted) { activeId = null; busy(false); $('#audit-progress').hidden = true; }
  }
}
async function launch(input, force = false) {
  if (state.busy) return feedback('Stop the current scan before starting another audit.');
  busy(true); feedback(''); $('#audit-error').hidden = true;
  try {
    const result = await request('/api/seo/audits', { ...input, force });
    history.replaceState(null, '', '#audit-' + result.id);
    await watch(result.id);
  } catch (error) {
    busy(false); $('#audit-error').textContent = error.message; $('#audit-error').hidden = false;
  }
}
function inspectPage(url) {
  const site = selectedSite(), page = site.pages.find(item => item.url === url);
  if (!page) return;
  const facts = [['HTTP response', page.status], ['Response to headers', page.responseMs === undefined ? null : page.responseMs + ' ms'], ['Source word count', page.wordCount], ['Canonical', page.canonical], ['Main headings', (page.h1 || []).join(' · ') || null], ['JSON-LD types', (page.schemaTypes || []).join(', ') || null], ['Incoming sample links', page.sources.length], ['Images missing alt', page.missingAlt]];
  const findings = site.issues.filter(issue => issue.url === page.url);
  $('#page-detail-content').innerHTML = '<div class="seo-dialog-header"><h2 id="page-detail-title">Page evidence</h2>' + button('Close', 'data-close-dialog') + '</div><p>' + link(page.url) + '</p>' +
    '<section class="seo-snippet"><small>Source-based snippet preview</small><h3>' + esc(page.title || 'Title missing') + '</h3><p>' + esc(page.description || 'Meta description missing') + '</p></section>' +
    '<dl class="seo-page-facts">' + facts.map(([title, amount]) => '<div><dt>' + title + '</dt><dd>' + value(amount) + '</dd></div>').join('') + '</dl><h3>Findings for this page</h3>' +
    (findings.length ? '<ul class="seo-dialog-findings">' + findings.map(issue => '<li><b>' + esc(issue.label) + '</b><br>' + esc(issue.evidence) + '<br>' + esc(issue.recommendation) + '</li>').join('') + '</ul>' : note('No page-specific findings returned. Review coverage and site-wide checks.'));
  $('#page-detail').showModal();
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const fields = Object.fromEntries(new FormData(form));
  launch({ url: fields.url.trim(), competitors: [fields.competitor1.trim(), fields.competitor2.trim()].filter(Boolean), maxPages: Number(fields.maxPages) });
});
document.querySelectorAll('[data-view]').forEach(tab => {
  tab.onclick = () => selectView(tab.dataset.view);
  tab.onkeydown = event => {
    const tabs = [...document.querySelectorAll('[data-view]')], index = tabs.indexOf(tab);
    const next = { ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault(); const chosen = tabs[(next + tabs.length) % tabs.length]; chosen.focus(); selectView(chosen.dataset.view);
  };
});
$('#report-site').onchange = event => { state.site = Number(event.target.value); selectView(state.view); };
$('#new-audit').onclick = () => {
  if (state.busy) return feedback('Stop the current scan before creating a new audit.');
  report = null; job = null; state.site = 0; form.reset(); controller?.abort();
  $('#share-fallback').hidden = true;
  history.replaceState(null, '', location.pathname + location.search);
  $('#report-heading').textContent = 'Your website report'; $('#report-meta').textContent = 'Enter your website to build a report from live observations.';
  status('Ready to audit'); busy(false); feedback(''); $('#audit-error').hidden = true; selectView('overview'); setup();
};
$('#run-again').onclick = () => { if (report) launch(reportInput(report), true); };
$('#cancel-audit').onclick = async () => {
  if (!activeId) return;
  $('#cancel-audit').disabled = true;
  try {
    const result = await request('/api/seo/audits/' + activeId + '/cancel', {});
    controller?.abort(); activeId = null; busy(false); $('#audit-progress').hidden = true;
    status('Scan stopped', 'cancelled'); feedback(result.error); fillForm(result.input);
  } catch (error) { feedback(error.message); $('#cancel-audit').disabled = false; }
};
$('#share-report').onclick = async () => {
  if (!report) return;
  const url = location.origin + location.pathname + '#audit-' + report.id;
  try { await navigator.clipboard.writeText(url); feedback('Report link copied. Anyone with this link can view the report until ' + date(job.expiresAt) + '.'); }
  catch { $('#share-fallback').hidden = false; $('#share-fallback input').value = url; $('#share-fallback input').select(); feedback('Copy the report link from the field above.'); }
};
$('#export-csv').onclick = () => {
  if (!exportData?.rows.length) return;
  const blob = new Blob([csvDocument(exportData.headers, exportData.rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'vintorex-' + state.view + '-' + host(selectedSite().url) + '.csv';
  document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback('CSV exported with ' + exportData.rows.length + ' rows from the current view and filters.');
};
$('#audit-view').onclick = async event => {
  const target = event.target.closest('button'); if (!target) return;
  if (target.hasAttribute('data-setup')) return setup();
  if (target.dataset.openView) return selectView(target.dataset.openView);
  if (target.dataset.pageStep) { state.page += Number(target.dataset.pageStep); return renderContent(); }
  if (target.dataset.review) {
    const seen = reviewed(), key = target.dataset.review;
    if (seen.has(key)) seen.delete(key); else seen.add(key);
    store('vx_seo_review_' + report.id, [...seen]); renderContent(); return;
  }
  if (target.dataset.inspect) return inspectPage(target.dataset.inspect);
  if (target.dataset.historyOpen) {
    if (state.busy) return feedback('Stop the current scan before opening another report.');
    history.replaceState(null, '', '#audit-' + target.dataset.historyOpen);
    return watch(target.dataset.historyOpen);
  }
  if (target.dataset.historyRerun) {
    if (state.busy) return feedback('Stop the current scan before running another.');
    const item = historyItems().find(entry => entry.id === target.dataset.historyRerun);
    if (item.input) { fillForm(item.input); return launch(item.input, true); }
    try { const old = await request('/api/seo/audits/' + item.id); const input = reportInput(old.report); fillForm(input); await launch(input, true); }
    catch (error) { feedback(error.message + ' Enter the website in the setup form to create a new report.'); setup(); }
  }
  if (target.dataset.historyRemove) { store('vx_seo_reports', historyItems().filter(item => item.id !== target.dataset.historyRemove)); renderContent(); }
};
$('#page-detail').onclick = event => { if (event.target.closest('[data-close-dialog]')) $('#page-detail').close(); };
function openHash() {
  const id = location.hash.replace('#audit-', '');
  if (pattern.test(id) && report?.id !== id && activeId !== id) watch(id);
}
window.addEventListener('hashchange', openHash);
window.addEventListener('pagehide', () => controller?.abort());
window.addEventListener('pageshow', event => { if (event.persisted && !report) { activeId = null; openHash(); } });
selectView('overview'); openHash();
