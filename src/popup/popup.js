import { parseSogouResults } from '../lib/search-parser.js';
import { rankArticles } from '../lib/scoring.js';
import { buildOfflineHtml, sanitizeFilename } from '../lib/offline-html.js';
import { buildDownloadTarget, normalizeDownloadPreference } from '../lib/download-preferences.js';

const elements = {
  form: document.querySelector('#search-form'),
  query: document.querySelector('#query'),
  status: document.querySelector('#status'),
  manualSearch: document.querySelector('#manual-search'),
  manualSearchLink: document.querySelector('#manual-search-link'),
  resultsSection: document.querySelector('#results-section'),
  results: document.querySelector('#results'),
  openSelected: document.querySelector('#open-selected'),
  articlePageHint: document.querySelector('#article-page-hint'),
  downloadSettings: document.querySelector('#download-settings'),
  downloadMode: document.querySelector('#download-mode'),
  downloadFolderRow: document.querySelector('#download-folder-row'),
  downloadFolder: document.querySelector('#download-folder'),
  saveHtml: document.querySelector('#save-html'),
  saveHtmlAs: document.querySelector('#save-html-as'),
  printPdf: document.querySelector('#print-pdf'),
};

let currentResults = [];
let downloadPreference = normalizeDownloadPreference();
const MAX_IMAGE_COUNT = 200;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 150 * 1024 * 1024;

void restoreLastQuery();
void restoreDownloadPreference();
void updateArticleControls();

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = new FormData(elements.form).get('query').trim();
  if (!query) return;

  await chrome.storage.local.set({ lastQuery: query });
  setStatus(`正在搜索“${query}”…`, 'loading');
  elements.manualSearch.hidden = true;
  elements.resultsSection.hidden = true;

  try {
    const response = await chrome.runtime.sendMessage({ type: 'SEARCH_WECHAT', query });
    if (!response?.ok) throw new Error(response?.error || '搜索服务暂时不可用');

    currentResults = rankArticles(parseSogouResults(response.html), query);
    renderResults(currentResults);
    if (currentResults.length === 0) {
      setStatus(`没有找到“${query}”的结果，可以换个关键词或手动搜索。`);
      showManualSearch(query);
      return;
    }

    setStatus(`找到 ${currentResults.length} 篇文章，已按相关性和来源质量排序。`);
    elements.resultsSection.hidden = false;
  } catch (error) {
    setStatus(error.message, 'error');
    showManualSearch(query);
  }
});

elements.results.addEventListener('change', updateSelectedButton);

elements.openSelected.addEventListener('click', async () => {
  const selectedIndexes = [...elements.results.querySelectorAll('input:checked')]
    .map((input) => Number(input.value));

  for (const index of selectedIndexes) {
    await chrome.tabs.create({ url: currentResults[index].url, active: false });
  }

  setStatus(`已在后台打开 ${selectedIndexes.length} 篇文章。`);
});

elements.downloadMode.addEventListener('change', updateDownloadFolderVisibility);
elements.downloadSettings.addEventListener('submit', saveDownloadPreference);
elements.saveHtml.addEventListener('click', () => saveCurrentArticle());
elements.saveHtmlAs.addEventListener('click', () => saveCurrentArticle({ forcePrompt: true }));
elements.printPdf.addEventListener('click', printCurrentArticle);

function renderResults(results) {
  elements.results.replaceChildren(...results.map((article, index) => {
    const item = document.createElement('li');
    item.className = 'result-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = String(index);
    checkbox.setAttribute('aria-label', `选择：${article.title}`);

    const content = document.createElement('div');
    const title = document.createElement('a');
    title.className = 'result-title';
    title.href = article.url;
    title.target = '_blank';
    title.rel = 'noreferrer';
    title.textContent = article.title;

    const summary = document.createElement('p');
    summary.className = 'result-summary';
    summary.textContent = article.summary || '暂无摘要';

    const meta = document.createElement('div');
    meta.className = 'result-meta';
    meta.append(
      textSpan(article.account || '未知公众号'),
      textSpan(article.publishedAt || '日期未知'),
      badge(`质量分 ${article.score}`),
    );

    const reasons = document.createElement('div');
    reasons.className = 'result-reasons';
    reasons.textContent = article.reasons.join(' · ') || '按搜索匹配度排序';

    content.append(title, summary, meta, reasons);
    item.append(checkbox, content);
    return item;
  }));
  updateSelectedButton();
}

function updateSelectedButton() {
  const count = elements.results.querySelectorAll('input:checked').length;
  elements.openSelected.disabled = count === 0;
  elements.openSelected.textContent = count ? `打开已选（${count}）` : '打开已选';
}

