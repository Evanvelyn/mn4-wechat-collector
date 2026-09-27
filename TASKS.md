# Tasks

- [x] 建立扩展骨架和静态验证
  - Acceptance: manifest 和所有入口文件存在，`npm run validate` 通过。
  - Verify: `npm run validate`
  - Files: `manifest.json`, `package.json`, `scripts/validate.mjs`, `.gitignore`

- [x] 实现搜索解析与质量评分
  - Acceptance: 固定搜狗 HTML fixture 可解析；大厂来源和相关标题获得更高分。
  - Verify: `npm test`
  - Files: `src/lib/search-parser.js`, `src/lib/scoring.js`, `tests/*`

- [x] 实现搜索、勾选和批量打开界面
  - Acceptance: 支持加载、结果、空、错误四种状态；选择结果后可批量打开。
  - Verify: unit tests + browser runtime check
  - Files: `src/popup/*`, `src/background/*`, `manifest.json`

- [x] 实现当前公众号文章离线 HTML 与打印 PDF
  - Acceptance: 图片转为 data URL；元数据与原文链接保留；可调用打印。
  - Verify: unit tests + browser runtime check with local fixture
  - Files: `src/lib/offline-html.js`, `src/popup/*`, `tests/*`

- [x] 编写安装说明并打包
  - Acceptance: 用户可按说明安装；生成可分享 ZIP。
  - Verify: `npm test && npm run validate && npm run package`
  - Files: `README.md`, `docs/*`, `scripts/package.mjs`
