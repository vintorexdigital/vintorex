// Local content and link analysis. Every entry retains evidence from the crawled sample.
const stopWords = new Set('a an and are as at be been being but by can could did do does for from had has have how i if in into is it its may more most no not of on one or our out over page pages same should site so some than that the their them then there these they this those through to too under up us use used using very was we were what when where which who why will with would you your'.split(' '));
const domain = url => new URL(url).hostname.replace(/^www\./, '').toLowerCase();

export function extractContentTerms(source, limit = 80) {
  const words = String(source || '').normalize('NFKC').toLocaleLowerCase('en').match(/[\p{L}\p{M}][\p{L}\p{M}\p{N}'’-]{2,39}/gu) || [];
  const counts = new Map();
  for (const word of words) {
    if (stopWords.has(word)) continue;
    if (counts.has(word) || counts.size < 10000) counts.set(word, (counts.get(word) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([term, count]) => ({ term, count }));
}

export function buildInternalIntelligence(sites) {
  const documents = sites.flatMap(site => site.pages.filter(page => page.wordCount !== null).map(page => ({ site, page })));
  const topicsBySite = sites.map(site => {
    const topics = new Map();
    for (const page of site.pages.filter(page => page.wordCount !== null)) {
      const terms = page.contentTerms || extractContentTerms([page.title, page.description, ...(page.h1 || [])].join(' '));
      const titles = new Set(extractContentTerms(page.title, 200).map(item => item.term));
      const headings = new Set(extractContentTerms((page.h1 || []).join(' '), 200).map(item => item.term));
      for (const { term, count } of terms) {
        if (!topics.has(term)) topics.set(term, { term, occurrences: 0, pageCount: 0, titlePages: 0, headingPages: 0, pages: [] });
        const topic = topics.get(term);
        topic.occurrences += count; topic.pageCount++;
        if (titles.has(term)) topic.titlePages++;
        if (headings.has(term)) topic.headingPages++;
        if (topic.pages.length < 3) topic.pages.push(page.url);
      }
    }
    return [...topics.values()].sort((a, b) => b.titlePages - a.titlePages || b.headingPages - a.headingPages || b.pageCount - a.pageCount || b.occurrences - a.occurrences);
  });
  const links = new Map();
  for (const { page, site } of documents) {
    for (const link of page.outboundLinks || []) {
      if (domain(link.url) === domain(page.url)) continue;
      const key = page.url + '\n' + link.url;
      if (!links.has(key)) links.set(key, { source: page.url, destination: link.url, anchor: link.anchor, rel: link.rel, observedAt: site.finishedAt });
    }
  }
  const summaries = sites.map((site, index) => {
    const referring = [...links.values()].filter(link => domain(link.destination) === domain(site.url));
    return {
      url: site.url, topics: topicsBySite[index].slice(0, 40), uniqueTerms: topicsBySite[index].length,
      bodyIndexedPages: site.pages.filter(page => Array.isArray(page.contentTerms)).length,
      observedBacklinks: referring, referringDomains: new Set(referring.map(link => domain(link.source))).size,
      outboundLinksIndexed: [...links.values()].filter(link => domain(link.source) === domain(site.url)).length,
    };
  });
  const targetTerms = new Set(topicsBySite[0]?.map(topic => topic.term) || []);
  const gaps = new Map();
  for (let index = 1; index < sites.length; index++) {
    for (const topic of topicsBySite[index]) {
      if (targetTerms.has(topic.term)) continue;
      if (!gaps.has(topic.term)) gaps.set(topic.term, { term: topic.term, competitorDomains: [], occurrences: 0, pageCount: 0, pages: [] });
      const gap = gaps.get(topic.term);
      gap.competitorDomains.push(domain(sites[index].url));
      gap.occurrences += topic.occurrences; gap.pageCount += topic.pageCount;
      gap.pages.push(...topic.pages.slice(0, 2));
    }
  }
  const opportunities = [...gaps.values()].sort((a, b) => b.competitorDomains.length - a.competitorDomains.length || b.pageCount - a.pageCount || b.occurrences - a.occurrences).slice(0, 30);
  return {
    source: 'Vintorex internal crawl engine', version: 1, documents: documents.length, domains: sites.length,
    externalLinksIndexed: links.size, sites: summaries, topicGaps: opportunities,
    scope: 'Content terms and link observations come from the pages in this report. Each page contributes up to 80 text terms from titles, descriptions and main content and 300 external links. Older reports use title, description and heading terms until rescanned. Topic gaps are review suggestions based on this sample. Observed backlinks include only links found on other crawled domains in this report. Traffic, search volumes and search-result positions require separate direct measurements.',
  };
}
