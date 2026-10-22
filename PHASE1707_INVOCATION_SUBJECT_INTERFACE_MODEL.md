# Phase 1707 — Invocation Subject Interface Model

## Scope

Interface/contract evolution only. No production scanner implementation, invocation algebra, authority, executor, or pipeline wiring was changed.

## Trace findings

- The PHP AST evidence producer already emits `static-invocation` as a distinct source fact.
- `SemanticStaticInvocation` carries class name, operation, argument identities, and source evidence; ordinary `SemanticInvocation` instead carries a receiver expression.
- The current judgment algebra selects only `invocation` facts. Static calls must not be coerced into ordinary calls by inventing a receiver.
- Laravel controller scanner output is source artifact production. Invocation target resolution, argument binding, effect projection, proof, and closure belong to the canonical invocation semantic pipeline.

## Interface changes

- Added the closed `InvocationSemanticSubject` sum type with separate ordinary and static variants.
- Added `InvocationSemanticSubjectIdentity`, whose identity includes both source form and `KnowledgeId`.
- Added a coverage inventory interface and entry ADT that preserve source evidence and explicitly mark unsupported static judgment coverage.
- Added `InvocationStaticJudgmentModelContract`: class+operation target resolution, unresolved/ambiguous outcomes, no coercion, argument/effect gates, and authority-validated proof closure.
- Evolved `InvocationSemanticCoverageContract` to version 2 and the pipeline contract to version 14.
- Added `LaravelControllerInvocationSemanticBoundaryContract` to forbid moving invocation reasoning into the Laravel controller scanner.
- Exported the new contracts/types from the package public index.

## Verification

Run:

- `npm run audit:phase1707-invocation-subject-interface-model`
- `npm run audit:phase1706-invocation-coverage-interface-truth`
- `npm run audit:phase1705-laravel-scanner-interface-contract-model`
- `npm run audit:phase1704-laravel-scanner-interface-contract-correction`
- `npm run audit:phase1703-laravel-scanner-interface-first-contract-closure`

This phase does not claim that static invocation judgments are implemented. The next phase should formalize the static target candidate/identity ADT and its proof/obligation catalog before touching algebra or wiring.
