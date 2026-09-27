const VERIFICATION_MARKERS = ['请输入验证码', '完成验证', '访问过于频繁'];

export function parseSogouResults(html, baseUrl = 'https://weixin.sogou.com') {
  if (VERIFICATION_MARKERS.some((marker) => html.includes(marker))) {
    throw new Error('搜狗要求完成验证，请稍后重试或在搜狗微信中手动搜索。');
  }

  const blocks = html.match(/<li\b[^>]*id=["']sogou_vr_11002601_box_[^"']+["'][^>]*>[\s\S]*?<\/li>/gi) ?? [];

  return blocks
    .map((block) => parseResultBlock(block, baseUrl))
    .filter((article) => article.title && article.url);
}

function parseResultBlock(block, baseUrl) {
  const heading = matchFirst(block, /<h3\b[^>]*>[\s\S]*?<a\b([^>]*)>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/i);
  const href = heading ? getAttribute(heading[1], 'href') : '';
  const accountMarkup = matchFirst(block, /<(?:a|span)\b[^>]*class=["'][^"']*(?:account|all-time-y2)[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|span)>/i)?.[1] ?? '';
  const timestamp = matchFirst(block, /timeConvert\(['"](\d{9,13})['"]\)/i)?.[1];
  const displayedDate = cleanText(matchFirst(block, /<span\b[^>]*class=["'][^"']*s2[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? '');

  return {
    title: cleanText(heading?.[2] ?? ''),
    summary: cleanText(matchFirst(block, /<p\b[^>]*class=["'][^"']*txt-info[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? ''),
    account: cleanText(accountMarkup),
    publishedAt: timestamp ? formatUnixDate(timestamp) : displayedDate,
    url: resolveUrl(decodeEntities(href), baseUrl),
  };
}

function formatUnixDate(value) {
  const numeric = Number(value);
  const milliseconds = value.length > 10 ? numeric : numeric * 1000;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function matchFirst(value, expression) {
  return expression.exec(value);
}

function getAttribute(attributes, name) {
  const expression = new RegExp(`${name}=["']([^"']*)["']`, 'i');
  return expression.exec(attributes)?.[1] ?? '';
}

function resolveUrl(value, baseUrl) {
  if (!value) return '';
  try {
    const url = new URL(value, baseUrl);
    const allowedHosts = new Set(['weixin.sogou.com', 'mp.weixin.qq.com']);
    return url.protocol === 'https:' && allowedHosts.has(url.hostname) ? url.href : '';
  } catch {
    return '';
  }
}

function cleanText(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeEntities(value) {
  const entities = {
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
  };

  return value.replace(/&(amp|quot|#39|lt|gt|nbsp);/g, (entity) => entities[entity] ?? entity);
}
