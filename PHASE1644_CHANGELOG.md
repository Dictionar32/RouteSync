# RouteSync Phase 1644 — Proof-Bound Rule Trace

## Why this phase exists

The prior invocation contract had a version invariant violation: its TypeScript interface declared version 4 while the exported runtime contract object still reported version 3. In addition, rule trace entries exposed outcome/count summaries without retaining the identity, evidence provenance, and actual obligation objects behind those summaries.

## Changes

- Aligned `INVOCATION_SEMANTIC_CONTRACT.version` with the declared contract version `4`.
- Extended each `InvocationSemanticRuleTraceEntry` with `subjectInvocation`, exact `evidence`, and exact `obligations`.
- Bound missing-evidence trace entries to the requested invocation identity and its source provenance; no target-resolution evidence is fabricated when the invocation is absent.
- Bound target ambiguity trace entries to candidate callable source evidence and the typed ambiguity obligation.
- Included callable provenance for argument-binding obligations even when no argument-to-parameter flow can be derived.
- Expanded the contract's `proofBinds` declaration to include invocation identity, rule-specific evidence, and rule-specific obligations.
- Added regression assertions that inspect trace witnesses rather than relying only on obligation counts.
- Exposed the new evidence-presence and target-ambiguity rule constants through the scanner compatibility facade without moving semantic reasoning into scanner code.
- Added reproducible Phase 1640–1644 audit scripts to `packages/core/package.json`.

## Ownership and runtime boundary

`core/src/types/upstream` owns the contract, rule catalog, judgment algebra, and proof-bound trace. `invocationSemanticAuthority` delegates to that algebra. `invocationSemanticRuntimeExecutor` delegates to the authority. The scanner facade only re-exports the public surface and executor; it does not construct judgments, trace entries, or semantic obligations.

## Verification

- Phase 1639 runtime executor audit: 7/7 passed.
- Phase 1640 scoped judgment audit: 7/7 passed.
- Phase 1641 dependency slice audit: 8/8 passed.
- Phase 1642 evidence trace audit: 8/8 passed.
- Phase 1643 target ambiguity audit: 10/10 passed.
- Phase 1644 proof-bound trace audit: 7/7 passed.
- Total static audit checks: 47/47 passed.
- `packages/core/package.json` JSON parse: passed.
- `npm run build`: not run successfully; `tsdown` is not installed in this workspace (`sh: 1: tsdown: not found`). TypeScript build and Vitest remain unverified.
