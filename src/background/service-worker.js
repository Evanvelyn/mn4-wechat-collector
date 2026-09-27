chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === 'SEARCH_WECHAT') {
    searchWechat(message.query)
      .then((html) => sendResponse({ ok: true, html }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

async function searchWechat(query) {
  if (typeof query !== 'string' || !query.trim() || query.trim().length > 80) {
    throw new Error('搜索词长度应为 1–80 个字符。');
  }

  const url = new URL('https://weixin.sogou.com/weixin');
  url.searchParams.set('type', '2');
  url.searchParams.set('query', query.trim());
  url.searchParams.set('ie', 'utf8');

  const response = await fetch(url, {
    credentials: 'include',
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });

  if (!response.ok) {
    throw new Error(`搜索服务返回 ${response.status}`);
  }

  return response.text();
}
