# Phase 1645 — Rule Trace Obligation Ownership

## Semantic correction

The invocation target-resolution trace previously repeated `callable_target_unresolved` obligations even though the contract assigns that obligation to `invocation-unresolved-target-obligation`. This obscured rule provenance: a trace consumer could not distinguish a conclusion rule from the rule that owns an unresolved obligation.

## Changes

- Raised `InvocationSemanticContract` to version 5.
- Added declarative trace invariants for obligation ownership, closure aggregation, obligation counts, and invocation identity.
- Added `rule-obligation-ownership` and `trace-obligation-counts` to the proof binding contract.
- Target-resolution trace now emits no obligations; unresolved-target trace owns `callable_target_unresolved`; target-ambiguity trace owns `callable_target_ambiguous`; the closure trace remains the aggregate of all unresolved obligations.
- Updated regression coverage for ownership and witness-count consistency.
- Scanner/runtime executor behavior remains delegation-only.

## Validation

Run `node packages/core/scripts/audits/audit-phase1645-rule-trace-obligation-ownership.cjs`. Full TypeScript build still requires the repository's declared toolchain and dependencies.
