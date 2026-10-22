# Phase 1948 — Invocation Semantic Reasoning Interface First

## Trace findings

The existing `LaravelControllerInvocationSemanticJudgmentInterface` already owns the canonical judgment ADT and correlates each judgment member with one exact integrated-response outcome. However, its contract described behavior as prose-only rules (`sourceIdentityRule`, `outcomeRule`, etc.) while the existing authority implemented the actual input reasoning through a separate `switch`. The upstream integration interface already owns the lower-level source-binding and response-projection semantics, so a second authority would be duplication.

## Change

- Extended the existing judgment interface contract with `LaravelControllerInvocationSemanticReasoningRule`, a closed declarative ADT for absent pipeline evidence, provided pipeline evidence, and exact response-outcome preservation.
- Added `LaravelControllerInvocationSemanticReasoningContract` and embedded it into the existing canonical judgment contract; bumped that contract from v8 to v9.
- Published the same contract as `LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_REASONING_CONTRACT` from the existing authority module. The current authority remains the only interpreter and continues to delegate source identity validation to the source-binding authority and response projection to the integration authority.
- Kept the four response outcomes distinct: not-connected, source-binding-rejected, complete, and blocked. The contract explicitly forbids treating missing evidence as a successful empty batch, reconstructing provenance, or widening the response union.
- Added the missing type-only import for `PhpSourceInvocationSemanticPipelineIntegrationInterface` used by the existing judgment projection helper.
- Added `scripts/audits/audit-phase1948-invocation-semantic-reasoning-interface-first.cjs` and registered it under `scripts/audits/` / `package.json`.

## Ownership after change

`AST/source evidence → source-binding authority → integration authority → invocation judgment authority → canonical judgment ADT → scanner projection`.

The interface does not literally execute code: TypeScript interfaces are type-level contracts. The semantic rules are now explicit data owned by that interface; the existing authority interprets the contract. No parallel authority was introduced, and scanner projection remains a consumer rather than a semantic classifier.

## Verification scope

The Phase 1948 audit checks the contract, ownership boundaries, and distinct outcomes. Syntax transpilation and targeted TypeScript diagnostics are recorded separately in the phase audit report; this phase does not claim a full project build or full test suite.
