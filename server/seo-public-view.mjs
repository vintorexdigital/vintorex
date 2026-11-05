import { icon } from '../dist/js/ui.js';

const views = [
  ['overview', 'Overview', 'chart'], ['issues', 'Issues & actions', 'shield'],
  ['pages', 'Crawled pages', 'web'], ['content', 'Content & topic gaps', 'pen'],
  ['competitors', 'Competitor comparison', 'target'], ['links', 'Link evidence', 'social'],
  ['access', 'Crawler access', 'bot'], ['reports', 'Saved reports', 'receipt'],
];
export function publicAuditShell() {
  return `<!doctype html>
<html lang="en-IN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><meta name="description" content="Audit your website, investigate SEO issues, compare competitors, explore content and link evidence, and download your report.">
<title>SEO audit workspace · Vintorex</title>
<link rel="stylesheet" href="/css/typography.css"><link rel="stylesheet" href="/css/app.css"><link rel="stylesheet" href="/css/seo-audit.css">
</head><body class="seo-audit-page">
<a class="skip" href="#audit-form">Skip to audit setup</a>
<header class="seo-header"><a class="seo-brand" href="/"><img src="/images/vintorex-emblem-144.webp" alt="" width="46" height="30"><span>Vintorex<small>SEO WORKSPACE</small></span></a><div class="seo-header-links"><span class="seo-free">No sign-in required</span><a href="/contact">Get help with fixes ${icon('arrow')}</a></div></header>
<main class="seo-app" id="main">
<div class="seo-page-heading"><div><p class="seo-kicker">WEBSITE AUDIT & COMPETITOR INTELLIGENCE</p><h1>Find the issues. Plan your next move.</h1><p>Run a live scan, investigate the evidence and take your action plan with you.</p></div><button class="seo-button seo-outline" id="new-audit" type="button">${icon('plus')} New audit</button></div>
<div class="seo-workspace">
<aside class="seo-sidebar" aria-label="Audit setup and report navigation">
<section class="seo-setup" id="audit-setup"><div class="seo-sidebar-title"><span>${icon('search')}</span><h2>Set up your audit</h2></div>
<form id="audit-form">
<label class="seo-field">Your website<input name="url" required maxlength="2000" inputmode="url" autocomplete="url" placeholder="example.com"></label>
<details class="seo-competitor-inputs" open><summary>Compare competitors <span>optional · up to 2</span></summary>
<label class="seo-field"><span class="seo-sr-only">Competitor website 1</span><input name="competitor1" maxlength="2000" inputmode="url" placeholder="First competitor domain"></label>
<label class="seo-field"><span class="seo-sr-only">Competitor website 2</span><input name="competitor2" maxlength="2000" inputmode="url" placeholder="Second competitor domain"></label></details>
<label class="seo-field">Crawl size per website<select name="maxPages"><option value="10">10 pages · quick scan</option><option value="25" selected>25 pages · standard scan</option><option value="40">40 pages · wider scan</option></select></label>
<button class="seo-button seo-primary seo-full" type="submit" id="audit-submit">${icon('search')} Run complete audit</button>
<p class="seo-form-note">Up to 90 seconds per website. Accessible public pages are checked using the same rules for every domain.</p>
<p class="seo-error" id="audit-error" role="alert" hidden></p>
</form></section>
<nav class="seo-view-nav" role="tablist" aria-label="Audit report" aria-orientation="vertical">${views.map(([id, title, symbol], index) => `<button type="button" role="tab" id="tab-${id}" data-view="${id}" aria-controls="audit-view" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}">${icon(symbol)}<span>${title}</span></button>`).join('')}</nav>
<details class="seo-how"><summary>Audit coverage & scoring</summary><p>Checks cover technical SEO, metadata, content, internal links, structured data, international SEO, HTTPS, source performance and social previews.</p><p>Health is the weighted pass rate across observed checks. Errors carry weight 5, warnings 2 and notices 1. Reviewed items keep their original measurements.</p><p>Source HTML can omit JavaScript-generated content. Search traffic, search volumes, search-result positions, real-user Core Web Vitals and web-wide backlink totals require separate direct measurements.</p><p>Reports are available for 24 hours to anyone with their report link. Matching scans can reuse a report for ten minutes. Run again requests a fresh scan.</p></details>
</aside>
<section class="seo-report-area" aria-label="Your audit workspace">
<div class="seo-report-toolbar"><div><span class="seo-status" id="report-status">Ready to audit</span><h2 id="report-heading">Your website report</h2><p id="report-meta">Enter your website to build a report from live observations.</p></div><div class="seo-report-actions"><button type="button" id="run-again" class="seo-button seo-outline" disabled>${icon('repeat')} Run again</button><button type="button" id="share-report" class="seo-button seo-outline" disabled>${icon('social')} Share</button><a id="download-report" class="seo-button seo-primary" hidden download>${icon('download')} PDF report</a><button type="button" id="pdf-placeholder" class="seo-button seo-primary" disabled>${icon('download')} PDF report</button></div></div>
<p class="seo-feedback" id="workspace-feedback" role="status" hidden></p>
<label id="share-fallback" class="seo-field" hidden>Copy this report link<input readonly aria-label="Report link"></label>
<section id="audit-progress" class="seo-progress" hidden aria-live="polite"><div><div class="seo-scan-indicator" aria-hidden="true"></div><div><p class="seo-kicker">LIVE SCAN</p><h3 id="progress-title">Connecting to your website…</h3></div><button type="button" class="seo-button seo-outline" id="cancel-audit">Stop scan</button></div><progress id="progress-meter" max="100"></progress><p id="progress-detail"></p></section>
<div class="seo-view-top"><div><p class="seo-kicker" id="view-eyebrow">YOUR AUDIT AT A GLANCE</p><h2 id="view-heading">Overview</h2></div><div class="seo-view-tools"><label class="seo-field" id="report-site-label" hidden><span class="seo-sr-only">Website in this report</span><select id="report-site" aria-label="Website in this report"></select></label><button type="button" id="export-csv" class="seo-button seo-outline" hidden>${icon('download')} Export CSV</button></div></div>
<section id="audit-view" role="tabpanel" aria-labelledby="tab-overview" tabindex="0"><div id="view-controls"></div><div id="view-content"></div><div id="view-pagination"></div></section>
</section></div>
<footer class="seo-footer"><span>Built and measured by Vintorex</span><a href="/">Back to the website ${icon('arrow')}</a></footer>
</main>
<dialog class="seo-page-dialog" id="page-detail" aria-labelledby="page-detail-title"><div id="page-detail-content"></div></dialog>
<noscript><p class="seo-noscript">Enable JavaScript to start a live audit, explore report sections and download results. You can also <a href="/contact">contact us for help with your website</a>.</p></noscript>
<script type="module" src="/js/seo-audit.js"></script></body></html>`;
}
