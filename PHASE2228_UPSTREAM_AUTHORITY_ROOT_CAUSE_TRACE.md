# Phase 2228 — Upstream Authority Root-Cause Trace

## Decision

This phase deliberately does **not** add scanner wiring. The root defect is not a missing invocation/response authority: those interfaces already exist. The remaining split is the legacy action contract's demand for a `ResponseDescriptor` before the controller-wide integrated response pipeline has produced source-correlated canonical method products.

## Trace

1. `LaravelControllerInvocationSemanticJudgmentAuthorityInterface` defines the closed invocation judgment and keeps `not_connected`, `source_binding_rejected`, `complete`, and `blocked` distinct.
2. `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` accepts the exact invocation judgment and composes source correlation, response evidence production, source binding, DTO resolution, DTO property binding, DTO contract projection, and the existing response semantic authority.
3. `LaravelControllerIntegratedResponseJudgment<InvocationJudgment>` retains the exact invocation subtype. `LaravelControllerAstProjectionSemanticAuthorityInterface` receives the exact invocation/response pair; neither judgment should be rebuilt downstream.
4. `LaravelControllerMethodResponseAstProjectionInterface` projects only closed, source-correlated method response products.
5. In parallel, `actionScanner.ts` still calls `resolveControllerActionContract()`, which calls `resolveResponse()`, which calls `resolveResponseAttributeAst()` for declared attributes. This remains a second response-derivation path.

## Root defect

The canonical integrated pipeline and the compatibility `ResponseDescriptor` are not yet joined by a source-correlated projection contract. Consequently, the legacy action contract still resolves DTO files and merges return observations independently. Fixing only `responseScanner.ts` or adding a forwarding runtime edge cannot eliminate that duplicate semantic ownership.

## Required upstream-first correction

- Evolve the existing `LaravelControllerResponseSemanticPipelineInterface` / existing method projection contract; do not add a parallel response authority.
- The compatibility projection must accept a closed method response product plus the exact source-correlated action publication and invocation judgment.
- Its outcome must be closed: a descriptor may be published only when method identity, source span, invocation identity, and canonical response product correlate. Otherwise return an explicit unresolved/rejected outcome; never guess a descriptor or fall back to legacy resolution.
- Only after this contract is specified should its implementation and action-consumer wiring change.
- Retire `resolveResponse()` and `resolveResponseAttributeAst()` only when no production dependency reaches them and parity tests cover DTO, inferred return, void, ambiguity, unresolved class references, and mismatched source spans.

## Guardrails

No `semantic/relations` replacement, no `semantic/foundation`, no subscanner, no duplicate authority, and no relocation of the legacy resolver to another file. Runtime execution must preserve an upstream judgment rather than make a new semantic decision.

## Verification boundary

This phase is a trace and guard audit, not a claim that the response migration is complete. Structural audit and ZIP integrity are checked; full TypeScript typecheck, Vitest, and package build are not run in this environment.
