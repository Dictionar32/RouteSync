# Phase 2808 — Domain-operated Manifest ADT

## Objective

Correct the prior workaround where an external operation switched on `RouteManifestProjectionCompositionResult.kind`. The result ADT now carries a domain-specific `continue` operation on each concrete variant. The variant that is constructed owns the continuation; CLI consumers invoke the operation without inspecting the discriminant.

## Runtime path

```text
CLI scan / sync
  -> routeManifestProjectionCompositionFactory.create(pipeline).project(preflight, baseURL, version)
  -> RouteManifestProjectionCompositionResult variant
      -> manifest_projected.continue(handlers)
      -> manifest_projection_blocked.continue(handlers)
  -> CLI success materialization OR explicit terminal failure with derivation
```

The `continue` operation is deliberately domain-specific. It is not generic over arbitrary results and is not a general-purpose fold/reasoning primitive. The blocked handler returns `never`, so a blocked derivation cannot produce a `RouteManifest`.

## Root-cause reduction

- Removed `routeManifestProjectionCompositionOutcomeOperations.consume` and its external `switch` dispatcher.
- Added variant-owned continuation operations to the manifest composition ADT.
- Updated CLI `scan` and `sync` to invoke `routeManifestProjection.continue(...)`.
- Converted `createRequestTypeDerivationOperationPreparation` into the interface-first frozen object `requestTypeDerivationOperationPreparationFactory.create(...)`.
- Kept the semantic assessment `switch` inside its owning upstream preparation operation, where it performs exhaustive ADT elimination rather than CLI policy dispatch.
- No new upstream semantic ADT was introduced; existing `RequestTypeDerivationRuntimeExecutionResult` remains the authority-owned derivation contract.
- `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Contract examples

```ts
const resolvedManifest = routeManifestProjection.continue({
  manifest_projected: outcome => outcome.manifest,
  manifest_projection_blocked: outcome => {
    reportBlocked(outcome.derivation);
    process.exit(1);
  },
});
```

```ts
const operationPreparation = requestTypeDerivationOperationPreparationFactory.create(
  pipeline,
  judgmentGroupsConsumer,
);
const derivation = operationPreparation.prepare(preflight.semanticInput);
```

## Verification boundaries

The phase-specific structural audit checks the continuation operation, both CLI call sites, interface-first factory usage, absence of the removed dispatcher, absence of generic dispatch/type assertions, and empty `collections.ts`. This audit is not a substitute for a full TypeScript typecheck, production build, complete test suite, or CLI end-to-end run.
