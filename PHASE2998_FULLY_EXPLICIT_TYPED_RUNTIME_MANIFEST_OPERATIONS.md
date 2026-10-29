# Phase 2998 — Fully Explicit Typed Runtime Manifest Operations

## Goal

Continue Phase 2997 by making the route-manifest serialization boundary explicitly interface-owned. Preserve upstream schema evidence as a single semantic owner and ensure terminal ADTs expose follow-up operations rather than forcing consumers to reconstruct outcomes from primitive discriminant checks.

## Implemented

`packages/cli/src/generators/ManifestSerializer.ts` now declares explicit contracts for:

- `ManifestRouteSerializationOperationInterface`
- `ManifestContractSerializationOperationInterface`
- `ManifestSerializationJudgmentFactoryInterface`
- `ManifestRuntimeSerializationOperationInterface`

The concrete operations are frozen interface-typed values:

- `manifestRouteSerializationOperation`
- `manifestContractSerializationOperation`
- `manifestSerializationJudgmentFactory`
- `manifestRuntimeSerializationOperation`
- existing public `manifestSerializationOperations`

The route serializer preserves `route.binding` directly, so `binding.schemaEvidence` remains owned by the route-boundary domain model. The endpoint-contract serializer preserves the existing `request.body.schema` projection. It does not infer schema origin or create a second schema authority.

The public API remains compatible: `manifestSerializationOperations.serialize(manifest)` delegates to the interface-owned runtime operation. The internal helper functions previously represented as standalone typed function values have been moved behind domain-specific operation objects.

## Runtime trace

### Route manifest path

`ControllerBodySemanticJudgment.validationEntries + source identity + FormRequest evidence`
→ `controllerActionSchemaSemanticJudgmentAuthority.judge(...)`
→ `ControllerActionSchemaRouteRequestEvidence` (`schemaOrigin`, `sourceIdentity`, `schema`, `inlineValidationEntries`, `continueToSchema()`)
→ `LaravelControllerActionSemanticKnowledge.schemaEvidence`
→ `ControllerActionRouteCorrelationAuthority.judge(...)`
→ `ControllerActionJudgmentRouteSelection.continueToRouteSchemaEvidence()`
→ `routeDeclarationComposition`
→ `RouteBoundaryOptions.schemaEvidence`
→ `ResolvedRouteBoundaryOptions.schemaEvidence`
→ `RouteBindingContract.schemaEvidence`
→ route semantic flow `binding`
→ `manifestRouteSerializationOperation.serialize(route)` preserves `binding`
→ `manifestRuntimeSerializationOperation.serialize(manifest)`
→ `manifestSerializationOperations.serialize(manifest)`.

### CLI invocation-manifest path

`CLI audit/drift entrypoint`
→ `controllerInvocationManifestBuilder.build(input)`
→ `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)`
→ source-project identity canonicalization
→ Laravel controller source discovery and `SourceFileInventory`
→ source document reads and identity binding
→ PHP invocation semantic pipeline
→ invocation judgment inventory closure
→ `ManifestBuilderJudgment` complete/blocked terminal
→ `ControllerInvocationManifest.continueForDriftAudit(...)`.

These are related but distinct projections. Phase 2998 does not claim a field-by-field schema-evidence bridge into the CLI invocation manifest: that contract is an invocation inventory, while route schema evidence currently flows through the route-boundary/route-manifest path. Joining them without a clear shared domain owner would duplicate knowledge.

## Interface-first usage

```ts
const serialization: ManifestSerializationOperationsInterface = manifestSerializationOperations;
const judgment = serialization.serialize(routeManifest);

const output = judgment.continueWith({
  onComplete: complete => complete.manifest,
  onRejected: rejected => {
    throw new Error(rejected.message);
  },
});
```

The example consumes the serialization ADT through its own continuation operation instead of checking `kind` at the call site.

## Audit

Run from repository root:

```sh
node scripts/audits/audit-phase2998-explicit-runtime-manifest-operations.cjs
```

Result: **12/12 structural checks passed**. Checks cover typed operation interfaces, frozen runtime values, delegation through the public entrypoint, preservation of route binding/schema, terminal ADT operations, interface-first CLI builder, absence of `export function` in the three traced runtime modules, empty `packages/core/src/types/upstream/collections.ts`, and continued absence of the deleted relation-foundation modules.

## Laravel/PHP semantic basis

Laravel routing maps URI/method declarations to closure or controller actions, and dependency injection supplies typed request/model arguments. Request validation can be inline or delegated to Form Request classes. This supports preserving schema origin and source identity as evidence instead of reconstructing it downstream from an empty/non-empty schema payload.

Official references:

- Laravel Routing: https://laravel.com/framework/docs/routing
- Laravel HTTP Requests: https://laravel.com/framework/docs/requests
- Laravel Validation: https://laravel.com/framework/docs/validation/latest
- PHP Type Declarations: https://www.php.net/manual/en/language.types.declarations.php

## Verification limits

- Static audit: 12/12 passed.
- TypeScript syntax transpilation: to be reported separately after the changed serializer is checked.
- Full repository typecheck, tests, CLI E2E, and a real Laravel fixture are not claimed; the workspace has no installed `node_modules` and still contains known references to removed relation-foundation modules outside this change.
- The no-`export function` result applies only to the three explicitly traced runtime modules, not every TypeScript file in the repository.

## Next upstream work

1. Prove the schema-evidence field conservation across route manifest consumers and any downstream IR projection, with a focused fixture.
2. Audit CLI invocation manifest and route manifest as distinct domain projections; introduce a bridge only if an existing upstream domain contract can own the shared evidence without a duplicate source of truth.
3. Continue migrating function-shaped exports only on reachable runtime boundaries and alongside all call sites. Keep grammar traversal control flow where it is genuinely parser mechanics; elevate domain knowledge into ADTs and operations rather than mechanically deleting `if`/`while`.
