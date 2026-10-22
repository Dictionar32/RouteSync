# Phase 1980 — Controller response judgment correlated on the canonical artifact

## Scope

Interface-first only. This phase changes type/interface declarations, the public type export, and audit/documentation files. It does not edit runtime scanner implementations, executors, wiring, or legacy subscanner implementations. It introduces no `semantic/relations` or `semantic/foundation` subscanner and no parallel invocation authority.

## Trace finding

Phase 1979 introduced `LaravelControllerResponseSemanticJudgment`, but the controller scan artifact still exposed only `invocationJudgment`. The response judgment existed as a detached type and the retirement map called the AST pipeline its projection boundary. That did not make the controller artifact itself carry the response semantic result, and it did not correlate response outcome with the invocation outcome at the controller contract boundary.

## Interface correction

- `LaravelControllerResponseSemanticJudgmentFor<InvocationJudgment>` distributes over the canonical invocation judgment ADT and retains the specific invocation outcome subtype.
- `LaravelControllerScanArtifact` is now a discriminated union pairing each invocation outcome with its compatible response judgment.
- The complete invocation arm permits `controller_response_complete` or `controller_response_blocked`; it cannot be widened into a successful response merely because invocation integration completed.
- `LaravelControllerScanArtifact` and `LaravelControllerScanJudgment` contract versions advance to 18.
- Response subscanner responsibility mappings now point to `LaravelControllerResponseSemanticJudgmentContract` and the canonical `LaravelControllerScanArtifact` boundary, not to `LaravelSourceAstPipelineInterface` as the owner of response meaning.
- `LaravelControllerResponseSemanticJudgmentFor` is exported as a type-only public API.

## Semantic boundary

`InvocationSemanticIntegratedResponseCompositionInterface` represents the integrated PHP invocation/knowledge pipeline result. `LaravelControllerResponseSemanticJudgment` represents Laravel controller HTTP-response meaning. These are related but not interchangeable contracts. The response judgment retains the exact invocation outcome subtype as provenance; it does not replace or duplicate the invocation authority.

The intended chain is:

```text
Laravel source evidence
  -> canonical invocation judgment
  -> outcome-indexed controller response semantic judgment
  -> canonical controller scan artifact (AST + actions + resource evidence + both judgments)
  -> source AST projection ADT (complete | blocked)
  -> runtime executor consumes the already-closed artifact/contract
```

This is an interface target, not a claim that production wiring has been migrated. Type-level outcome correlation does not prove runtime object identity or source-file equality; the existing source-identity authority and eventual wiring must preserve and validate those invariants.

## Remaining migration gap

The existing runtime wiring still constructs controller artifacts without `responseJudgment`. This is deliberately exposed by the new interface contract so the next wiring phase has a precise compile-time target. No build/typecheck is claimed in this phase. The legacy controller modules also retain existing `semantic/relations` imports; this phase does not pretend those imports have been removed.
