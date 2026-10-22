# Phase 2221 — Canonical Action Publication Uses Upstream Identity

## Trace

The action semantic judgment now publishes canonical `controllerName`, `actionName`, and exact method `source`. However, the controller scanner still built `ControllerActionJudgmentPublication.controller` and `.action` from `semanticJudgment.projection.identity`. That meant the publication boundary was still projection-led even though upstream semantic knowledge was available.

## Change

`laravelControllerScanner.ts` now publishes controller and action identity from `semanticJudgment.semantic.controllerName` and `semanticJudgment.semantic.actionName`. The source file and method span continue to come from `semanticJudgment.semantic.source`. The route/action correlation authority still checks the consumer projection identity as a consistency witness, but the projection is no longer the source from which the publication identity is chosen.

No new relation/foundation layer, parallel authority, or subscanner was added.

## Integrated response boundary

The scanner continues to submit the exact invocation judgment and controller declaration evidence to the existing `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse`, then sends the exact invocation/response pair to AST projection. This preserves the existing integrated-response authority and does not flatten controller-wide response products into per-action response fields.

The remaining response migration is real and intentionally not marked complete: `resolveControllerActionContract()` still calls `resolveResponse()`, and `responseAttributeScanner.ts` still performs legacy DTO class resolution/field merging. A safe next step must correlate a method-scoped response product with the exact canonical method source before projecting a compatibility `ResponseDescriptor`; a controller-wide DTO inventory alone is not enough evidence for action-level ownership.

## Verification scope

The regression tests assert the source path and ownership boundaries. They were not executed in this environment because the archive does not provide a verified installed Vitest runtime. Full TypeScript typecheck and package build were not run.
