import { esc, icon } from './ui.js';

const features = [
  ['search', 'Technical & on-page SEO', 'Review HTTP responses, redirects, indexing rules, sitemaps, titles, descriptions, headings, canonical URLs and duplicate source content.'],
  ['target', 'Competitor benchmarks', 'Compare your website with up to two competitors using the same checks and page limit. See coverage, errors, warnings and response timings side by side.'],
  ['spark', 'Content opportunities', 'Explore terms observed in page text, their occurrences and title or heading matches. Find competitor topics absent from your sampled pages, with source links.'],
  ['social', 'Observed link evidence', 'Inspect incoming internal links and cross-domain links found among the crawled websites. Review referring pages, destinations, anchor text and observation times.'],
  ['bot', 'Search & AI crawler access', 'Check robots.txt rules for Googlebot and AI crawlers, plus language declarations, hreflang links, JSON-LD syntax and social preview metadata.'],
  ['zap', 'Performance observations', 'Review response-to-header timings, HTML size, image dimensions and missing alt attributes. Sample up to eight same-site resource responses per website.'],
  ['receipt', 'Prioritized PDF reports', 'Get a calculated audit health score, grouped checks, error and warning filters, recommended fixes, page inventories and a downloadable competitor report.'],
  ['database', 'Reports you can revisit', 'Open recent reports from the same browser or share a report link. Reports are available for 24 hours, with measurement times and crawl coverage included.'],
];
const questions = [
  ['Do I need an account or an SEO subscription?', 'No sign-in or external SEO subscription is required. Vintorex runs its own crawler, content and link analysis, report storage and PDF generation.'],
  ['How much of my website will be checked?', 'Choose a sample of 10, 25 or 40 pages for each website. Each domain has a 90-second crawl budget, and robots.txt rules are respected. The report shows how many URLs were discovered and evaluated, including partial coverage.'],
  ['What does the audit health score measure?', 'The score summarizes observed checks using severity weights of 5 for errors, 2 for warnings and 1 for notices. Each finding includes its evidence and a recommended action. Editorial thresholds identify items worth reviewing.'],
  ['Which measurements need further testing?', 'The audit reads public HTTP responses and source HTML. JavaScript-only content may be absent. Search traffic, keyword search volumes, Google positions, real-user Core Web Vitals and web-wide backlink totals require separate direct measurements.'],
  ['What does the PDF include?', 'The PDF includes an executive summary, competitor benchmarks, prioritized actions, thematic checks, crawler access rules, observed content terms, cross-domain link evidence and crawled URL inventories.'],
  ['How fresh are the results?', 'Every report includes observation times. Matching audit requests can reuse the same report for ten minutes. Use Run again to request a fresh scan after making changes.'],
  ['Who can view my report?', 'Anyone with the report link can view it during its 24-hour availability period. Your recent-report list is saved in your browser.'],
];

export function auditFeature({ helpHref = '#audit-help' } = {}) {
  return `<section class="shell section public-audit-feature" id="audit" aria-labelledby="public-audit-heading">
    <div class="public-audit-intro">
      <div class="public-audit-copy">
        <p class="eyebrow"><span></span>Free public SEO audit · Built by Vintorex</p>
        <h2 id="public-audit-heading">A clearer picture of your website.<br><em>A practical plan to improve it.</em></h2>
        <p class="lead">Run a live website audit, compare your competitors, and download a report that connects each finding to the page we checked.</p>
        <ul class="public-audit-badges" aria-label="Audit highlights"><li>No sign-in required</li><li>Up to 2 competitors</li><li>PDF download included</li></ul>
        <div class="row gap wrap"><a class="btn primary lg" href="/seo-audit">Run a free SEO audit ${icon('arrow')}</a><a class="btn ghost" href="#audit-included">Explore all features</a></div>
        <p class="public-audit-caption">Your website + two competitors · Choose 10, 25 or 40 pages per website</p>
      </div>
      <aside class="public-audit-report" aria-label="What your audit report contains">
        <div class="public-audit-report-title"><span class="public-audit-report-icon">${icon('receipt')}</span><div><small>INSIDE YOUR REPORT</small><h3>Findings you can act on</h3></div></div>
        <ol>
          <li><span>01</span><div><b>Understand your site</b><small>Calculated health, coverage and thematic checks</small></div></li>
          <li><span>02</span><div><b>See what needs attention</b><small>Priorities, page-level evidence and recommended fixes</small></div></li>
          <li><span>03</span><div><b>Compare the competition</b><small>Technical benchmarks, observed terms and topic gaps</small></div></li>
          <li><span>04</span><div><b>Download your action plan</b><small>PDF report with source links and measurement times</small></div></li>
        </ol>
        <a class="public-audit-report-link" href="/seo-audit">Start with your website ${icon('arrow')}</a>
      </aside>
    </div>
    <div class="public-audit-details" id="audit-included">
      <div class="sec-head"><div><h3>Everything included in your public audit</h3><p class="muted">Live observations from our own crawl engine, with the scope of every measurement explained.</p></div></div>
      <div class="public-audit-features">${features.map(([symbol, title, description]) => `<article><span class="public-audit-feature-icon">${icon(symbol)}</span><h4>${esc(title)}</h4><p>${esc(description)}</p></article>`).join('')}</div>
    </div>
    <div class="public-audit-steps" aria-label="How to run your audit">
      <div><span>1</span><p><b>Enter your website</b><small>Add up to two competitor domains and choose the page sample.</small></p></div>
      <div><span>2</span><p><b>Let the live scan run</b><small>Our server crawls accessible pages and builds your comparison.</small></p></div>
      <div><span>3</span><p><b>Review, filter and download</b><small>Explore the findings online and save your report as a PDF.</small></p></div>
    </div>
    <div class="public-audit-faq"><h3>Before you start</h3><div>${questions.map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join('')}</div></div>
    <div class="public-audit-bottom"><div><b>Ready to see where your website can improve?</b><p>Start a public audit or get help implementing the findings.</p></div><div class="row gap wrap"><a class="btn primary" href="/seo-audit">Audit my website ${icon('arrow')}</a><a class="link" href="${esc(helpHref)}">Get help with fixes</a></div></div>
  </section>`;
}
