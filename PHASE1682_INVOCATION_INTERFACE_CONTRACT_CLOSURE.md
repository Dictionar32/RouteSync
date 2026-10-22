# Phase 1682 — Invocation Interface Contract Closure

## Scope

Interface-first continuation from Phase 1681. This phase settles cross-contract ownership for the invocation pipeline only. It does not migrate algebra execution, authority implementation, runtime wiring, scanner behavior, or downstream projection.

## Interface gap found

Phase 1681 made the pipeline contract compose the high-level algebra boundary, but the pipeline still described authority validation only as a string guarantee. It did not structurally reference the canonical `InvocationSemanticContract`. This left two risks: the pipeline could drift from the judgment authority's actual contract, and a reader could not distinguish the pipeline's per-input batch from the existing aggregate analysis over one `SemanticKnowledgeDataFlow`.

## Changes

- `InvocationSemanticPipelineContract` now composes `InvocationSemanticContract` directly as `judgmentContract`, bound to the canonical `INVOCATION_SEMANTIC_CONTRACT` object.
- It continues to compose `InvocationSemanticAlgebraBoundaryContract` as `algebraBoundary`; callers still see a single high-level semantic pipeline, not low-level derivation stages.
- Contract version advances from 3 to 4 because the contract shape and authority linkage changed.
- Batch semantics are explicit: `analyzeBatch(inputs)` returns one independently inspectable judgment per input, in input order, and is not the same abstraction as aggregate analysis over a complete knowledge model.
- Existing runtime executor and scanner wiring remain unchanged by design. No claim is made that the new pipeline interface is implemented or production-wired.
- No dependency on `core/src/semantic/foundation` is introduced; no `any` or generic callable interface is introduced.

## External design reference

The TypeScript Handbook describes interfaces as named structural contracts and discriminated unions as a way to encode mutually exclusive variants so the type checker can narrow them. RouteSync applies that principle here by composing canonical contract objects and retaining closed/incomplete judgment distinctions instead of leaving these invariants as prose alone:

- TypeScript interfaces: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

These references inform the type-contract approach; they do not establish that RouteSync's own runtime implementation is correct.

## Verification

- `audit-phase1682-invocation-contract-closure.cjs`: 17 static interface/ownership checks.
- The preceding Phase 1681 audit was updated to validate the current contract version, avoiding a stale assertion.
- Focused TypeScript strict check for the pipeline and algebra boundary interfaces.
- ZIP integrity and root folder name `RouteSync/` checked.
- Full repository build and end-to-end tests are not claimed; workspace dependencies are not installed.
