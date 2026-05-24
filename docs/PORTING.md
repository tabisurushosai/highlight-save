# Porting guide

highlight-save keeps browser-specific code at the edge so the same saved data can be reused by future iOS/Android shells.

## Core logic

- Keep pure highlight rules in `src/core`.
- `src/core` must not call `chrome.*`, browser extension APIs, DOM APIs, network APIs, or platform storage directly.
- Keep storage key mapping and persisted-state normalization in `src/storage`, not in `src/core`.
- Shared data stays in the existing shape: `{ text, url, ts, tag? }` in the `highlights` array, plus `isPremium` and `trial_start_ts`.

## Storage adapters

- App code should read and write saved data through the `HighlightStorageAdapter` interface in `src/storage/types.ts`.
- `src/storage/adapter.ts` builds a `HighlightStorageAdapter` from a small async key-value area: `get(keys)` and `set(items)`.
- The popup Chrome implementation in `src/storage/chromeStorage.ts` maps that adapter to `chrome.storage.local`.
- `src/storage/schema.ts` owns the persisted keys and converts raw platform storage values into `HighlightStorageState` for reusable adapters.
- `src/storage/contentChromeStorage.ts` implements the same adapter contract directly against `chrome.storage.local` so the MV3 content script builds as a self-contained `content.js`.
- Native ports should add their own adapter with the same interface and persist the same keys/data shape, for example:
  - `highlights`
  - `isPremium`
  - `trial_start_ts`
- If a native store already exposes async key-value access, prefer reusing `createHighlightStorageAdapter` with that store instead of duplicating conversion logic.
- Do not add remote sync or external APIs unless the product spec changes.

## UI shell

- Keep UI behavior platform-neutral where practical: core decisions such as limits, deletion, snippets, and trial day calculation should come from `src/core`.
- Chrome-only operations such as tab lookup, script injection, tab opening, and `chrome.i18n` should remain in the extension shell or be wrapped by a platform shell before reuse.
- Do not increase extension permissions while preparing code for mobile ports.
