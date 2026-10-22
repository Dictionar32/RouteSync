# Phase 1675 — Invocation Projection and Proof Interface Closure

## Scope

This phase continues the interface-first sequence from Phase 1674. It changes the invocation semantic interface and adds focused type/audit checks. It does not migrate algebra, authority, runtime executor, scanner, or downstream producers.

## Interface changes

- `InvocationSemanticContract` advances from version 28 to 29. `InvocationSemanticModel` remains version 17 because this phase tightens the contract boundary rather than changing the domain rule catalog.
- Effect projections are now discriminated: result flows can only carry a `result` emission, and exception flows can only carry an `exception` emission.
- Every effect flow contractually carries separate non-empty evidence for invocation, callable declaration, emission declaration, and the projection claim.
- Judgment and aggregate result/exception arrays use their respective result-only and exception-only flow types.
- The contract explicitly records requested-invocation membership checks, missing-invocation handling, effect-projection identity/provenance requirements, trace coverage and witness ownership, and proof/closure correlation requirements.
- Proof bindings now explicitly include effect-projection identity, effect-projection provenance, rule-trace coverage, and closure completeness.

## Verification

- Focused interface strict TypeScript check: passed.
- Focused positive/negative effect-flow type checks: passed.
- Phase 1675 contract audit: 12/12 checks passed.
- Full repository build/tests: not run. The interface-first change intentionally establishes stricter effect-flow requirements before producer migration; algebra and downstream constructors have not yet been updated to satisfy the new evidence fields and discriminants.
- ZIP root folder: `RouteSync/`.

## Remaining validation responsibility

Types enforce result-vs-exception distinctions and non-empty evidence shapes, but cannot prove source truth, identity equality across arbitrary values, or that provenance semantically supports a projection. The authority must validate those invariants after the algebra and wiring are migrated.
