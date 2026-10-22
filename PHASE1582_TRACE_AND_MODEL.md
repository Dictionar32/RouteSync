# Phase 1582 — Closed Semantic Authority Candidate Interface

## Purpose

Strengthen the upstream contract before changing scanner wiring. The previous Phase 1581 interface still exposed `input`, `judgment`, `verification`, and `coverage` as four independently supplied fields. That shape forced the authority boundary to reconcile those fields and did not make the source input part of the decision proof itself.

## Interface-first model change

`RequestTypeDerivationSemanticAuthorityCandidate` is now the closed `RequestTypeAuthorityDecisionProof` union. Each of the 11 rule-specific proof branches carries the original `RequestTypeDerivationInput` in its own premises alongside the correlated judgment, verification, coverage, rule ID, and conclusion.

`RequestTypeDerivationSemanticAuthorityInterface.evaluate` accepts this already-classified candidate, rather than a bundle of independently supplied semantic values. The upstream semantic reasoning algebra is responsible for producing the rule-specific candidate. Wiring should pass the candidate intact. The authority boundary may validate the candidate's evidence and contract invariants, but should not derive a judgment or reclassify which semantic rule applies.

## Trace of current implementation

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`: changed. The interface now represents a preclassified, source-bound semantic candidate.
- `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts`: traced, unchanged. It still creates a derivation context and calls `aggregateRequestTypeGroups`.
- `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts`: traced, unchanged. It still performs request lookup, no-request exclusion, group existence/merge selection, and invokes action/response derivation. These are semantic decisions in the current scanner path, not mere wiring.
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts`: unchanged. It still derives and verifies via the legacy kernel path and classifies outcome variants imperatively.
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts`: unchanged; it delegates to a different `SemanticTypeDerivationAuthorityInterface` and is not the RequestType authority path.

## Important boundary

This phase does **not** claim semantic reasoning has already disappeared from the scanner. It makes the intended consumer contract strong enough that a later wiring migration can pass a closed candidate instead of rebuilding classifications. The next implementation phase must provide a producer for the candidate from the existing semantic relation/algebra model, connect the RequestType scanner path to that producer, and only then remove the legacy decisions from `groupAggregator` and the raw-input authority kernel. Do not simply move the same `if`/gate logic into another adapter.

TypeScript's discriminated unions and exhaustiveness checking support this closed-algebra design, but they do not prove runtime value equality. Authority validation must verify source-to-proof coherence without re-running semantic classification.

## References

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — analyses and transformations should operate through generic semantic interfaces rather than special-casing concrete implementation details.
- MLIR Declarative Rewrite Rules: https://mlir.llvm.org/docs/DeclarativeRewrites/ — rule conditions and transformations can be expressed as declarative patterns rather than buried in procedural control flow.
- TypeScript unions and exhaustiveness: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html — discriminated unions preserve outcome distinctions and make incomplete handling detectable.

## Validation

See `PHASE1582_AUDIT.json` for structural checks. This phase changes only the upstream interface contract; it does not claim scanner integration or a successful package build.
