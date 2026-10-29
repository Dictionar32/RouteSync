# Phase 1663 — Invocation Phase Evidence

## Problem

The previous derivation proof created one witness object for each target, argument binding, unmatched argument, and emission. In particular, `slice.bindings.map(binding => ({ ... }))` reconstructed canonical semantic facts into low-level proof records. The public `SemanticArgumentParameterFlow` and argument obligation also leaked `argumentIndex: number` even though the domain judgment already expresses the binding by argument and parameter identity.

## Change

- Replaced per-fact witness materialization with domain-phase evidence. An `argument-binding` witness now retains `bindings: slice.bindings` as the canonical collection rather than reconstructing each binding.
- Target resolution now records the aggregate target judgment and its domain outcome (`resolved`, `ambiguous`, or `unresolved`). An unresolved target is represented explicitly in the phase judgment, while its obligation remains a separate closure concern. Ambiguity retains the candidate callable collection as a single domain witness.
- Result and exception projections retain their semantic flow collections as phase evidence.
- Removed `argumentIndex` from public argument-binding facts and unmatched-argument obligations. The implementation may still use a local source position to determine positional correspondence, but the numeric index is not part of the domain contract or proof identity. Binding provenance reuses the already-established target evidence rather than rebuilding a source list from each binding.
- Updated trace ownership to map aggregate semantic-phase witnesses to the existing rule trace for compatibility. Trace counts are phase-witness counts, not counts of individual arguments or target candidates.
- Kept scanner delegation unchanged: the scanner calls `invocationSemanticRuntimeExecutor.executeAll(...)` and does not construct invocation witnesses.
- Increased the invocation model version to 8 and public contract version to 19.

## Files

- `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`
- `packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts`
- `packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts` (contract validation remains the same phase-boundary enforcement)
- `packages/core/src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlow.phase219.test.ts`
- `scripts/audits/audit-phase1663-invocation-phase-evidence.cjs`
- `scripts/audits/audit-phase1662-invocation-domain-witnesses.cjs` (updated to assert aggregate witnesses)
- `package.json`

## Verification

- Phase 1663 architecture audit: 8/8 passed.
- Phase 1662 witness audit, updated for the new aggregate representation: 7/7 passed.
- Focused TypeScript check of the invocation interface, algebra, and authority: passed with installed TypeScript 5.8.3 and explicit ES2024/bundler settings.
- Full project build and Vitest were not run: `node_modules` is absent, and the repository's configured TypeScript target requires a newer TypeScript than the globally installed 5.8.3.

## Architecture references

The model follows the separation described in MLIR Interfaces: analyses consume semantic contracts instead of encoding per-operation details in generic consumers. MLIR's data-flow analysis tutorial also distinguishes the domain lattice/state from the solver that propagates it. These references support keeping invocation facts as domain judgments and making the trace a consumer of those judgments rather than reconstructing each fact into a generic proof record.
