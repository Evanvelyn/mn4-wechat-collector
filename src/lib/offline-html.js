export function sanitizeFilename(value, fallback = '微信文章') {
  const sanitized = String(value)
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')
    .replace(/^[.\s-]+|[.\s-]+$/g, '')
    .slice(0, 120);

  return sanitized || fallback;
}

export function buildOfflineHtml(article) {
  const title = escapeHtml(article.title || '微信文章');
  const account = escapeHtml(article.account || '未知公众号');
  const publishedAt = escapeHtml(article.publishedAt || '日期未知');
  const sourceUrl = safeHttpUrl(article.sourceUrl);
  const sourceLink = sourceUrl
    ? `<a href="${escapeAttribute(sourceUrl)}">查看原文</a>`
    : '<span>原文地址不可用</span>';
  const content = removeActiveContent(article.contentHtml || '');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif; }
    body { margin: 0; color: #202522; background: #f3f4ef; }
    main { width: min(760px, calc(100% - 32px)); margin: 32px auto; padding: 40px; background: #fff; }
    h1 { margin: 0 0 12px; font-size: 30px; line-height: 1.3; }
    .metadata { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #dfe3dc; color: #66706a; font-size: 14px; }
    .metadata a { color: #166534; }
    article { font-size: 17px; line-height: 1.85; overflow-wrap: anywhere; }
    article img { display: block; max-width: 100%; height: auto; margin: 20px auto; }
    article blockquote { margin: 20px 0; padding: 4px 0 4px 18px; border-left: 3px solid #9abb9f; color: #536159; }
    .image-error { padding: 12px; border: 1px dashed #c7ccc7; color: #6b746e; background: #f7f8f5; font-size: 14px; }
    @media (max-width: 640px) { main { width: 100%; margin: 0; padding: 24px 18px; } h1 { font-size: 25px; } }
    @media print { body { background: #fff; } main { width: auto; margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${title}</h1>
      <div class="metadata">
        <span>${account}</span>
        <time>${publishedAt}</time>
        ${sourceLink}
      </div>
    </header>
    <article>${content}</article>
  </main>
</body>
</html>`;
}

function removeActiveContent(value) {
  return String(value)
    .replace(/<(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|iframe|object|embed|form)\b[^>]*\/?>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src|xlink:href|formaction)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]*)/gi, ' $1="#"');
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#96;');
}
