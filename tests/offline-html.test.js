import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOfflineHtml, sanitizeFilename } from '../src/lib/offline-html.js';

test('sanitizes article titles for safe filenames', () => {
  assert.equal(
    sanitizeFilename(' Agent/评测：方法? * 2026 '),
    'Agent-评测-方法-2026',
  );
});

test('builds a standalone document with metadata and embedded images', () => {
  const html = buildOfflineHtml({
    title: 'Agent 评测实践',
    account: '美团技术团队',
    publishedAt: '2026-09-20',
    sourceUrl: 'https://mp.weixin.qq.com/s/example',
    contentHtml: '<p>正文</p><img src="data:image/png;base64,AAAA" alt="架构图">',
  });

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /美团技术团队/);
  assert.match(html, /https:\/\/mp\.weixin\.qq\.com\/s\/example/);
  assert.match(html, /data:image\/png;base64,AAAA/);
});

test('removes active content from captured article HTML', () => {
  const html = buildOfflineHtml({
    title: '<测试>',
    account: '来源',
    publishedAt: '',
    sourceUrl: 'javascript:alert(1)',
    contentHtml: '<script>alert(1)</script><p onclick="bad()" onmouseover=bad()>安全正文</p><iframe src="https://bad.test"></iframe>',
  });

  assert.doesNotMatch(html, /<script|<iframe|on(?:click|mouseover)=|javascript:/i);
  assert.match(html, /&lt;测试&gt;/);
  assert.match(html, /安全正文/);
});
