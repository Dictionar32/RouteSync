# Phase 1988 — Integrated Invocation/Response AST Projection

## Scope

Strengthen the existing invocation semantic interface and its existing AST projection executor. No new `relation` or `foundation` subscanner/layer is introduced, and no scanner is deleted.

## Trace finding

Phase 1987 had made `responseJudgment` mandatory on the existing `invocation_semantic_judgment` context, while established parser call sites still supplied only `judgment`. That mixed two different semantic states in one discriminant and made the interface dishonest for invocation-only callers.

## Contract correction

The context is now a closed three-case ADT:

- `syntax_only`: no invocation or response judgment is claimed.
- `invocation_semantic_judgment`: preserves the canonical invocation judgment only.
- `integrated_invocation_response_judgment`: requires the exact correlated invocation and response judgments.

The projection result mirrors this distinction with `syntax_only_projection`, `invocation_only_projection`, and `semantic_projection`. The existing authority forwards `context.responseJudgment` by identity for the integrated case; it does not classify or synthesize a response judgment.

The controller-body AST now has a separate `IntegratedSemanticControllerBodyAst` case. The parser retains the exact response judgment on that variant rather than dropping it after the authority has accepted the integrated pair. Existing invocation-only consumers remain truthfully invocation-only until their upstream artifact/wiring supplies the response judgment.

## Versioning

- `LaravelControllerInvocationSemanticReasoningContract`: version 3.
- `LaravelControllerInvocationSemanticJudgmentContract`: version 12.

## Trace boundary

Controller subscanner tree: 20 TypeScript files; 12 files contain `semantic/relations` references; 0 files contain `semantic/foundation` references. This is a text/import trace, not a claim that all 12 files have a direct import at every occurrence. No relation/foundation layer was added or removed in this phase.

## Verification

`PHASE1988_AUDIT.json` records the structural audit. TypeScript typecheck, full build, and test runner were not run; do not treat structural audit as compilation proof.

## External semantic grounding

TypeScript discriminated unions support modeling syntax-only, invocation-only, and integrated states as separate variants, with exhaustiveness checked at consumers. Laravel's controller and response documentation likewise distinguishes controller actions from the range of response forms; RouteSync must retain its own source-correlated semantic judgment instead of inferring it from a controller name.
