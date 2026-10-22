# Phase 1676 — Invocation Semantic Algebra Interface

## Scope

This phase establishes a dedicated, domain-level interface for invocation semantic algebra. It changes no algebra implementation, authority implementation, executor, scanner, wiring, or downstream projection.

## Contract boundary

`packages/core/src/types/upstream/invocationSemanticAlgebraInterface.ts` defines four distinct derivation phases:

1. `deriveTargetResolution` — derives the invocation's target judgment from upstream semantic knowledge.
2. `deriveArgumentBinding` — consumes the target judgment and explicit upstream positional-form evidence; it must not independently resolve or reclassify targets.
3. `deriveEffectProjection` — consumes the target judgment and keeps result and exception flow types separate.
4. `closeJudgment` — correlates already-derived judgments, obligations, source evidence, rule trace, and witnesses into the final judgment without rerunning prior phases.

A separate `InvocationSemanticAlgebraContract` records the required derivation order, evidence preservation, identity validation, and closure invariants. Batch derivation remains a domain-specific interface, not a generic callable/relation engine.

## Deliberate limitations

- This phase defines a contract only; the existing algebra has not yet been migrated to implement it.
- TypeScript cannot prove cross-field identity equality or the truth of source provenance. The authority must validate those invariants.
- The contract does not claim that non-empty evidence is semantically sufficient; it requires preservation and later validation of real upstream evidence.
- Full repository build and tests have not been run as part of this phase.
