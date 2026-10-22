# Phase 1584 — Semantic Pipeline Interface First

## Objective

Strengthen the upstream contract so future scanner wiring can consume a complete semantic authority assessment without doing request/resource resolution, route classification, contribution reconciliation, or proof assembly locally. This phase intentionally changes the interface model first and does not migrate runtime code.

## Trace findings from the Phase 1583 baseline

- `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts` builds a `DerivationContext` and delegates to `aggregateRequestTypeGroups`.
- `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts` performs request lookup, chooses the resource group, derives route action/response contributions, and merges existing groups. It uses `relationGate`/relation helpers, but those abstractions still encode semantic choices. Replacing an `if` with a relation helper does not by itself remove reasoning.
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts` exposes a low-level kernel (`deriveJudgment`, `verify`) and classifies outcomes. It is not wired into the active scanner path.
- `packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts` invokes `RequestTypeDeriver.derive` directly, so it remains coupled to the scanner-owned derivation implementation.
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts` is a separate runtime path and is intentionally untouched.

## Interface changes

Added to `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`:

1. `RequestTypeDerivationSemanticReasoningInterface`: source evidence → closed semantic judgment.
2. `RequestTypeDerivationProofVerificationInterface`: checks a produced judgment against the evidence and contract, without deriving/reparing a replacement judgment.
3. `RequestTypeDerivationSemanticPipelineInterface`: one source-bound `derive(input)` operation for wiring, returning the closed authority assessment. The semantic-layer implementation is responsible for composing inference, verification, and adjudication.
4. `RequestTypeDerivationJudgmentConsumerInterface<TProjection>`: downstream projection accepts a judgment only, not raw route/resource/request collections or policy parameters.

The existing `RequestTypeDerivationSemanticAuthorityInterface.evaluate(candidate)` remains a lower-level candidate-adjudication boundary. It is not the interface that scanner wiring should call directly, because doing so would force wiring to assemble the candidate and pair its witnesses.

## Target responsibility boundaries

`Source Evidence → Semantic Reasoning Algebra → Closed Judgment + Proof → Proof Verification / Authority Adjudication → Source-bound Pipeline Interface → Wiring → Runtime Executor → Downstream Projection`

The semantic layer may use algorithmic control flow internally. The requirement is not “remove every `if`”; it is that semantic decisions are owned by the semantic model and are returned as closed judgments, not recomputed in wiring/executor. A relation helper is not a substitute for a semantic model if it merely hides the same choice.

## Deliberately not migrated

No scanner, aggregator, authority implementation, wiring, or runtime executor file is changed in Phase 1584. The new interface is a contract prerequisite, not evidence that the live path already consumes it. The next phase must implement the pipeline in the semantic layer, preserve existing behavior with differential tests, then change wiring to depend on the source-bound interface.

## Validation

See `PHASE1584_AUDIT.json` and `PHASE1584_VALIDATION.json`. Build remains subject to availability of the repository's `tsdown` executable.

## References

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- MLIR Declarative Rewrite Rules: https://mlir.llvm.org/docs/DeclarativeRewrites/
- TypeScript Unions and Intersection Types: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
