import PDFDocument from 'pdfkit';
import { buildInternalIntelligence } from './seo-intelligence.mjs';

const clean = value => String(value ?? 'Unavailable').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7e\n]/g, ' ');
export function auditPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, info: { Title: 'SEO audit - ' + report.target.url, Author: 'Vintorex Digital Solutions', Subject: 'Live public website and competitor audit' } });
    const intelligence = report.intelligence || buildInternalIntelligence([report.target, ...report.competitors]);
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk)); doc.on('error', reject); doc.on('end', () => resolve(Buffer.concat(chunks)));
    function room(height = 65) { if (doc.y + height > doc.page.height - 65) doc.addPage(); }
    function heading(text, major = false) {
      room(80);
      doc.moveDown(.65).font('Helvetica-Bold').fontSize(major ? 20 : 13).fillColor('#273260').text(clean(text));
      doc.moveDown(.4);
    }
    function paragraph(text, color = '#38445c') {
      doc.font('Helvetica').fontSize(9).fillColor(color).text(clean(text), { lineGap: 3, paragraphGap: 5 });
    }
    function metric(label, value) { paragraph(label + '  ' + clean(value)); }
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#5b42d1').text('VINTOREX / PUBLIC SEO AUDIT');
    heading('Website audit & competitor report', true);
    paragraph(report.target.url);
    paragraph('Generated ' + report.finishedAt + ' | Report ' + report.id);
    paragraph('Based on live public HTTP responses and source HTML. Coverage is limited to the crawled sample. JavaScript rendering, full search-index coverage and rich-result eligibility are not established by this scan.');
    heading('Executive summary');
    const summary = report.target.summary;
    if (summary) {
      metric('Calculated audit health', summary.health + '/100');
      metric('Checks passed', summary.passed + ' of ' + summary.checks);
      metric('Findings', summary.errors + ' errors, ' + summary.warnings + ' warnings, ' + summary.notices + ' notices');
    } else paragraph(report.target.error || 'No HTML pages could be evaluated. A health score is unavailable.');
    paragraph(report.methodology);
    if (report.competitors.length) {
      heading('Competitor benchmarks');
      paragraph('Comparable source observations from the same check set and page limit. Coverage varies by website.');
      for (const site of [report.target, ...report.competitors]) {
        room(65);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#33486d').text(clean(new URL(site.url).hostname));
        if (site.summary) paragraph('Health ' + site.summary.health + '/100 | HTML pages ' + site.coverage.htmlPages + ' | Errors ' + site.summary.errors + ' | Warnings ' + site.summary.warnings + ' | Avg response ' + site.summary.averageResponseMs + ' ms');
        else paragraph('Measurements unavailable. ' + (site.error || 'Review crawl coverage.'));
      }
    }
    const priorities = [...new Map(report.target.issues.map(issue => [issue.code, issue])).values()]
      .sort((a, b) => ['Error', 'Warning', 'Notice'].indexOf(a.severity) - ['Error', 'Warning', 'Notice'].indexOf(b.severity)).slice(0, 4);
    if (priorities.length) {
      heading('Recommended first actions');
      for (const issue of priorities) { room(45); paragraph(issue.severity + ' - ' + issue.label + ': ' + issue.recommendation); }
    }
    for (const site of [report.target, ...report.competitors]) {
      doc.addPage();
      heading(site === report.target ? 'Your website' : 'Competitor website', true);
      paragraph(site.url);
      paragraph('Observed ' + site.startedAt + ' to ' + site.finishedAt);
      if (site.error) paragraph(site.error, '#ad3434');
      if (site.coverage) {
        metric('Coverage', site.coverage.crawled + '/' + site.coverage.discovered + ' discovered URLs fetched; ' + site.coverage.htmlPages + ' HTML pages evaluated; limit ' + site.coverage.limit);
        if (site.coverage.truncated || site.coverage.timedOut) paragraph('This sample ended before all discovered URLs were fetched. Findings and comparisons are incomplete for the whole domain.');
      }
      if (site.summary) {
        metric('Calculated health', site.summary.health + '/100');
        metric('Average response to headers', site.summary.averageResponseMs + ' ms from the audit server');
        metric('Average source word count', site.summary.averageWords);
        heading('Thematic checks');
        for (const group of site.groups) metric(group.name, group.passed + '/' + group.checked + ' checks passed, ' + group.findings + ' findings');
      }
      heading('Search and AI crawler access');
      for (const bot of site.crawlerAccess || []) metric(bot.name, bot.allowed ? 'Allowed at the home URL by observed robots.txt rules' : 'Blocked at the home URL by observed robots.txt rules');
      const indexed = intelligence.sites.find(entry => entry.url === site.url);
      heading('Internal content index');
      paragraph('Source Vintorex internal crawl engine. ' + indexed.uniqueTerms + ' terms indexed across the sampled pages.');
      for (const topic of indexed.topics.slice(0, 20)) paragraph(topic.term + ' | observed ' + topic.occurrences + ' times across ' + topic.pageCount + ' pages | ' + topic.pages.join(', '));
      heading('Observed incoming cross-domain links');
      paragraph(indexed.observedBacklinks.length + ' links from ' + indexed.referringDomains + ' domains within this report sample.');
      for (const link of indexed.observedBacklinks) paragraph(link.source + ' -> ' + link.destination + ' | anchor ' + (link.anchor || 'No text') + ' | rel ' + (link.rel || 'Not specified') + ' | observed ' + link.observedAt);
      if (site === report.target && intelligence.topicGaps.length) {
        heading('Competitor content opportunities');
        paragraph('Terms observed on competitor pages and absent from your sampled pages. Review business relevance before acting.');
        for (const gap of intelligence.topicGaps.slice(0, 20)) paragraph(gap.term + ' | ' + gap.occurrences + ' occurrences on ' + gap.pageCount + ' pages | ' + gap.competitorDomains.join(', ') + ' | ' + gap.pages.join(', '));
      }
      paragraph(intelligence.scope);
      heading('Prioritized findings');
      const ordered = [...site.issues].sort((a, b) => ['Error', 'Warning', 'Notice'].indexOf(a.severity) - ['Error', 'Warning', 'Notice'].indexOf(b.severity));
      if (!ordered.length) paragraph('No findings returned. Review crawl coverage before interpreting this result.');
      for (const finding of ordered) {
        room(85);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(finding.severity === 'Error' ? '#b13645' : '#33486d').text(clean(finding.severity + ' / ' + finding.group + ' / ' + finding.label));
        paragraph(finding.url); paragraph('Observed: ' + finding.evidence); paragraph('Action: ' + finding.recommendation);
        doc.moveDown(.4);
      }
      heading('Crawled URL inventory');
      for (const page of site.pages) {
        room(80);
        paragraph(page.url);
        paragraph('HTTP ' + clean(page.status) + ' | response ' + clean(page.responseMs) + ' ms | words ' + clean(page.wordCount) + ' | title ' + (page.title || 'Missing'));
        paragraph('Canonical ' + clean(page.canonical) + ' | incoming sample links ' + page.sources.length);
      }
    }
    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index++) {
      doc.switchToPage(index);
      doc.font('Helvetica').fontSize(8).fillColor('#778399').text('Vintorex - live public audit | Page ' + (index + 1) + ' of ' + range.count, 48, doc.page.height - 40, { lineBreak: false });
    }
    doc.end();
  });
}
