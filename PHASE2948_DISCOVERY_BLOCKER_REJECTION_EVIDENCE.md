# Phase2948 — Preserve Filesystem Rejection Evidence in Discovery Blocker ADTs

## Scope

Continue the Phase2947 upstream CLI manifest trace by fixing a remaining evidence-loss boundary: the Node filesystem rejection was passed to `nodeFilesystemFailureObservation`, but the resulting `LaravelControllerSourceDiscoveryBlocker` retained only the classified blocker kind and path. The original rejection object was therefore not available to downstream domain operations.

## Changes

- Evolved the existing `LaravelControllerSourceDiscoveryBlockerEvidence` variants for root missing, directory missing, path-not-directory, directory unreadable, and unrecognized failure code to retain `failure: unknown`.
- Evolved the existing `LaravelControllerSourceDiscoveryBlockerFactoryInterface` methods to require the original failure evidence.
- Updated the existing interface-first blocker factory so each affected ADT owns `continueWith` and passes its evidence, including the original failure, to the appropriate domain handler.
- Updated the existing filesystem failure operation to forward the exact rejection value separately from the normalized `FilesystemFailureCode` ADT.
- Bumped the existing controller source-discovery contract from version 3 to version 4 in the upstream contract and its runtime producer.
- Updated the blocker unit tests to assert identity preservation for the original rejection value.
- Kept `packages/core/src/types/upstream/collections.ts` empty. No generic result or collection abstraction was added.

## Runtime trace

`fs.lstat` / `fs.readdir` rejection → `nodeFilesystemFailureObservation.observe(originalFailure)` → existing `FilesystemFailureCode.continueWith(...)` → existing `LaravelControllerSourceDiscoveryBlockerFactoryInterface` with the same `originalFailure` → executable `LaravelControllerSourceDiscoveryBlocker.continueWith(...)` → manifest discovery terminal.

The normalized code classifies the failure; the original unknown value remains evidence on the blocker. Neither replaces the other.

## Verification

Run `npm run audit:phase2948-discovery-blocker-rejection-evidence` for structural checks. Syntax transpilation and the focused Vitest test are reported separately in the delivery summary. Full repository typecheck, complete test suite, build, and CLI end-to-end are not claimed unless they are actually run successfully.
