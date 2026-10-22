# Phase 1948 Interface-First Trace

## Existing path traced

1. `LaravelControllerInvocationSemanticInput` distinguishes pipeline evidence absent from a whole-file pipeline result being provided.
2. `laravelControllerInvocationSemanticJudgmentAuthority` binds a provided pipeline result to the exact controller source file.
3. `phpSourceInvocationSemanticPipelineIntegrationAuthority` projects binding evidence into one of four outcomes.
4. `LaravelControllerInvocationSemanticJudgmentInterface` carries `sourceFile` and an outcome-indexed `response` in one canonical ADT member.
5. Scanner consumers pass the closed judgment into AST projection instead of independently supplying source identity and integrated response.

## Interface gap

The judgment interface had a large prose-only contract but no typed semantic rule set. The authority's `switch` was therefore the only concrete place where absent-versus-provided input semantics were visible. This is not a reason to create a second authority: source binding and integration are already separately owned upstream.

## Interface-first improvement

The existing interface now exposes `LaravelControllerInvocationSemanticReasoningContract` as a closed ADT-backed rule set:

- `pipeline_absent_rule`: absent evidence must produce the explicit not-connected outcome; it cannot imply a successful empty invocation batch.
- `pipeline_present_rule`: a whole-file result must be bound to the exact controller source identity before integration projection.
- `response_outcome_preservation_rule`: the exact response outcome and its provenance remain intact; response unions are not widened and provenance is not reconstructed.

The existing judgment contract is now v9 and embeds this reasoning contract. The existing authority publishes and interprets it, while existing source-binding and integration authorities retain their own ownership. The four judgment variants remain correlated to exact response variants.

## Remaining limitation

This phase establishes the declarative reasoning contract and checks its ownership boundaries. It does not replace TypeScript runtime implementation with a magical executable interface, and it does not claim the complete controller AST/response scanner pipeline has been end-to-end tested. The next useful trace is to follow the inventory closure receipt through the AST projection boundary and identify any consumer that synthesizes a not-connected judgment when an authoritative whole-file result should already be available.
