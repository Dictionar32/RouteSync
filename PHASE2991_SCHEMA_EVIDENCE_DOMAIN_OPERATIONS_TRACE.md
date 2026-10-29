# Phase 2991 — Schema Evidence Domain Operations and Runtime Trace

## Why this change

Phase 2990's `InlineSchemaEvidenceJudgment` carried `kind` but exposed a generic `continueWith<Result>(onEmpty, onPresent)` operation. That contract asked callers to supply both branches and did not name the schema-domain action.

Phase 2991 replaces that callback with a non-generic, schema-specific operation:

- `empty_inline_schema.deriveFormRequestSchema(fields)` produces `form_request_schema`.
- `present_inline_schema.deriveFormRequestSchema(fields)` produces `form_request_and_inline_validation_schema` and preserves inline fields, messages, attributes, and validation entries.

This reduces generic continuation machinery in this specific decision. It does **not** claim that every primitive check has disappeared: the authority still determines whether the four inline evidence collections are empty. That collection-presence rule remains a concrete upstream domain-modeling opportunity; moving it to another generic helper would not be an improvement.

## Source/runtime trace observed in code

```text
Laravel controller method + FormRequest index
  -> laravelControllerExecutionDependencies
     -> requestBindingJudgment + bodyJudgment.schema + bodyJudgment.validationEntries
     -> controllerActionSchemaSemanticJudgmentAuthority.judge(...)
        -> InlineSchemaEvidenceJudgment.deriveFormRequestSchema(fields)
        -> ControllerActionSchemaDerivation + exact sourceIdentity + inlineValidationEntries
     -> ControllerActionContractResolver / ControllerActionContract.schema
     -> controller semantic publication: schemaSemanticJudgment.derivation.schema
  -> CLI controllerInvocationManifestCompositionAuthority
     -> routeSyncCliManifestScanOperationFactory.scan(...)
     -> source invocation semantic pipeline
     -> invocation inventory closure
     -> manifest builder preparation
  -> CLI ManifestSerializer reads serialized.request.body.schema
```

The source files directly inspected include:

- `packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts`
- `packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts`
- `packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts`
- `packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts`
- `packages/cli/src/commands/scan.ts`
- `packages/cli/src/manifestScanOperationInterface.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
- `packages/cli/src/generators/ManifestSerializer.ts`

## Trace boundary / unresolved proof

The code confirms the authority call, action contract publication, CLI scan/composition boundaries, and final serializer's request-body schema access. It does **not yet prove exact per-field provenance** from this particular schema judgment through every intermediate invocation/manifest projection into the serialized request body or any IR representation. The current source includes more than one schema projection, so claiming that provenance is closed would be premature. The next implementation should trace the schema-bearing fields through the invocation judgment and manifest builder, identify the exact projection where they are retained, transformed, or dropped, then add a regression test on a representative Laravel FormRequest + inline `$request->validate(...)` example.

## Primitive reasoning assessment

- Removed from this ADT: generic `continueWith<Result>(onEmpty, onPresent)` callbacks.
- Still present upstream: collection cardinality checks over `fields`, `messages`, `attributes`, and `validationEntries` to classify inline schema evidence. This is a domain decision, not yet fully elevated into the source schema model.
- Still present in authority: `switch` over the closed FormRequest-evidence ADT. This dispatch selects the source derivation and is not removed mechanically in this phase.
- No `export function` declaration was added. The runtime authority remains `export const ...: ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile> = Object.freeze(...)`.
- The CLI scan operation and manifest composition remain explicitly interface-driven runtime objects.

## Laravel semantic reference

Laravel's official documentation distinguishes controller route handling from request validation and Form Request validation. A Form Request encapsulates validation/authorization, while inline `$request->validate(...)` is another source of validation evidence. RouteSync should preserve the origin and contribution of those sources instead of inferring schema origin downstream:

- https://laravel.com/framework/docs/routing
- https://laravel.com/framework/docs/validation/latest
- https://laravel.com/framework/docs/13.x/controllers

## Verification boundary

The Phase 2991 audit is a structural source audit. It is not a substitute for the repository typecheck, full tests, or end-to-end manifest/IR provenance test. Dependencies are not installed in this extracted workspace, and the earlier phase report records unresolved imports from retired relation foundations.
