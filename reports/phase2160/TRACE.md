# Phase 2160 — Response Reference Judgment, CLI-to-Scanner Trace

## Decision

The former `ControllerResponse` discriminants (`response_present` / `response_absent`) conflated a declared response-reference fact with a claim about whether a PHP method produces an HTTP response. The actual canonical HTTP return semantics are already owned by `ControllerReturnSemantic`, `LaravelControllerReturnResponseProjectionInterface`, and `LaravelControllerResponseSemanticPipelineInterface`.

This phase evolves the existing ADT instead of adding another authority:

- `ControllerResponseReferenceJudgment` has `response_reference_declared` and `response_reference_not_declared` outcomes.
- `ResponseDescriptorReferenceContract` publishes `responseReferenceJudgment` from existing descriptor constructors.
- `ControllerActionContract` and `LaravelControllerActionSemanticKnowledge` name the published fact `responseReferenceJudgment`.
- `ControllerResourceBindingAuthorityInterface` consumes that reference judgment and keeps a not-declared reference unresolved for resource binding; it does not infer no-content HTTP semantics.
- `LaravelControllerResponseSemanticPipelineInterface` continues to retain both `observed_controller_return` evidence and the separate `controller_action_response_reference_candidate` evidence.
- The existing invocation judgment and integrated response judgment remain paired in `LaravelControllerScanArtifact`.

The old `ControllerResponse` type name and `ResponseDescriptorPresenceContract` name remain compatibility aliases; new production boundaries use the explicit names. The old discriminants are no longer used for this controller-reference ADT. Separate Laravel resource-method presence ADTs still use their own `response_present` / `response_absent` variants and were not renamed.

## CLI trace

`scan` and `sync` call `buildManifestWithInvocationPipeline`; composition closes the source-to-invocation judgment inventory before calling `manifestBuilder.build(receipt)`. The controller scanner executes the existing action semantic authority, then calls the existing integrated response pipeline with the exact invocation judgment. `generate` consumes the manifest through `CompilerBridge.emitFullBundle` and does not reclassify Laravel syntax.

## Remaining ownership debt

`resolveControllerActionContract()` still calls `resolveResponse(...)` to construct the descriptor from method/attribute evidence. This phase does not claim that legacy response descriptor derivation has been retired. The next change should determine whether the existing response evidence production pipeline can become the sole owner of descriptor evidence without duplicating AST scans or creating a parallel authority.

## Validation boundary

The phase audit is static contract/trace validation. Syntax-only transpilation is run on changed TypeScript files. Full build, full typecheck, and Vitest are not run.
