# Phase 2909 — Iterable-owned directory cursor completion

## Trace

The CLI manifest path discovers controller PHP sources through `controllerSourceDiscovery` in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`. Directory entries are read from the filesystem, passed through `controllerDirectoryEntryCursorFactory`, classified with the existing upstream `LaravelControllerSourceDiscoveryEntry` ADT, and then applied to the existing upstream `LaravelControllerSourceDiscoveryResult` judgment via its domain operations (`includeSource`, `block`, and `continueWith`).

## Contract decision

The existing upstream discovery result and entry ADTs already own the domain-level decisions and were reused. No new upstream ADT was introduced for this phase. The directory cursor remains a filesystem-boundary adapter because `Dirent` is a Node.js platform type, not a core domain concept. `packages/core/src/types/upstream/collections.ts` remains empty.

## Phase change

The cursor factory no longer calls `entries[Symbol.iterator]().next()` and branches on the primitive `done` flag. It uses `for...of` to produce the first ready cursor, and natural iterable exhaustion produces the exhausted cursor. This removes the explicit `if (cursor.done)` check without replacing it with a ternary, boolean-keyed table, or helper that merely hides the same check.

This is a narrowly scoped improvement, not a claim that the whole scanner is free of control flow or primitive interpretation. Other areas still warrant separate work, especially filesystem error-code normalization and entry classification fallbacks.

## Runtime shape

The cursor factory remains interface-first and immutable: `const controllerDirectoryEntryCursorFactory: ControllerDirectoryEntryCursorFactoryInterface = Object.freeze({...})`. Cursor variants expose `continueWith`, so consumers dispatch through the ADT operation rather than inspect its `kind`.

## Reference

The TypeScript handbook documents iteration through `Symbol.iterator` and `for...of`: https://www.typescriptlang.org/docs/handbook/iterators-and-generators.html. Node.js documents directory async iteration for filesystem directories: https://nodejs.org/api/fs.html. The current implementation uses `for...of` over the already-read immutable `Dirent[]`, not `fsPromises.opendir`.
