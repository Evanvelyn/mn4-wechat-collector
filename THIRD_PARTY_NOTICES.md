# Third-Party Notices

`mn4-wechat-collector` is an independent implementation. No source files,
vendored packages, binaries, or assets from the projects below are distributed
inside this repository.

The following open-source projects informed the product research and technical
design. They remain the property of their respective authors and are governed
by their own licenses.

## Zhijian Skills / wechat-article-search

- Repository: https://github.com/zjp1997720/zhijian-skills
- Relevant component: `wechat-article-search`
- License: MIT License
- Referenced concept: discovering public WeChat articles through Sogou WeChat
  Search and returning structured result fields.
- Usage in this repository: conceptual reference only; the parser, ranking,
  browser UI, tests, and extension integration are independently implemented.

## WeChat → Markdown / PDF (`wechat2md`)

- Repository: https://github.com/luoziyan100/wechat2md
- Author: luoziyan100
- License: MIT License
- Referenced concept: browser-extension-based article extraction, offline image
  handling, and browser print-to-PDF workflow.
- Usage in this repository: conceptual and architectural reference only. This
  repository does not contain `wechat2md` source files, Turndown, JSZip, its
  vendored libraries, or its assets.

## wxdown

- Repository: https://github.com/systemmin/wxdown
- Author: systemmin
- License: Apache License 2.0
- Referenced concept: offline preservation of public WeChat articles and their
  image resources, including HTML/PDF archival use cases.
- Usage in this repository: conceptual reference only; no `wxdown` source code,
  container image, executable, or other artifact is included.

## External services and product names

WeChat, Sogou, MarginNote, Chrome, and Edge are trademarks or product names of
their respective owners. Their names are used only to describe compatibility.
This project is not affiliated with or endorsed by those companies.

