# ADR-0001: Use a local-first browser extension and PDF handoff

## Status

Accepted

## Date

2026-09-27

## Context

The project needs to discover public WeChat articles, let the user choose among
results, preserve lazily loaded images, and move the final reading document into
MarginNote 4. Direct URL import can omit images. Writing into MarginNote's
internal database or document store would be fragile and could damage sync.

## Decision

Use a Chrome/Edge Manifest V3 extension with no remote application backend.
The extension searches through the public Sogou WeChat page, runs extraction in
the active public article tab, prepares images, and hands off a browser-generated
PDF to MarginNote 4 through the normal operating-system import path.

Offline HTML remains an archival format, not the primary MarginNote import format.

## Alternatives considered

### Pure MarginNote addon

- Advantage: could eventually select internal notebooks or folders.
- Rejected for v1: search, browser login state, rendering, and print behavior are
  easier to verify in the browser; document import APIs are less stable and less
  fully documented.

### Hosted web service

- Advantage: centralized indexing and ranking.
- Rejected for v1: adds hosting, privacy, account, copyright, and operational
  concerns. A local extension is sufficient for the first usable workflow.

### Direct MarginNote database or MNDocs writes

- Advantage: could appear to provide one-click import.
- Rejected: risks database corruption, sync conflicts, and version coupling.

## Consequences

- The user explicitly chooses the articles and PDF save location.
- Article content stays in the browser and local files.
- Sogou availability and indexing affect discovery.
- Direct MarginNote folder selection remains future work for a documented addon bridge.

