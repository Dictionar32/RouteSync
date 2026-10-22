# Phase 1643 — Invocation Target Ambiguity as a Closed Semantic Obligation

## Finding
The invocation judgment could derive multiple distinct callable targets from valid callable-role data-flow evidence and still close when the rewrite engine closed and no other obligation remained. That conflated “all candidates were enumerated” with “the invocation target was semantically resolved.”

## Contract change
- `InvocationSemanticContract` advances to version 4.
- The upstream rule catalog now declares `invocation-target-ambiguity` and the policy `explicit-resolution-required`.
- `callable_target_ambiguous` is a typed obligation carrying the invocation and all distinct candidate callable identities.
- The single-invocation and batch algebra both emit the obligation when more than one distinct callable identity is supported.
- Rule trace records target ambiguity separately from missing/unresolved target evidence.
- Repeated data-flow witnesses for the same invocation/callable identity are deduplicated before counting candidates; duplicate evidence alone does not manufacture ambiguity.

## Architecture boundary
The rule and obligation are defined in `core/src/types/upstream`. The algebra interprets the declarative rule and preserves candidate evidence. The runtime executor still only delegates to `InvocationSemanticAuthorityInterface`; scanner remains a thin caller and does not classify target ambiguity.

## Verification
Run `node packages/core/scripts/audits/audit-phase1643-invocation-target-ambiguity.cjs` plus the Phase 1639–1642 audits. This phase does not claim a full TypeScript build unless the repository's pinned toolchain and dependencies are available.
