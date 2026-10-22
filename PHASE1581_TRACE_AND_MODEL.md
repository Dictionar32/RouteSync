# Phase 1581 — Single-owner semantic authority premises

## Intent

Continue interface-first work without moving runtime or scanner wiring. Phase 1580 removed the duplicated verified-law ledger, but its `complete` coverage object still embedded the whole verification witness. A proof that also needs the verification therefore had two ownership paths for the same semantic fact.

## Model refinement

`RequestTypeAuthorityCoverageEvidence` now represents coverage only: complete coverage owns the `RequestTypeDerivationContract`; incomplete coverage owns a non-empty missing-law ledger. The verification witness is not nested inside coverage.

`RequestTypeDerivationSemanticAuthorityPremises` is the explicit boundary between upstream semantic reasoning and authority adjudication. It contains one field each for `input`, `judgment`, `verification`, and `coverage`. Successful decision proofs explicitly carry a narrowed valid verification alongside the corresponding judgment and complete coverage.

`RequestTypeDerivationSemanticAuthorityInterface.evaluate` now accepts these already-produced premises, rather than a raw derivation input. Its contract is adjudication of closed semantic premises, not hidden orchestration that derives and verifies again. Runtime code must later provide these premises and enforce the relation invariants; TypeScript types alone do not prove runtime value equality.

## Trace

- Upstream contract: `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` — changed.
- Scanner: `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts` — intentionally unchanged.
- Group aggregation: `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts` — intentionally unchanged.
- Authority implementation: `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts` — intentionally unchanged; still has imperative classification.
- Type-derivation runtime executor: `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts` — intentionally unchanged.

## Why this is a model improvement

The interface now separates semantic derivation evidence from authority adjudication. Each premise has one owner; coverage no longer hides a second verification witness. This reduces representational ambiguity and makes the later migration boundary explicit. It does not claim scanner integration or runtime correctness yet.

## References

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic compiler analysis should depend on explicit interfaces rather than concrete implementation details.
- MLIR Declarative Rewrite Rules: https://mlir.llvm.org/docs/DeclarativeRewrites/ — declarative rules make transformation conditions explicit.
- TypeScript Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html — discriminated unions preserve outcome distinctions and support exhaustive narrowing.

## Validation

- Structural contract audit: **12/12 passed** (`PHASE1581_AUDIT.json`).
- TypeScript 5.8.3 `transpileModule`: **0 diagnostics** for the changed interface file.
- Strict type-check of the interface entry and transitive imports: **35 errors** in Phase 1580 baseline and **35 errors** in Phase 1581; captured diagnostic outputs are byte-for-byte identical. These existing repository errors are not attributed to this phase.
- Package build remains blocked because the workspace does not have the `tsdown` executable installed (`sh: tsdown: not found`).
- Four scanner/aggregator/authority/executor implementation files remain byte-for-byte identical to the Phase 1580 baseline. This phase deliberately changes the contract only; it does not claim the runtime has already migrated to the new premises interface.

## Next migration boundary

The next safe phase should wire the existing semantic reasoning producer to construct `RequestTypeDerivationSemanticAuthorityPremises`, then change the authority implementation to adjudicate those premises without recomputing derivation or verification. Only after contract-to-authority wiring is validated should the runtime executor be simplified. The transition must preserve a runtime validation path for value-level coherence because TypeScript structural types do not establish that the supplied judgment, verification, coverage, and input all describe the same derivation.
