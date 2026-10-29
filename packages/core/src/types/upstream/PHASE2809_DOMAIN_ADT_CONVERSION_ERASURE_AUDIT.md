# Phase 2809 — Domain ADT Conversion Erasure Audit

## Objective

Remove ADT conversions that merely rename an existing semantic outcome and carry no new evidence, authority decision, or domain behavior. Preserve the explicit ADT and its domain-owned follow-up operation.

## Runtime trace

```text
CLI scan / sync
  -> manifest scan operation
  -> request-resolution preflight
  -> RequestType derivation preparation / semantic pipeline
  -> routeManifestTypeLoweringAuthority
       RequestTypeDerivationRuntimeExecutionResult
       -> lowered | derivation_not_projectable
  -> routeManifestProjectionAuthority
       now forwards the same lowering ADT without conversion
  -> routeManifestProjectionComposition
       materializes manifest_projected | manifest_projection_blocked
       and attaches the variant-owned continue operation
  -> integratedRouteManifestAuthority
       now forwards the composition ADT unchanged
  -> consumer continues through the outcome-owned operation
```

## Changes

1. `AuthorityBackedRouteManifestProjectionResult` is now an alias of the existing `AuthorityBackedRouteManifestTypeLoweringResult`. The projection wrapper no longer re-labels `lowered | derivation_not_projectable` as `projected | not_projectable`.
2. `routeManifestProjectionCompositionFactory` consumes the original lowerer ADT names. It still performs the domain-specific work that differs by outcome: build a `RouteManifest` for a verified projection or preserve the derivation failure.
3. `IntegratedRouteManifestAuthorityResult` now aliases `RouteManifestProjectionCompositionResult`, retaining the continuation-bearing ADT instead of duplicating it as `integrated_manifest | manifest_derivation_blocked`.
4. `integratedRouteManifestAuthority` delegates directly and evaluates `routeManifestRequestResolutionPreflight` before composition. This also corrects its input boundary: composition requires a preflight packet, not a raw `RouteSyncManifest`.
5. No generic visitor, generic `<T>`, `as never`, or new upstream contract was added.

## Existing upstream contract review

`packages/core/src/types/upstream/requestTypeDerivationInterface.ts` already owns `RequestTypeDerivationRuntimeExecutionResult` and the preparation/pipeline interfaces. This phase does not duplicate those semantic outcomes in upstream. The lowerer remains the downstream boundary that translates the verified `projected` derivation into a manifest-specific lowering outcome.

`packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Verification

Run:

```bash
npm run audit:phase2809-domain-adt-conversion-erasure
```

This is a structural audit. Full TypeScript typecheck, production build, complete test suite, and CLI scan/sync end-to-end execution are not claimed unless run separately.