function setStatus(message, tone = 'neutral') {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function showManualSearch(query) {
  const url = new URL('https://weixin.sogou.com/weixin');
  url.searchParams.set('type', '2');
  url.searchParams.set('query', query);
  elements.manualSearchLink.href = url.href;
  elements.manualSearchLink.target = '_blank';
  elements.manualSearch.hidden = false;
}

function textSpan(value) {
  const span = document.createElement('span');
  span.textContent = value;
  return span;
}

function badge(value) {
  const span = textSpan(value);
  span.className = 'quality-badge';
  return span;
}

async function restoreLastQuery() {
  const { lastQuery = '' } = await chrome.storage.local.get('lastQuery');
  elements.query.value = lastQuery;
}

async function restoreDownloadPreference() {
  const stored = await chrome.storage.local.get('downloadPreference');
  downloadPreference = normalizeDownloadPreference(stored.downloadPreference);
  elements.downloadMode.value = downloadPreference.mode;
  elements.downloadFolder.value = downloadPreference.folder;
  updateDownloadFolderVisibility();
}

async function saveDownloadPreference(event) {
  event.preventDefault();
  const requested = {
    mode: elements.downloadMode.value,
    folder: elements.downloadFolder.value,
  };
  const normalized = normalizeDownloadPreference(requested);

  if (requested.mode === 'subfolder' && normalized.mode !== 'subfolder') {
    setStatus('请输入下载目录内的相对子文件夹，例如 MarginNote/微信文章。', 'error');
    elements.downloadFolder.focus();
    return;
  }

  downloadPreference = normalized;
  elements.downloadFolder.value = normalized.folder;
  await chrome.storage.local.set({ downloadPreference });
  setStatus(downloadPreferenceDescription(normalized));
}

function updateDownloadFolderVisibility() {
  const usesSubfolder = elements.downloadMode.value === 'subfolder';
  elements.downloadFolderRow.hidden = !usesSubfolder;
  elements.downloadFolder.disabled = !usesSubfolder;
}

function downloadPreferenceDescription(preference) {
  if (preference.mode === 'browser') return '保存设置已更新：离线 HTML 将使用浏览器默认下载位置。';
  if (preference.mode === 'subfolder') return `保存设置已更新：离线 HTML 将保存到“下载/${preference.folder}”。`;
  return '保存设置已更新：每次保存离线 HTML 时手动选择位置。';
}

async function updateArticleControls() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isArticle = /^https:\/\/mp\.weixin\.qq\.com\/s(?:\/|\?)/.test(tab?.url || '');
  elements.saveHtml.disabled = !isArticle;
  elements.saveHtmlAs.disabled = !isArticle;
  elements.printPdf.disabled = !isArticle;
  elements.articlePageHint.textContent = isArticle
    ? '已识别当前公众号文章。离线 HTML 会把正文图片全部内嵌。'
    : '请先打开一篇 mp.weixin.qq.com 公众号文章。';
}

async function saveCurrentArticle(options = {}) {
  setExportBusy(true, '正在读取正文并保存图片…');

  try {
    const tab = await getCurrentArticleTab();
    const [{ result: capture }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: captureWechatArticle,
    });

    if (!capture?.contentHtml) throw new Error('没有识别到公众号正文。');
    const processed = await inlineCapturedImages(capture);
    const html = buildOfflineHtml(processed.article);
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const filename = `${sanitizeFilename(processed.article.title)}.html`;
    const target = buildDownloadTarget(filename, downloadPreference, options);

    await chrome.downloads.download({ url: blobUrl, ...target });
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);

    const suffix = processed.failedImages
      ? `；${processed.failedImages} 张图片下载失败，已在正文中标注`
      : '，图片已全部内嵌';
    setStatus(`已生成 ${target.filename}${suffix}。`);
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    setExportBusy(false);
  }
}

async function printCurrentArticle() {
  setExportBusy(true, '正在加载全文图片，随后将打开打印对话框…');

  try {
    const tab = await getCurrentArticleTab();
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: prepareWechatArticleForPrint,
    });
    setStatus(`已准备 ${result?.imageCount ?? 0} 张图片，请在打印对话框选择“另存为 PDF”。`);
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    setExportBusy(false);
  }
}

async function getCurrentArticleTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https:\/\/mp\.weixin\.qq\.com\/s(?:\/|\?)/.test(tab.url || '')) {
    throw new Error('当前页面不是可识别的公众号文章。');
  }
  return tab;
}

