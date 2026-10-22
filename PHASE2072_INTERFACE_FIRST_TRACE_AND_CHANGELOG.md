# Phase 2072 — Invocation Judgment Contract Single Source of Truth

## Trace

Phase 2071's AST evidence change was internally consistent, but tracing the downstream invocation judgment exposed a contract-ownership defect: `LaravelControllerInvocationSemanticJudgmentContract` declared version `12` in the interface while the authority independently rebuilt the same contract as version `11`, duplicating every semantic rule literal. The authority then spread that duplicate into each configured authority instance. This allowed the interface and the authority's published contract to disagree even though both claimed to represent the same judgment domain.

## Interface-first correction

- The existing `LaravelControllerInvocationSemanticJudgmentInterface` remains the single contract authority.
- `LaravelControllerInvocationSemanticJudgmentAuthority` now imports the canonical interface-owned contract and composes its existing default reasoning into it, instead of copying its rule set and stale version.
- No parallel invocation judgment, response authority, AST authority, resolver, or scanner was added.
- The four integrated-response outcomes remain separate discriminated members: `not_connected`, `source_binding_rejected`, `complete`, and `blocked`.
- The scanner remains a forwarder of the integrated judgment; the invocation runtime executor remains a delegate to the upstream semantic authority.
- No `relation/foundation` subscanner was introduced.

## Verification

`audit:phase2072-invocation-judgment-contract-single-source-interface-first` checks canonical contract ownership, exact outcome preservation, scanner forwarding, executor non-classification, and the excluded subscanner path.

This phase does not claim full TypeScript typecheck, project build, or Vitest completion.
