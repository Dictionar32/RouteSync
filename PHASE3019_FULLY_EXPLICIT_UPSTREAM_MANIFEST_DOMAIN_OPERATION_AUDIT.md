# Phase 3019 — Fully Explicit Upstream Manifest Domain Operation

## Purpose

Continue the real CLI → upstream RequestType derivation → manifest projection path by removing the consumer-supplied handler layer from the upstream derivation ADT. The upstream result must own a concrete domain operation, not merely carry a discriminant/payload and require downstream code to interpret it through a visitor.

## Runtime trace audited

```text
CLI scan / sync
  → injected RouteSyncCliManifestScanOperationInterface.scan(input)
  → ControllerInvocationManifestCompositionAuthorityInterface.compose(input)
  → RouteSyncManifestFlowProjection / request-resolution preflight
  → routeManifestProjectionCompositionFactory.create(requestTypeDerivationPipeline).project(preflight, baseURL, version)
  → authorityBackedRouteManifestProjectionFactory
  → authorityBackedRouteManifestTypeLoweringFactory
  → requestTypeDerivationOperationPreparationFactory.create(pipeline, consumer).prepare(semanticInput)
  → RequestTypeDerivationRuntimeExecutionResult.toManifestProjectionDisposition()
  → exhaustive lowering of projectable | not-projectable domain disposition
  → routeSyncManifestLoweringOperations.lower(...)
  → manifest contract validation
  → manifestGeneratorOperations.save(...)
```

## Implementation

Changed active runtime contracts and consumers:

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts`
- `packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts`
- `packages/core/src/index.ts`
- `packages/core/src/types/upstream/semanticDataflowRouteProjection.ts`

The old `continueForManifestProjection(handlers)` contract was replaced by `toManifestProjectionDisposition()`. Each constructed result owns its own concrete operation:

- `projected` returns `request_type_derivation_projectable` with the exact original projectable derivation.
- Every blocked outcome returns `request_type_derivation_not_projectable` with its exact blocked derivation.

The operation has no generic result type, takes no callback handlers, and does not duplicate semantic reasoning. Downstream lowering still exhaustively handles the two domain dispositions with a `never` exhaustiveness check. The full semantic result kinds, source evidence, assessment integrity failures, and request-resolution ledger remain preserved.

Two existing audit scripts (Phase 2811 and 2812) were updated to assert the current operation contract and preserve the workspace's one-byte newline sentinel in `collections.ts`.

## Validation

- Structural audit: see `PHASE3019_AUDIT.json` and `PHASE3019_AUDIT.log`.
- TypeScript syntax transpilation: see `PHASE3019_SYNTAX_CHECK.json`.
- Targeted/full typecheck and behavioral CLI tests are reported separately; a syntax pass is not a typecheck or end-to-end proof.

## Remaining limitations

This phase improves one reachable upstream ADT boundary; it does not claim that every exported callable across the repository has been converted to interface-first operation objects. The CLI's full manifest-field provenance and production RequestType reasoning/verifier completeness remain separate audit obligations. No removed relation foundation was restored or re-exported. The route projection no longer imports the deleted `relationalSequence` type; its traversal helpers are typed from the concrete route/controller domain contracts.
