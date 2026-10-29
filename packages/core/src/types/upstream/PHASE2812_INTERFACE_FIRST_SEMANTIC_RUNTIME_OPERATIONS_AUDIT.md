# Phase 2812 — Interface-First Semantic Runtime Operations

## Runtime trace

```text
CLI scan / sync
  -> manifestScanOperation.scan(input)
  -> ControllerInvocationManifest composition
  -> ManifestBuilderJudgment
  -> RouteManifestRequestResolutionPreflight
  -> RequestTypeDerivationSemanticPipelineInterface
  -> requestTypeDerivationOperationPreparationFactory.create(...).prepare(...)
  -> RequestTypeDerivationRuntimeExecutionResult
       -> continueForManifestProjection(handlers)
  -> AuthorityBackedRouteManifestTypeLoweringResult
       -> continue(handlers)
  -> RouteManifestProjectionCompositionResult
       -> continue(handlers)
  -> manifest validation / serialization / persistence
```

## Changes

- Replaced the exported standalone assessment-integrity arrow API with `requestTypeDerivationSemanticAssessmentIntegrityOperation`, typed by `RequestTypeDerivationSemanticAssessmentIntegrityOperationInterface` and frozen at runtime.
- Replaced the exported validator-factory arrow API with `requestTypeDerivationSemanticAssessmentValidatorFactory`, typed by `RequestTypeDerivationSemanticAssessmentValidatorFactoryInterface`.
- Migrated semantic authority and pipeline assembly call sites to the named operation objects.
- Replaced `createRequestTypeDerivationAuthority(...)` with the interface-first `requestTypeDerivationAuthorityFactory.create(...)` operation object.
- Preserved the semantic `switch` used to construct the runtime derivation ADT. It owns exhaustive mapping from verified authority assessment to the concrete runtime result; it is not consumer-side reclassification.
- Preserved `continueForManifestProjection` and the downstream lowering/manifest continuation operations.

## Upstream contract assessment

`packages/core/src/types/upstream/requestTypeDerivationInterface.ts` already owns the RequestType derivation policy, semantic assessment ADT, runtime result ADT, and domain continuation. No duplicate upstream semantic authority or generic visitor was introduced.

`packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Verification boundary

The Phase 2812 audit checks source structure and ownership. Syntax transpilation and selected prior structural audits are reported separately. Full repository typecheck, production build, complete test suite, and CLI `scan`/`sync` end-to-end are not claimed unless run successfully.
