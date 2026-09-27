const TRUSTED_ACCOUNT_PATTERNS = [
  /美团.*(技术|科技|研究)/i,
  /字节.*(技术|跳动|研究)/i,
  /腾讯.*(技术|研究|云)/i,
  /阿里.*(技术|云|研究)/i,
  /百度.*(技术|研究|智能云)/i,
  /华为.*(技术|云|开发者)/i,
  /京东.*(技术|科技|云)/i,
  /小米.*(技术|开发者)/i,
  /网易.*(技术|云)/i,
  /快手.*(技术|研究)/i,
];

export function scoreArticle(article, query, now = new Date()) {
  const terms = tokenize(query);
  const title = normalize(article.title);
  const summary = normalize(article.summary);
  const matchedTerms = terms.filter((term) => title.includes(term) || summary.includes(term));
  const titleMatches = terms.filter((term) => title.includes(term)).length;
  const summaryMatches = terms.filter((term) => summary.includes(term)).length;
  const denominator = Math.max(terms.length, 1);
  const relevance = Math.min(1, (titleMatches + summaryMatches * 0.35) / denominator);
  const trusted = isTrustedAccount(article.account);
  const freshness = scoreFreshness(article.publishedAt, now);
  const score = Math.round(relevance * 70 + (trusted ? 20 : 0) + freshness * 10);
  const reasons = [];

  if (matchedTerms.length) reasons.push(`命中 ${matchedTerms.join('、')}`);
  if (trusted) reasons.push('大厂官方来源');
  if (freshness >= 0.8) reasons.push('近期发布');

  return {
    ...article,
    score,
    matchedTerms,
    authorityLabel: trusted ? '大厂官方' : '普通来源',
    reasons,
  };
}

export function rankArticles(articles, query, now = new Date()) {
  return articles
    .map((article) => scoreArticle(article, query, now))
    .sort((left, right) => right.score - left.score);
}

function tokenize(query) {
  return [...new Set(normalize(query).split(/[\s,，、]+/).filter(Boolean))];
}

function normalize(value = '') {
  return String(value).trim().toLocaleLowerCase('zh-CN');
}

function isTrustedAccount(account = '') {
  return TRUSTED_ACCOUNT_PATTERNS.some((pattern) => pattern.test(account));
}

function scoreFreshness(publishedAt, now) {
  const published = new Date(publishedAt);
  if (Number.isNaN(published.getTime())) return 0;
  const ageInDays = Math.max(0, (now.getTime() - published.getTime()) / 86_400_000);
  if (ageInDays <= 30) return 1;
  if (ageInDays <= 180) return 0.65;
  if (ageInDays <= 365) return 0.35;
  return 0.1;
}
