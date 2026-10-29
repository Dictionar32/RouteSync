# Phase2908 — Typed Directory Cursor and Manifest Runtime Trace

## Root-cause target

Phase2907 removed local dispatch for domain actions on classified entries, but the CLI traversal still asserted `entryCursor.value as Dirent` and converted the iterator `done` flag to a string key. Those operations leak iterator mechanics into the traversal consumer.

## Change

The CLI filesystem adapter now creates a specific `ControllerDirectoryEntryCursor` ADT with `exhausted` and `ready` variants. The cursor exposes `continueWith` so traversal consumes the operation rather than re-reading the iterator discriminator. The platform boundary factory is interface-first and immutable. The unsafe `Dirent` assertion and string-keyed `done` lookup were removed.

The upstream discovery-entry ADT remains the owner of domain actions (`directory`, `symbolicLink`, `phpSource`, `ignored`) and is explicitly exported through `packages/core/src/index.ts`. No generic collection ADT was added.

## Runtime trace

`controllerInvocationManifestBuilder.build` → CLI scan operation → composition authority → source discovery → filesystem adapter → directory-read settlement → typed directory cursor → upstream discovery-entry ADT → discovery result operations → PHP source document reader → semantic judgment inventory → manifest judgment → terminal manifest ADT.

## Boundary that remains explicit

The operating-system adapter must still interpret `Dirent` observations and OS error evidence. The cursor change does not claim to remove all filesystem-boundary classification. In particular, error codes are still extracted from `unknown` errors and mapped to domain blockers; that is a separate contract gap and should be addressed only after checking existing upstream failure/blocker contracts.

## Verification scope

The phase audit checks the typed cursor contract, barrel exports, no traversal ternary, no `Promise.then`/`reduce`, no exported function declarations in the traced modules, and the empty `collections.ts`. Full typecheck, build, complete tests, and CLI end-to-end remain unverified unless separately run.


Historical note for Phase 2909: Phase 2908 still used `if (cursor.done)` at the filesystem iterator boundary. Phase 2909 replaces that explicit completion branch with the iterable protocol in the cursor factory; it does not claim the entire scanner contains no structural control flow.
