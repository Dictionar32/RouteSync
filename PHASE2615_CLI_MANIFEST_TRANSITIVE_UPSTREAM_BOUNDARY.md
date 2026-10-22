# RouteSync Phase 2615 — CLI/Manifest Transitive Upstream Boundary

## Scope

Trace the executable CLI entrypoints, `scan`, `sync`, the manifest composition authority, and the upstream composition factory into `packages/core/src/types/upstream`. The goal is to distinguish local wiring correctness from transitive dependency closure, and to make semantic inventory coverage exhaustive over the current ADT.

## Implementation change

`packages/core/src/types/upstream/invocationSemanticCoverageInventory.ts` previously returned an empty list from the `default` branch for every unrecognized `SemanticFact`. That made a future fact variant disappear silently from coverage inspection. The implementation now enumerates every currently defined non-invocation `SemanticFact` variant explicitly and ends with `const exhaustive: never = fact`. Ordinary invocations remain current-domain subjects; static invocations remain explicitly marked uncovered. This changes no current classification but makes ADT evolution compile-time visible.

## Confirmed current wiring

- CLI composition injects the existing `phpSourceDocumentIdentityBinding` operation.
- Manifest workflow and implementation ordering are checked by Phase 2614.
- Static invocation coverage is explicitly not represented as complete.
- The Phase 2592 audit correctly records that production semantic reasoning and a complete independent 34-law verifier are still missing.

## Newly confirmed architectural blocker

The previous Phase 2613/2614 checks inspected only a selected list of source files for `semantic/foundation` and `semantic/relation`. That was insufficient to establish transitive closure because CLI imports `@routesync/core`, which resolves to `packages/core/src/index.ts`. The index re-exports a broad public surface. A static traversal of relative imports/exports from the CLI entrypoints reaches 1,233 source files and 9 modules under `packages/core/src/semantic/relations`; it reaches no `semantic/foundation` modules in this traversal.

Example trace:

`packages/cli/src/index.ts -> packages/core/src/index.ts -> packages/core/src/types/upstream/astSemanticStageInterfaceAlgebra.ts -> packages/core/src/semantic/relations/semanticRelations.ts`

This is a static source-graph finding, not a claim about exact emitted bundle contents after tree-shaking. It does prove that the earlier local-only audit must not be described as proof of transitive relation independence.

## Required next evolution

1. Introduce a focused public core entrypoint for CLI-owned contracts/operations rather than importing the omnibus `@routesync/core` barrel everywhere.
2. Trace the direct transitive graph of each selected export before changing import paths; avoid blind deep imports and duplicated contracts.
3. Migrate each remaining upstream-owned relation helper to a proper upstream owner in small dependency-closed slices. Do not move semantic reasoning into CLI/runtime and do not introduce `semantic/foundation`.
4. Implement and wire the source-bound production reasoning producer and independent complete 34-law verifier through existing upstream contracts.
5. Run typecheck, tests, package build, and a real Laravel CLI fixture when dependencies are available.

## Validation boundary

The Phase 2615 audit intentionally exits non-zero while the transitive `semantic/relations` dependency remains. This is a confirmed blocker, not a regression hidden by weakening the audit. Full TypeScript typecheck, Vitest, build, and real Laravel E2E remain unrun in this workspace.
