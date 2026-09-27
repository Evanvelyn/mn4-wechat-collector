# Changelog

All notable changes to this project are documented in this file.

## [1.0.0] - 2026-09-27

### Added

- Search public WeChat articles by keyword through Sogou WeChat Search.
- Parse titles, summaries, account names, dates, and result links.
- Rank results by query relevance, trusted technical-account signals, and recency.
- Select and open multiple search results.
- Prepare lazy-loaded WeChat images before browser print-to-PDF.
- Export a standalone offline HTML document with embedded images.
- Handle verification pages, empty results, failed images, and unsupported pages.
- Add input, URL, HTML, image-origin, image-size, and total-size safeguards.
- Add unit tests, manifest validation, packaging, documentation, and third-party notices.

### Known limitations

- Public like, read, and recommendation counts are not available reliably and are not used.
- Sogou search may rate-limit requests or require interactive verification.
- Direct selection of an internal MarginNote folder is deferred to a future `.mnaddon` bridge.

