# Porting guide

highlight-save keeps browser-specific code at the edge so the same saved data can be reused by future iOS/Android shells.

## Core logic

- Keep pure highlight rules in `src/core`.
- `src/core` must not call `chrome.*`, browser extension APIs, DOM APIs, network APIs, or platform storage directly.
- Keep storage key mapping and persisted-state normalization in `src/storage`, not in `src/core`.
- Shared data stays in the existing shape: `{ text, url, ts, tag? }` in the `highlights` array, plus `isPremium` and `trial_start_ts`.

## Storage adapters

- App code should read and write saved data through the `HighlightStorageAdapter` interface in `src/storage/types.ts`.
- `src/storage/adapter.ts` builds a `HighlightStorageAdapter` from a small `HighlightStorageBackend`: `read(keys)` and `write(items)`.
- `HighlightStorageBackend` is the platform edge: Chrome, iOS, Android, or test code can implement it without changing `src/core`; it only accepts the persisted keys typed by `HighlightStorageKey`.
- The popup Chrome implementation maps that backend to `chrome.storage.local` in `src/storage/chromeBackend.ts` and is exposed as `chromeHighlightStorage` from `src/storage/chromeStorage.ts`.
- `src/storage/schema.ts` owns the persisted keys and converts raw platform storage values into `HighlightStorageState` for reusable adapters.
- `src/storage/contentChromeStorage.ts` keeps the MV3 content script self-contained for Chrome loading while still implementing the same `HighlightStorageAdapter` contract and persisted key names.
- Native ports should add their own adapter with the same interface and persist the same keys/data shape, for example:
  - `highlights`
  - `isPremium`
  - `trial_start_ts`
- If a native store already exposes async key-value access, prefer reusing `createHighlightStorageAdapter` with that backend instead of duplicating conversion logic.
- Keep platform adapters under `src/storage` or the platform shell. Do not import Chrome-specific modules such as `chromeBackend.ts`, `chromeStorage.ts`, or `contentChromeStorage.ts` from shared mobile code.
- Do not add remote sync or external APIs unless the product spec changes.

### Adapter shape for native shells

Native shells should keep their platform APIs behind `HighlightStorageBackend`:

```ts
import { createHighlightStorageAdapter } from "./storage/adapter";
import type { HighlightStorageBackend } from "./storage/types";

const nativeBackend: HighlightStorageBackend = {
  async read(keys) {
    // Return an object whose properties are the requested persisted keys.
    return nativeStore.getMany(keys);
  },
  async write(items) {
    await nativeStore.setMany(items);
  },
};

export const nativeHighlightStorage = createHighlightStorageAdapter(nativeBackend);
```

The object returned by `read` must keep the same stored values used by the extension. Let `src/storage/schema.ts` apply defaults instead of adding platform-specific defaults in `src/core`.

### Native storage checklist

1. Keep saved items in the existing `{ text, url, ts, tag? }` shape.
2. Implement `HighlightStorageBackend.read(keys)` and `HighlightStorageBackend.write(items)` for the native store, or mirror `HighlightStorageAdapter` directly when the platform bundle must stay self-contained.
3. Store the same keys listed above; do not rename keys during a port unless a migration is explicitly specified.
4. Keep all platform APIs inside the storage adapter or UI shell. Do not import `chrome.*` or native storage modules from `src/core`.

### Boundary check before a native port

- Treat `src/core` as reusable application logic: it may depend on standard JavaScript APIs, but not Chrome extension, DOM, or native platform globals.
- Treat `src/storage/types.ts`, `src/storage/adapter.ts`, and `src/storage/schema.ts` as the portable storage contract.
- Treat `src/storage/chrome*.ts`, `src/content.ts`, and `src/popup.ts` as Chrome extension shell code.
- For iOS/Android, implement a native `HighlightStorageBackend` that reads/writes the same three keys, then reuse `createHighlightStorageAdapter` to keep normalization and default values identical to the extension.

## UI shell

- Keep UI behavior platform-neutral where practical: core decisions such as limits, deletion, snippets, and trial day calculation should come from `src/core`.
- Chrome-only operations such as tab lookup, script injection, tab opening, and `chrome.i18n` should remain in the extension shell or be wrapped by a platform shell before reuse.
- Do not increase extension permissions while preparing code for mobile ports.
