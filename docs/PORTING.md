# Porting guide

highlight-save keeps browser-specific code at the edge so the same saved data can be reused by future iOS/Android shells.

## Core logic

- Keep pure highlight rules in `src/core`.
- `src/core` must not call `chrome.*`, browser extension APIs, DOM APIs, network APIs, or platform storage directly.
- Shared data stays in the existing shape: `{ text, url, ts, tag? }` in the `highlights` array, plus `isPremium` and `trial_start_ts`.

## Storage adapters

- App code should read and write saved data through the `HighlightStorageAdapter` interface in `src/storage/types.ts`.
- The Chrome extension implementations live in `src/storage/chromeStorage.ts` and `src/storage/contentChromeStorage.ts`, both mapping the adapter to `chrome.storage.local`.
- `contentChromeStorage.ts` is kept entry-local so the MV3 content script builds as a self-contained `content.js`.
- Native ports should add their own adapter with the same interface and persist the same keys/data shape, for example:
  - `highlights`
  - `isPremium`
  - `trial_start_ts`
- Do not add remote sync or external APIs unless the product spec changes.

## UI shell

- Keep UI behavior platform-neutral where practical: core decisions such as limits, deletion, snippets, and trial day calculation should come from `src/core`.
- Chrome-only operations such as tab lookup, script injection, tab opening, and `chrome.i18n` should remain in the extension shell or be wrapped by a platform shell before reuse.
- Do not increase extension permissions while preparing code for mobile ports.
