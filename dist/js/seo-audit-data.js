// Shared report transformations used by the workspace and its CSV exports.
export const severityOrder = ['Error', 'Warning', 'Notice'];
export function reportInput(report) {
  return report.input || { url: report.target.url, competitors: report.competitors.map(site => site.url), maxPages: report.target.coverage?.limit || 25 };
}
export const issueKey = issue => JSON.stringify([issue.url, issue.code, issue.evidence]);
export function filterIssues(site, { severity = '', group = '', query = '', review = '' } = {}, reviewed = new Set()) {
  const search = query.trim().toLowerCase();
  return site.issues.filter(issue =>
    (!severity || issue.severity === severity) && (!group || issue.group === group) &&
    (!search || [issue.url, issue.label, issue.evidence, issue.recommendation].join(' ').toLowerCase().includes(search)) &&
    (!review || (review === 'reviewed') === reviewed.has(issueKey(issue)))
  ).sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));
}
export function filterPages(site, { query = '', status = '' } = {}) {
  const search = query.trim().toLowerCase();
  return site.pages.filter(page => (!search || [page.url, page.title, page.canonical, ...(page.h1 || [])].join(' ').toLowerCase().includes(search)) &&
    (!status || (status === 'indexable' ? page.indexable === true : status === 'blocked' ? page.indexable === false : status === 'failed' ? !page.status || page.status >= 400 : page.status >= 200 && page.status < 300)));
}
export function csvDocument(headers, rows) {
  const cell = value => {
    let text = String(value ?? '');
    if (typeof value !== 'number' && /^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
}
export function groupPriorities(site) {
  const groups = new Map();
  for (const issue of site.issues) {
    if (!groups.has(issue.code)) groups.set(issue.code, { ...issue, count: 0 });
    groups.get(issue.code).count++;
  }
  return [...groups.values()].sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity) || b.count - a.count);
}
