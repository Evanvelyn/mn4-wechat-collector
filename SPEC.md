# Spec: 微信文章采集器 MVP

## Objective

构建一个可直接“加载已解压扩展程序”的 Chrome/Edge Manifest V3 扩展，服务于以下流程：

1. 用户输入关键词，搜索微信公众号文章。
2. 结果按关键词相关性、可信公众号白名单和时效性排序，并可勾选后批量打开。
3. 用户在公开公众号文章页中，把正文与图片保存为完全离线的 HTML，或调用浏览器打印为可搜索 PDF。
4. 生成的文件可通过系统“打开方式”导入 MarginNote 4。

MVP 不承诺获得真实点赞、在看或阅读量；公开搜索无法稳定取得这些数据。MVP 不直接写入 MarginNote 数据库，也不绕过验证码或访问限制。

## Tech Stack

- Chrome Extension Manifest V3
- 原生 HTML、CSS、JavaScript ES modules
- Chrome `tabs`、`scripting`、`downloads` 和 `storage` API
- Node.js 内置 `node:test`，不增加运行时依赖

## Commands

- Test: `npm test`
- Validate extension files: `npm run validate`
- Package: `npm run package`
- Install: Chrome/Edge 扩展管理页 → 开发者模式 → 加载已解压的扩展程序 → 选择项目根目录

## Project Structure

```text
manifest.json            Extension manifest
src/popup/               Search, selection and export interface
src/background/          Cross-origin search requests
src/lib/                 Pure parsing, scoring and file-generation logic
tests/                   Unit tests and HTML fixtures
scripts/                 Validation and packaging scripts
docs/                    User installation and usage notes
```

## Code Style

```js
export function scoreArticle(article, query, now = new Date()) {
  const relevance = scoreRelevance(article, query);
  const authority = scoreAuthority(article.account);
  return Math.round(relevance * 70 + authority * 30);
}
```

- 两空格缩进、分号结尾、单引号字符串。
- 业务逻辑使用纯函数；Chrome API 只放在界面和后台入口。
- 用户可见文案使用简体中文。

## Testing Strategy

- 单元测试：搜索结果解析、实体解码、质量评分、文件名清理。
- 静态验证：manifest 字段、引用文件存在、JavaScript 语法检查。
- 浏览器验证：加载扩展，检查空状态、搜索错误状态、文章页导出入口、键盘焦点和控制台。
- 外部搜狗结果属于不稳定集成；测试使用固定 fixture，不把互联网可用性当作单元测试条件。

## Boundaries

- Always: 本地处理文章；清楚标注数据源限制；导出前内嵌图片；运行测试和静态验证。
- Ask first: 安装第三方依赖、增加远程后端、自动操作 MarginNote 内部数据库。
- Never: 保存微信 Cookie；绕过验证码；提交密钥；直接修改 MarginNote 数据库/MNDocs 内部结构。

## Success Criteria

- 扩展可以在 Chrome/Edge 通过“加载已解压”安装，无 manifest 错误。
- 搜索结果至少展示标题、公众号、日期、摘要、质量分和选择框。
- 大厂白名单文章在相关性相近时排名更高。
- 搜索不可用或触发验证时给出可理解的错误和“在搜狗中打开”退路。
- 在公开 `mp.weixin.qq.com/s/*` 页面可下载离线 HTML，正文图片不依赖远程 URL。
- 可调用浏览器打印对话框生成文本可搜索的 PDF。
- 自动化测试与静态验证全部通过。

## Open Questions / Deferred

- MarginNote 4 内部文件夹/学习集的精确选择留到 `.mnaddon` 桥接阶段。
- 多篇文章静默批量转 PDF 需要本地 companion service，MVP 只批量打开、逐篇打印或保存离线 HTML。
- 真实点赞量只有在公开、稳定且合规的数据源出现后再纳入评分。
