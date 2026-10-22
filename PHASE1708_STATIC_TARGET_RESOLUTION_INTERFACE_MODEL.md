# Phase 1708 — Static Target Resolution Interface Model

## Scope

Interface-first continuation from Phase 1707. This phase defines a typed, candidate-correlated static invocation target-resolution sub-judgment and tightens the Laravel controller scanner boundary. It does not implement static invocation derivation, authority validation, or production wiring.

## Trace findings

- PHP AST source evidence emits `static-invocation` as a distinct semantic fact.
- `SemanticStaticInvocation` carries class identity, operation identity, argument identities, and source provenance; it has no receiver.
- The existing invocation judgment algebra currently selects ordinary `invocation` facts only.
- The existing ordinary argument-binding and effect judgments are typed around `SemanticInvocation`, so they cannot safely be reused by coercing static calls into ordinary calls.
- Laravel controller scanner output is a correlated AST/action artifact and must not own target resolution or semantic closure.

## Interface changes

- Added `InvocationStaticTargetCandidateEvidence`, binding subject, candidate, class, operation, and source provenance.
- Added `InvocationStaticTargetCandidate`, with non-empty candidate-specific evidence.
- Added `InvocationStaticTargetUnresolvedObligation`, which preserves source evidence without inventing a callable.
- Added `InvocationStaticTargetResolution` with resolved (one candidate), unresolved (zero candidates), and ambiguous (two or more candidates) outcomes.
- Added `InvocationStaticTargetResolutionContract`, including pair-based lookup, candidate deduplication, source correlation, and no-coercion rules.
- Clarified that the current static target model is a sub-judgment only; full static invocation binding/effects/proof/closure remain unimplemented.
- Bumped coverage contract to v3 and pipeline contract to v15; updated Laravel controller boundary to v2.
- Exported the new public types and contract.

## Verification

Run `npm run audit:phase1708-static-target-resolution-interface-model` plus regression audits for Phases 1705–1707.

The production pipeline and invocation algebra are intentionally not modified. A passing contract audit is not a claim that static invocation is supported at runtime. Build/typecheck status must be reported separately.
