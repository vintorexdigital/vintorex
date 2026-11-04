export function publicAuditShell(diagnostics) {
  return `<!doctype html>
<html lang="en-IN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><meta name="description" content="Run a live public website SEO audit, compare competitor websites, and download a PDF report with measured findings.">
<title>Public SEO audit & competitor comparison · Vintorex</title>
<link rel="stylesheet" href="/css/typography.css"><link rel="stylesheet" href="/css/app.css"><link rel="stylesheet" href="/css/seo-audit.css">
</head><body class="seo-audit-page">
<a class="skip" href="#main">Skip to audit</a>
<header class="seo-header"><a class="seo-brand" href="/"><img src="/images/vintorex-emblem-144.webp" alt="" width="50" height="32"><span>Vintorex<small>WEBSITE INTELLIGENCE</small></span></a><nav aria-label="Audit navigation"><a href="#audit-form">Run an audit</a><a href="#audit-scope">What we check</a><a href="/contact">Get help with fixes</a></nav></header>
<main id="main" class="seo-shell">
<section class="seo-hero"><div><p class="seo-kicker">PUBLIC SEO AUDIT</p><h1>See what’s holding<br>your website back.</h1><p class="seo-intro">Audit live pages, compare the websites you compete with, and leave with a clear action plan.</p><ul class="seo-promises"><li>Live website measurements</li><li>Prioritized findings</li><li>Downloadable PDF</li></ul></div><aside class="seo-hero-note"><span>FROM SCAN TO ACTION</span><strong>One report.<br>A clearer next step.</strong><p>Technical checks, page-level evidence and competitor benchmarks in one place.</p><a href="#audit-scope">Explore the audit scope ↓</a></aside></section>
<section class="seo-panel seo-form-panel"><div class="seo-section-head"><div><p class="seo-kicker">START WITH YOUR WEBSITE</p><h2>Run a public audit</h2></div><span class="seo-pill">No sign-in required</span></div>
<form id="audit-form">
<label class="seo-field seo-main-url">Your website<input name="url" required maxlength="2000" inputmode="url" autocomplete="url" placeholder="example.com or https://example.com"></label>
<div class="seo-grid2"><label class="seo-field">Competitor website 1 <small>Optional</small><input name="competitor1" maxlength="2000" inputmode="url" placeholder="competitor.com"></label><label class="seo-field">Competitor website 2 <small>Optional</small><input name="competitor2" maxlength="2000" inputmode="url" placeholder="another-competitor.com"></label></div>
<div class="seo-form-bottom"><label class="seo-field">Pages per website<select name="maxPages"><option value="10">10 pages · quick sample</option value="25" selected>25 pages · standard sample</option><option value="40">40 pages · wider sample</option></select></label><button class="btn primary" type="submit" id="audit-submit">Audit my website <span aria-hidden="true">↗</span></button></div>
<p class="seo-help">Public pages only. Each website has a 90-second crawl budget. Reports are available for 24 hours to anyone with their report link.</p>
<p class="seo-error" id="audit-error" role="alert" hidden></p>
</form></section>
<section id="audit-progress" class="seo-panel" hidden aria-live="polite"><p class="seo-kicker">LIVE AUDIT IN PROGRESS</p><h2 id="progress-title">Starting your crawl…</h2><progress id="progress-meter" max="100"></progress><p id="progress-detail"></p></section>
<div id="audit-results" hidden></div>
<section class="seo-panel" id="recent-audits" hidden><h2>Your recent reports</h2><p class="seo-help">Saved in this browser. Expired reports can be run again.</p><ul id="recent-list"></ul></section>
<section id="audit-scope" class="seo-scope"><p class="seo-kicker">WHAT’S INCLUDED</p><h2>A practical view of your site’s SEO.</h2><div class="seo-scope-grid">
<article><span>01</span><h3>Technical foundations</h3><p>HTTP responses, redirects, robots.txt, indexing directives, sitemaps, HTTPS and mixed content.</p></article>
<article><span>02</span><h3>Pages & content</h3><p>Titles, descriptions, headings, duplicate source content, canonicals, image alt text and social previews.</p></article>
<article><span>03</span><h3>Links & discovery</h3><p>Incoming internal links in the sample, broken crawled destinations, accessible link text and sampled resource responses.</p></article>
<article><span>04</span><h3>Structure & performance</h3><p>JSON-LD syntax, language and hreflang declarations, HTML size, image dimensions and server response timing.</p></article>
<article><span>05</span><h3>Competitor comparison</h3><p>The same live checks across up to two competitor domains, with coverage and measurement times shown.</p></article>
<article><span>06</span><h3>Search & AI access</h3><p>Observed robots.txt rules for search and AI crawlers. The project’s own content and link index identifies observed topics, competitor content gaps and cross-domain link evidence.</p></article>
</div><p class="seo-method-note">This audit analyzes source HTML. JavaScript-rendered content, real-user Core Web Vitals, complete web-wide backlink coverage and search-result positions require separate direct measurements. All displayed audit metrics come from the project’s own scans.</p></section>
<details class="seo-panel seo-diagnostics"><summary>Vintorex scheduled crawl and published-site setup</summary>${diagnostics}</details>
<footer class="seo-footer"><a href="/">Vintorex Digital Solutions</a><span>Measured findings. Practical fixes.</span></footer>
</main><script type="module" src="/js/seo-audit.js"></script></body></html>`;
}
