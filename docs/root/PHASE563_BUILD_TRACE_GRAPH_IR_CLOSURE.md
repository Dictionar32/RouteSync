# Phase 563 — Build Trace Graph + IR Closure

## Trace

The latest `npm run build` reached three concrete source-level blockers:

1. `relationIsSome` was consumed from `semantic/kernel/relationalSequence.ts` but the build resolver did not observe a stable direct export.
2. `compiler/utils/Graph.ts` introduced a barrel-to-barrel graph export boundary that esbuild reported as cycles while resolving graph classes.
3. `ir/buildIRNode.ts` accessed discriminant-specific properties through `SemanticNode`; `Omit<SemanticResolution, 'fields'>` loses the per-variant narrowing surface.

## Fixes

- Materialized `relationIsSome` as a direct export in `relationalSequence.ts` while keeping `relationFoundation.ts` as the semantic implementation authority.
- Replaced the graph facade chain with direct leaf exports from `compiler/utils/graph/*` in both `Graph.ts` and `compiler/index.ts`.
- Reworked `computeStableHash` to consume `matchSemanticResolution`, preserving the closed semantic ADT rather than relying on invalid discriminant narrowing.

## Verification

All modified TypeScript files pass `ts.transpileModule` with zero diagnostics.

A full build was not executed inside this checkpoint because the extracted workspace does not contain the user's installed dependency tree. The user's local build remains the authoritative integration check.
