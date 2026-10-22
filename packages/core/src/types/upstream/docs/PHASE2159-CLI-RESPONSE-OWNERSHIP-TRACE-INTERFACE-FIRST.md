# Phase 2159 — CLI Response Ownership Trace, Interface First

## Finding

The CLI boundary is already correctly shaped: `scan` and `sync` share `buildManifestWithInvocationPipeline`, which closes source-to-invocation judgment inventory before calling `manifestBuilder.build`. `generate` consumes an existing manifest through `CompilerBridge` and must not infer Laravel semantics again.

The unresolved design issue is upstream. `resolveControllerActionContract` assigns `response.semanticPresence` to `ControllerResponse`; the absent response-attribute path produces `VoidResponseDescriptor`, whose `response_absent` is then consumed by return/dataflow/resource-binding logic. That value currently conflates “no response descriptor/reference was declared” with “no response exists”.

## Existing owners to evolve, not duplicate

- `LaravelControllerActionSemanticJudgmentInterface`: canonical per-action publication.
- `LaravelControllerResponseSemanticPipelineInterface`: integrated source-correlated response judgment.
- `LaravelControllerReturnResponseProjectionInterface`: canonical `ControllerReturnSemantic` to `ResponseResult` projection.
- `ControllerResourceBindingAuthorityInterface`: resource/model/response-reference correlation.

## Required contract change

Introduce a closed ADT for response declaration/reference evidence that distinguishes declared reference, no declaration, and unresolved declaration. Keep actual HTTP return semantics in the existing return-response projection and integrated response judgment. Then evolve resource-binding input to consume response-reference evidence, not a semantically overloaded `ControllerResponse` value.

No new authority, `relation/foundation`, or subscanner is needed. Production wiring should change only after the ADT and ownership boundaries are explicit.
