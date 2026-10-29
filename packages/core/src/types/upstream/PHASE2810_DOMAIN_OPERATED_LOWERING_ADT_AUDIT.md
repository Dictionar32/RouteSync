# Phase 2810 — Domain-Operated Lowering ADT

## Objective

Move the continuation to the first downstream ADT that classifies the canonical `RequestTypeDerivationRuntimeExecutionResult`. Manifest composition should consume that operation rather than inspect `kind` and repeat outcome dispatch. Keep the actual semantic classification exhaustive where the lowering authority owns it.

## Runtime trace

```text
CLI scan / sync
  -> manifest scan operation
  -> request-resolution preflight
  -> RequestTypeDerivationSemanticPipelineInterface
  -> requestTypeDerivationOperationPreparationFactory.create(...).prepare(...)
  -> AuthorityBackedRouteManifestTypeLoweringResult
       lowered | derivation_not_projectable
       each variant owns continue(handlers)
  -> RouteManifestProjectionAuthority (forwards the same ADT)
  -> RouteManifestProjectionCompositionInterface.project(...)
       result.continue({ lowered, derivation_not_projectable })
       no switch on the lowerer result
  -> RouteManifestProjectionCompositionResult
       manifest_projected | manifest_projection_blocked
       each variant owns continue(handlers)
  -> integratedRouteManifestAuthority (forwards same ADT)
  -> CLI consumer continuation
```

## Changes

1. Added `routeManifestProjectionOutcome.ts` to own the composition payload/ADT contracts, keeping existing public type exports available through `routeManifestProjectionComposition.ts`.
2. Evolved `AuthorityBackedRouteManifestTypeLoweringResult` so both explicit variants carry a concrete `continue` operation. The operation's handler contract is specific to the lowering ADT and returns the known composition ADT; no generic result type is introduced.
3. Replaced the `switch` in `routeManifestProjectionCompositionFactory.project` with `result.continue({ ... })`. The composition consumer no longer re-discriminates the lowerer result.
4. Preserved the exhaustive `switch (derivation.kind)` at the lowering authority, where the upstream semantic outcome is first classified as projectable or blocked. This switch is a domain translation with distinct ADT payloads, not an external consumer dispatch.
5. Preserved exact derivation, source evidence, request-resolution ledger, and semantic types on the blocked result.
6. No new upstream contract was introduced: `requestTypeDerivationInterface.ts` already owns `RequestTypeDerivationRuntimeExecutionResult` and the preparation interface.
7. `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Verification

Run:

```bash
npm run audit:phase2810-domain-operated-lowering-adt
```

The structural audit passed 15/15, and syntax transpilation of five touched TypeScript files reported 0 diagnostics. A full `npx tsc --noEmit` attempt was blocked by the local toolchain/environment: the installed compiler rejected the repository `ES2025` target and reported missing global types plus `node` and `vitest/globals` definitions. Production build, complete test suite, and CLI scan/sync end-to-end were not verified.
