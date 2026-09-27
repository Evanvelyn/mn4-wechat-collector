import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseSogouResults } from '../src/lib/search-parser.js';

test('parses article fields from a Sogou result page', async () => {
  const html = await readFile('tests/fixtures/sogou-results.html', 'utf8');

  const results = parseSogouResults(html, 'https://weixin.sogou.com');

  assert.equal(results.length, 2);
  assert.deepEqual(results[0], {
    title: '我们如何评测企业级 AI Agent',
    summary: '从任务完成率、工具调用和稳定性三个维度介绍 Agent 评测体系。',
    account: '美团技术团队',
    publishedAt: '2026-09-20',
    url: 'https://weixin.sogou.com/link?url=meituan123',
  });
});

test('returns an empty list when the page contains no result items', () => {
  assert.deepEqual(parseSogouResults('<html><body>暂无结果</body></html>'), []);
});

test('rejects verification pages with a useful error', () => {
  assert.throws(
    () => parseSogouResults('<html>请输入验证码，完成验证</html>'),
    /验证/,
  );
});

test('drops unsafe result URLs from untrusted search HTML', () => {
  const html = '<li id="sogou_vr_11002601_box_9"><h3><a href="javascript:alert(1)">恶意结果</a></h3></li>';

  assert.deepEqual(parseSogouResults(html), []);
});

test('parses the current Sogou account and timestamp markup', () => {
  const html = `
    <li id="sogou_vr_11002601_box_2">
      <h3><a href="/link?url=current">Agent 评测实践</a></h3>
      <p class="txt-info">评测方法</p>
      <div class="s-p">
        <span class="all-time-y2">美团技术团队</span>
        <span class="s2"><script>document.write(timeConvert('1789896202'))</script></span>
      </div>
    </li>`;

  const [result] = parseSogouResults(html);

  assert.equal(result.account, '美团技术团队');
  assert.match(result.publishedAt, /^\d{4}-\d{2}-\d{2}$/);
});
