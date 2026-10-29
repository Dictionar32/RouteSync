# Phase 2853 — Terminal Failure Without Sentinels

## Root cause
The generic `continueForDriftAudit<Result>` allowed every handler—including blocked/rejected terminal handlers—to return the same `Result`. CLI consumers used `undefined` as a failure sentinel, then branched on `completeManifest === undefined`. That left the success path optional and made the consumer responsible for deciding whether a terminal result was usable.

## Contract correction
`ControllerInvocationManifestDriftAuditHandlersInterface<Result>` now permits `Result` only for `complete`; every blocked/rejected handler returns `never`. This expresses the domain invariant in the upstream contract: a failed terminal must terminate or throw and cannot fabricate a value to continue the successful pipeline.

## Runtime application
- `scan.ts` and `sync.ts` now use `process.exit(1)` in all failed terminal handlers. Their continuation result is a manifest, not `RouteManifest | undefined`; the optional-value guard is removed.
- `driftAuditor.ts` consumes the continuation return directly rather than assigning to an optional variable and checking it afterward.
- Producer-side terminal binding remains the same and keeps each ADT arm routed to its matching handler.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification
- Phase 2853 structural audit: 14/14.
- Phase 2852 terminal-dispatch audit: 14/14.
- Phase 2851 generation-terminal audit: 11/11.
- Phase 2850 persistence-terminal audit: 11/11.
- Phase 2849 serialization-continuation audit: 11/11.
- TypeScript transpile syntax checks: 4/4.

These are structural and syntax checks only; full typecheck/build, complete test suite, and CLI end-to-end execution have not been verified.
