# Phase 2992 — Source-Owned Inline Schema Evidence and Runtime Trace

## Scope

This phase continues from Phase 2991 by tracing the schema-evidence decision back to the controller-body source authority. The previous authority inferred inline evidence by inspecting four schema collections (`fields`, `messages`, `attributes`, and `validationEntries`). That duplicated knowledge already present in the controller body's source validation evidence.

## Implementation

- `ControllerBodySemanticJudgment` now carries `inlineSchemaEvidence`, a closed domain discriminant: `no_inline_validation_evidence` or `inline_validation_evidence`.
- `controllerBodySemanticJudgmentAuthority` classifies this once from the source body's validation evidence and publishes the discriminant alongside the canonical schema and source identity.
- `ControllerActionSchemaSemanticJudgmentAuthorityInterface.judge` receives that source-owned evidence explicitly.
- `controllerActionSchemaSemanticJudgmentAuthority` consumes the discriminant to construct an operation-bearing `InlineSchemaEvidenceJudgment`. Its `deriveFormRequestSchema(fields)` operation produces either a FormRequest-only schema or a combined FormRequest + inline-validation schema.
- The previous `evidenceCollections.every(entries => entries.length === 0)` check has been removed from the schema authority. The downstream authority no longer reconstructs evidence presence from schema collection sizes.
- Runtime authority remains interface-first: `export const controllerActionSchemaSemanticJudgmentAuthority: ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile> = Object.freeze({...})`.

## Runtime trace established from source

```text
ControllerMethodAst.body.validations
  -> controllerBodySemanticJudgmentAuthority.judge(...)
     -> source-owned inlineSchemaEvidence + RouteSchemaPayload + validationEntries
  -> laravelControllerExecutionDependencies
     -> controllerActionSchemaSemanticJudgmentAuthority.judge({
          requestEvidence,
          inlineSchema,
          inlineSchemaEvidence,
          inlineValidationEntries,
          sourceIdentity
        })
     -> ControllerActionSchemaSemanticJudgment.derivation.schema
  -> resolveControllerActionContract(...)
     -> ControllerActionContract.schema + schemaSemanticJudgment
  -> controller action semantic publication
     -> semantic.schema = schemaSemanticJudgment.derivation.schema
```

The source files establishing these edges are:

- `packages/core/src/types/upstream/controllerBodySemanticJudgmentInterface.ts`
- `packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts`
- `packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts`
- `packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts`
- `packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts`
- `packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts`

## CLI / manifest trace boundary

The CLI entry path is separately explicit:

```text
controllerInvocationManifestBuilder.build(input)
  -> routeSyncCliManifestScanOperationFactory.create(authority).scan(input)
  -> ControllerInvocationManifestCompositionAuthorityInterface.compose(input)
  -> source discovery / source reads / source identity binding
  -> phpSourceInvocationSemanticPipelineOperations
  -> invocation semantic judgment preparation and inventory closure
  -> manifest builder preparation
  -> ControllerInvocationManifest terminal result
```

Relevant files:

- `packages/cli/src/manifestScanOperationInterface.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
- `packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts`
- `packages/cli/src/commands/scan.ts`

`packages/cli/src/generators/ManifestSerializer.ts` preserves `serialized.request.body.schema` when serializing a `RouteManifest` contract. However, the code inspected in this phase does **not** establish a direct field-by-field provenance edge from this particular controller-action schema judgment through the controller-invocation manifest result into that route-manifest serializer or into IR. These are distinct projections, and the exact bridge still needs a focused trace/test. This phase does not claim end-to-end manifest/IR closure.

## Primitive-reasoning audit

- Removed: downstream reclassification by checking the lengths of four schema collections.
- Remaining source-bound recognition: `input.body.validations.length === 0` classifies raw body syntax evidence once at the body semantic authority. This is a source boundary observation, not a repeated downstream schema decision; it is still a primitive check and is recorded rather than hidden.
- Remaining domain dispatch: the request-evidence ADT is switched on in the schema authority. This phase does not claim all `switch`, `if`, ternary, `??`, equality, or primitive checks are removed from the complete runtime path.
- The result ADT has a schema-domain operation (`deriveFormRequestSchema`) instead of a generic `continueWith<Result>(onEmpty, onPresent)` callback.
- No `export function` declaration was introduced in the changed runtime path. Unrelated helpers and exports were not mechanically rewritten.

## Laravel semantic basis

Laravel distinguishes route/controller dispatch from request validation. Form Request validation and inline `$request->validate(...)` are different sources of validation evidence; RouteSync should preserve the source of that evidence and make its merge policy explicit upstream.

Official references:

- https://laravel.com/framework/docs/routing
- https://laravel.com/framework/docs/validation/latest
- https://laravel.com/framework/docs/13.x/controllers

## Verification boundary

The phase audit verifies the source contracts and wiring edges described above. It does not substitute for a full repository typecheck, full test suite, or end-to-end Laravel fixture test. This extracted workspace does not have the project's local `node_modules`/Vitest installation, and previous phase notes report unresolved imports from retired relation foundations. The next high-value test is a Laravel fixture containing both a Form Request and inline `$request->validate(...)`, with assertions for derivation origin, source identity, preserved validation entries, serialized manifest schema, and IR projection.
