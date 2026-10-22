# Phase 2165 — Interface-first invocation and integrated-response trace

## Decision

Do not modify the parser or add a relation/foundation/subscanner layer before closing the upstream interface gap. Phase 2164 correctly transports the exact declared PHP response-attribute span, but that is source provenance—not a resolved response descriptor and not a DTO declaration judgment.

## Existing authority chain

`InvocationSemanticInput -> InvocationSemanticAuthorityInterface.analyze -> InvocationSemanticRuntimeExecutorInterface.execute -> LaravelControllerInvocationSemanticJudgmentInterface -> LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse -> evidenceProduction.produce -> evidenceSourceBinding.bind -> responseExecutor.execute -> astProjection.judge`.

The response pipeline is already wired by `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`. Adding another pipeline, authority, or executor would duplicate ownership.

## Contract findings

1. `InvocationSemanticAuthorityInterface` consumes complete `SemanticKnowledgeDataFlow` plus one invocation and positional evidence. Its runtime executor delegates to `authority.analyze`; it does not need a new invocation interface for this task.
2. `LaravelControllerResponseSemanticPipelineInterface` already composes source correlation, evidence production, per-item source binding, response judgment, and AST projection.
3. `ControllerResponseAttributeSourceEvidence` now distinguishes absent/declaration cases and a declared attribute retains exact `SourceSpan` provenance.
4. `LaravelControllerResponseEvidenceProductionCoverage` explicitly says the producer is partial: `resolved_response_attribute_descriptor` and `response_dto_declaration` are missing.
5. `ControllerDeclarationEvidence` contains controller methods and their response-attribute facts, but no closed inventory of DTO declarations. `SourceProjectIdentity` is project identity, not a DTO source inventory. Therefore the current evidence-production interface cannot honestly claim it has enough source facts to resolve DTO declarations.
6. `packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts` still calls `resolveResponse(...)`; the declared case delegates to `responseAttributeScanner.ts`, which resolves the DTO file, reads properties, and merges observed returns. This is the remaining legacy semantic ownership, not a missing response pipeline.
7. The response runtime executor's interface correctly indexes `execute` to the authority's `judge` signature. The missing piece is upstream evidence completeness, not executor branching.

## Required interface-first correction

Evolve the existing `LaravelControllerResponseEvidenceProductionInterface` input contract—not a new interface—to receive a typed, source-correlated DTO declaration inventory produced by the existing source-model stage. The inventory must preserve declaration identity, class-name resolution judgment, source span, and parsed property declarations. The existing producer can then emit a closed ADT distinguishing resolved, unresolved, and ambiguous DTO declaration evidence. The existing response authority must consume that evidence and only publish a complete response product when the DTO judgment and source binding are closed.

Do not wire this until the source-model stage can supply that typed inventory. Do not let `responseAttributeScanner.ts` continue to resolve class files or infer DTO fields once the upstream contract is complete. Do not introduce `relation/foundation`, a subscanner, or a parallel authority.

## Scope of this phase

This phase is an interface-first trace and guard, not a claim that the legacy resolver has been retired. No parser or runtime semantic behavior is changed. That restraint is intentional: changing parser spans again would not solve the proven contract gap.
