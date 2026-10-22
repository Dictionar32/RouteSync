# Phase 2059 — Static-Call Model Catalog Identity, Interface First

## Trace finding

The prior `static_class_model_origin` fallback classified every non-`DB` static call as an Eloquent model origin by deriving `ModelName` from the AST class-name string. That was not supported by source evidence: an arbitrary static class such as `Cache` or `Str` could be mistaken for a model.

## Contract change

`ControllerStaticCallOriginInput` now carries `modelClasses`, a typed catalog projected from the canonical `ModelDefinition` results scanned for the same Laravel source project. `ControllerStaticCallModelClassIdentityRuleInterface` resolves a static class against that catalog and returns a closed identity judgment: `resolved`, `not_found`, or `ambiguous`. The existing `ControllerStaticCallOriginAuthorityInterface` composes that rule with its ordered DB-table and DB-facade rules; no parallel authority was added.

The static-class rule now emits `resolved` only when exactly one model catalog identity matches the source class token. A missing identity yields `not_applicable`; duplicate short class identities yield `unresolved`. The resulting model origin uses the canonical `ModelName` from `ModelDefinition`, rather than fabricating a model name from the expression text.

The current PHP class-reference parser does not yet provide a closed import-alias/FQCN resolution judgment to this boundary. Therefore the catalog match is deliberately exact against the model short-name evidence and ambiguity is closed; namespace/import alias resolution remains an explicit follow-up rather than being guessed in the runtime scanner.

## Production wiring

`laravelSourceAstPipeline.ts` builds the typed class catalog from the already scanned model definitions and passes it through `LaravelControllerScanInput` → `scanControllerAction` → `ControllerActionContractResolverContext` → `createControllerDataflowContract` → static-call origin evidence. Scanner code projects evidence and does not decide whether a class is a model.

The origin authority contract is version 4. The model-class identity rule is version 1. Existing invocation, integrated-response, response-attribute, AST-rule, and resource-binding authorities remain the owners of their prior responsibilities.

## Verification limits

Structural audits and TypeScript parser diagnostics are run for this phase. Full typecheck, build, and Vitest are not claimed unless executed in a compatible project environment.

No `relation/foundation` subscanner was introduced. No duplicate invocation, response, AST, or model-origin authority was added.
