import test from 'node:test';
import assert from 'node:assert/strict';
import { rankArticles, scoreArticle } from '../src/lib/scoring.js';

const now = new Date('2026-09-27T00:00:00+08:00');

test('rewards a trusted company account when relevance is similar', () => {
  const trusted = scoreArticle({
    title: 'Agent 评测方法',
    summary: '介绍智能体基准测试',
    account: '美团技术团队',
    publishedAt: '2026-09-20',
  }, 'agent 评测', now);
  const unknown = scoreArticle({
    title: 'Agent 评测方法',
    summary: '介绍智能体基准测试',
    account: '随手记科技',
    publishedAt: '2026-09-20',
  }, 'agent 评测', now);

  assert.ok(trusted.score > unknown.score);
  assert.equal(trusted.authorityLabel, '大厂官方');
});

test('does not let authority outweigh a completely irrelevant title', () => {
  const ranked = rankArticles([
    {
      title: '员工食堂今日菜单',
      summary: '午餐供应时间调整',
      account: '美团技术团队',
      publishedAt: '2026-09-27',
    },
    {
      title: 'Agent 评测：工具调用可靠性基准',
      summary: '智能体测试集和评分方法',
      account: '独立研究室',
      publishedAt: '2026-08-20',
    },
  ], 'agent 评测', now);

  assert.equal(ranked[0].title, 'Agent 评测：工具调用可靠性基准');
});

test('returns matched query terms as scoring reasons', () => {
  const result = scoreArticle({
    title: 'Agent 评测实践',
    summary: '覆盖工具调用',
    account: '字节跳动技术团队',
    publishedAt: '2026-09-01',
  }, 'agent 评测', now);

  assert.deepEqual(result.matchedTerms, ['agent', '评测']);
  assert.ok(result.reasons.includes('大厂官方来源'));
});
