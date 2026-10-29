# Phase 2806 — Non-generic Manifest ADT Dispatch

## Correction

Phase 2805 introduced a generic `<T>` handler/consumer and used `as never` casts. That contradicted the explicit constraint against generic reasoning primitives and weakened type safety. This phase removes both.

## Concrete domain contract

`RouteManifestProjectionCompositionOutcomeHandlers` is now non-generic:

- `manifest_projected` returns `RouteManifest`.
- `manifest_projection_blocked` returns `never`, requiring the blocked path to terminate.

`RouteManifestProjectionCompositionOutcomeOperationsInterface.consume` returns `RouteManifest`, not a caller-selected `T`.

## Exhaustive elimination

The exhaustive `switch` is retained only inside the operation that owns `RouteManifestProjectionCompositionResult`. The CLI consumers (`scan.ts` and `sync.ts`) do not switch on this semantic outcome. This is ADT elimination, not re-running semantic reasoning. Exhaustiveness is enforced by assigning the default branch to `never`; there are no `as never` casts in the dispatch operation.

## Constraints preserved

- Explicit `manifest_projected | manifest_projection_blocked` ADT and payloads remain unchanged.
- No generic result/fold/reasoning abstraction is added.
- Runtime export remains interface-first and frozen.
- No duplicate upstream interface is introduced.
- `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Audit

Run `npm run audit:phase2806-nongeneric-manifest-adt-dispatch`. This is a structural audit; it does not claim a full typecheck, production build, complete test suite, or CLI end-to-end run.
