# Phase 1642 — Evidence Presence as a First-Class Semantic Judgment Rule

## Architectural change

The invocation semantic contract now declares `invocation-evidence-presence` as an explicit rule. The algebra's rule trace distinguishes absence of the requested invocation from a present invocation whose callable target cannot be resolved. This avoids misreporting a missing source-evidence obligation as a callable-target-resolution failure.

## Ownership boundaries

- `types/upstream/invocationSemanticJudgmentInterface.ts` owns the typed rule declaration and canonical rule catalog.
- `types/upstream/invocationSemanticJudgmentAlgebra.ts` interprets the rule and emits the matching trace outcome.
- The authority and runtime executor continue to delegate.
- The scanner facade continues to call the runtime executor without semantic inference or rewrite logic.

## Verification

- Phase 1641 dependency-slice static audit: 8/8 passed.
- Phase 1642 evidence/trace audit: 8/8 passed.
- Full TypeScript check was attempted but could not run to completion because this workspace lacks required standard-library/type dependencies and its installed global TypeScript compiler does not support the repository's configured target/lib values. No full-build success is claimed.
