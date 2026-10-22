# Phase 2679 — CLI Manifest Runtime Preparation Boundary

## Scope

Follow-up audit of the real upstream composition loader and the CLI-to-manifest consumer path. The change targets a runtime capability omitted by the prior loader shape guard.

## Trace

`ROUTESYNC_UPSTREAM_COMPOSITION_MODULE` → `loadRouteSyncStandaloneComposition` → `isRequestTypeDerivationSemanticPipelineComposition` → canonical upstream assembler → `scan`/`sync` → source manifest composition → complete manifest → `routeManifestRequestResolutionPreflight.evaluate(completeManifest)` → authority-backed projection → manifest write only for `manifest_projected`.

## Root cause and correction

The canonical `RequestTypeDerivationSemanticPipelineCompositionInterface` requires `preparation.prepare`, but the CLI runtime shape guard previously checked reasoning, verifier, decision, authority and integrity without checking that preparation was present and callable. A malformed host composition could pass the loader boundary and fail later, away from the source of the defect.

The loader now checks that `preparation` is an object and `preparation.prepare` is a function before accepting the composition. Regression coverage rejects both `{ preparation: {} }` and `preparation: undefined`. The check does not claim the function's semantics are correct; preparation output still needs semantic verification downstream.

## Interface-first runtime example

```ts
export const requestTypeDerivationSemanticComposition:
  RequestTypeDerivationSemanticPipelineCompositionInterface = Object.freeze({
    contract: requestTypeDerivationContract,
    preparation: productionPreparation,
    reasoning: productionReasoning,
    verifier: completeProofVerifier,
    decision: productionDecision,
    authority: sourceBoundAuthority,
    integrity: completeIntegrityValidator,
  });
```

This is the host export shape consumed by the runtime loader. The names above are host-provided capabilities, not implementations supplied by this repository. The repository's diagnostic composition intentionally fails closed at unsupported decision/authority/integrity stages and must not be presented as production complete.

## Validation

- Phase 2676 source audit: 20/20 passed.
- Phase 2677 source audit after added loader check: 16/16 passed.
- Phase 2679 source audit: run separately and record result in the delivery note.
- Vitest, full TypeScript build, and Laravel fixture end-to-end execution are not claimed unless their dependencies and fixtures are available and the commands complete.

## Remaining production blocker

This fix closes the malformed-preparation shape gap; it does not implement the remaining canonical semantic-law decision, source-bound authority, and integrity capabilities. CLI must remain fail-closed until a host supplies and independently verifies those implementations.
