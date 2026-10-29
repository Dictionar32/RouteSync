# Phase2947 — Fully Explicit Filesystem Rejection Evidence

## Root-cause finding

The Phase2946 filesystem boundary still converted a non-`Error` rejection into `new Error()`. That discarded the original rejection evidence before filesystem classification. Project-root canonicalization also formed a blocked judgment without retaining the rejected value.

## Change

- `ControllerSourceProjectIdentityCanonicalizationBlockedJudgment` now retains `failure: unknown`.
- The `fs.realpath(...).then` rejection continuation captures and retains the original failure value.
- `NodeFilesystemFailureObservationInterface.observe` accepts `unknown`.
- The adapter reads a possible `code` property only after a structural object/null guard.
- `lstat` and `readdir` pass their original rejection values to the observer; no synthetic `Error` is created.
- Existing domain `FilesystemFailureCode` remains responsible for mapping platform failure codes. The original value is not coerced into a string.

## Runtime trace

`CLI manifest composition` → `controllerSourceProjectIdentityCanonicalization.canonicalize` → `fs.realpath` → `canonicalized judgment | blocked judgment(failure)` → `source discovery` → `fs.lstat` / `fs.readdir` → `nodeFilesystemFailureObservation.observe(unknown)` → existing `FilesystemFailureCode` ADT → `LaravelControllerSourceDiscoveryBlocker` → manifest terminal continuation.

## Scope and limits

This phase closes the specific rejection-evidence loss at the canonicalization and directory-discovery boundary. It does not claim a repository-wide `export function` migration or complete elimination of consumer-side decisions. Full TypeScript typecheck, unit tests, build, and CLI end-to-end remain unverified until project dependencies and compatible compiler configuration are available.

`packages/core/src/types/upstream/collections.ts` remains empty.
