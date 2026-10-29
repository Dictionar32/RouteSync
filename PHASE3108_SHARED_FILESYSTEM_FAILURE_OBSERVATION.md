# Phase 3108 — Shared Filesystem Failure Observation and Upstream Settlement

## Objective

Keep Node-specific rejection inspection at one platform boundary, then move the complete domain transition from normalized filesystem failure evidence to a blocked Laravel controller discovery judgment into the upstream discovery ADT.

## Runtime changes

- `nodeFilesystemFailureObservation` is the shared typed observation used by the PHP source reader and CLI discovery composition. It preserves the normalized failure code, name, and message.
- `LaravelControllerSourceDiscoveryJudgmentFactoryInterface.blockedByFilesystemFailure` now owns construction of the discovery blocker and the blocked discovery judgment.
- CLI discovery passes the typed failure code, root, directory, partial source inventory, location, and original rejection to that upstream operation. The CLI no longer assembles the blocked discovery judgment itself.
- The original rejection and partial inventory remain attached to the resulting judgment. Root-vs-directory missing-path semantics remain owned by `FilesystemFailureLocation`.

## Runtime trace

`CLI scan/sync → controller discovery → Node filesystem observation → FilesystemFailureCode ADT → LaravelControllerSourceDiscoveryJudgmentFactory.blockedByFilesystemFailure → blocked discovery judgment → source-read / semantic pipeline → manifest construction → terminal manifest → generator`.

The PHP source reader consumes the same observation and delegates source-read blocker creation to `FilesystemFailureCode.createSourceReadBlocker`.

## Verification

- Structural audit: `npm run audit:phase3108-shared-filesystem-failure-observation`.
- The audit checks the shared observation, core barrel export, upstream-owned settlement operation, CLI delegation, regression coverage, and absence of references to deleted relation-foundation modules.
- Full repository typecheck, full test suite, and PHP-to-CLI-to-manifest-to-generator E2E remain unverified in this environment.

## Explicit migration frontier

This phase does not claim that all `export function`, exported arrow functions, primitive types, ternaries, comparisons, `if`, `switch`, `for`, `map`, or `reduce` have been removed. The repository-wide migration remains incremental and must preserve PHP/Laravel semantics, source identity, provenance, partial inventory, and blocker evidence.