async function inlineCapturedImages(capture) {
  const document = new DOMParser().parseFromString(`<main>${capture.contentHtml}</main>`, 'text/html');
  sanitizeCapturedDocument(document);
  let failedImages = 0;
  let totalImageBytes = 0;

  for (const image of capture.images.slice(0, MAX_IMAGE_COUNT)) {
    const element = document.querySelector(`[data-mn4-image="${image.index}"]`);
    if (!element) continue;

    try {
      const downloaded = await fetchImageAsDataUrl(image.url);
      if (totalImageBytes + downloaded.bytes > MAX_TOTAL_IMAGE_BYTES) {
        throw new Error('文章图片总大小超过 150 MB');
      }
      totalImageBytes += downloaded.bytes;
      element.src = downloaded.dataUrl;
      element.removeAttribute('data-mn4-image');
    } catch {
      const fallback = document.createElement('p');
      fallback.className = 'image-error';
      fallback.textContent = `图片保存失败${image.alt ? `：${image.alt}` : ''}`;
      element.replaceWith(fallback);
      failedImages += 1;
    }
  }

  for (const image of capture.images.slice(MAX_IMAGE_COUNT)) {
    const element = document.querySelector(`[data-mn4-image="${image.index}"]`);
    if (!element) continue;
    const fallback = document.createElement('p');
    fallback.className = 'image-error';
    fallback.textContent = '图片数量超过单篇 200 张的安全上限，未保存此图。';
    element.replaceWith(fallback);
    failedImages += 1;
  }

  return {
    failedImages,
    article: {
      ...capture,
      contentHtml: document.querySelector('main').innerHTML,
    },
  };
}

async function fetchImageAsDataUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !['mmbiz.qpic.cn', 'mmbiz.qlogo.cn'].includes(parsed.hostname)) {
    throw new Error('不受信任的图片来源');
  }
  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) throw new Error(`图片请求失败：${response.status}`);
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('返回内容不是图片');
  if (blob.size > MAX_IMAGE_BYTES) throw new Error('单张图片超过 20 MB');
  return { dataUrl: await blobToDataUrl(blob), bytes: blob.size };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function setExportBusy(isBusy, message = '') {
  elements.saveHtml.disabled = isBusy;
  elements.saveHtmlAs.disabled = isBusy;
  elements.printPdf.disabled = isBusy;
  if (message) setStatus(message, 'loading');
  if (!isBusy) void updateArticleControls();
}

function sanitizeCapturedDocument(document) {
  document.querySelectorAll('script, iframe, object, embed, form, button, input, textarea, select').forEach((element) => element.remove());

  for (const element of document.querySelectorAll('*')) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on')) element.removeAttribute(attribute.name);
      if (['href', 'src', 'xlink:href', 'formaction'].includes(name) && value.startsWith('javascript:')) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}

function captureWechatArticle() {
  const root = document.querySelector('#js_content') || document.querySelector('article');
  if (!root) throw new Error('没有找到公众号文章正文。');

  const clone = root.cloneNode(true);
  const originalImages = [...root.querySelectorAll('img')];
  const clonedImages = [...clone.querySelectorAll('img')];
  const images = [];

  clonedImages.forEach((image, index) => {
    const original = originalImages[index];
    const rawUrl = original?.dataset.src || original?.dataset.original || original?.currentSrc || original?.src || '';
    let url = '';
    try {
      url = rawUrl ? new URL(rawUrl, location.href).href : '';
    } catch {
      url = '';
    }
    image.removeAttribute('srcset');
    image.removeAttribute('data-src');
    image.removeAttribute('data-original');
    if (url) {
      image.setAttribute('data-mn4-image', String(index));
      image.removeAttribute('src');
      images.push({ index, url, alt: image.alt || '' });
    } else {
      image.remove();
    }
  });

  clone.querySelectorAll('script, iframe, object, embed, form, button').forEach((element) => element.remove());

  return {
    title: document.querySelector('#activity-name')?.textContent?.trim() || document.title,
    account: document.querySelector('#js_name')?.textContent?.trim() || document.querySelector('.profile_nickname')?.textContent?.trim() || '未知公众号',
    publishedAt: document.querySelector('#publish_time')?.textContent?.trim() || document.querySelector('meta[property="article:published_time"]')?.content || '',
    sourceUrl: location.href,
    contentHtml: clone.innerHTML,
    images,
  };
}

async function prepareWechatArticleForPrint() {
  const root = document.querySelector('#js_content') || document.querySelector('article');
  if (!root) throw new Error('没有找到公众号文章正文。');

  const images = [...root.querySelectorAll('img')];
  await Promise.all(images.map(async (image) => {
    const lazySource = image.dataset.src || image.dataset.original;
    if (lazySource) image.src = lazySource;
    image.loading = 'eager';
    image.style.visibility = 'visible';
    try {
      await Promise.race([
        image.decode(),
        new Promise((resolve) => setTimeout(resolve, 5_000)),
      ]);
    } catch {
      // The print still proceeds; the browser may have already decoded the image.
    }
  }));

  const style = document.createElement('style');
  style.dataset.mn4Print = 'true';
  style.textContent = '@media print { #js_content img { max-width: 100% !important; height: auto !important; visibility: visible !important; } .rich_media_area_extra, #js_pc_qr_code, .qr_code_pc, .reward_area, .rich_media_tool { display: none !important; } }';
  document.head.append(style);
  window.print();
  return { imageCount: images.length };
}
