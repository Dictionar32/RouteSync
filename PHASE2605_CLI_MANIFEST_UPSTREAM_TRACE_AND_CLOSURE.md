# RouteSync Phase 2605 — CLI Manifest / Upstream Trace and Closure

## Goal

Trace the real CLI → manifest → upstream semantic pipeline path in the supplied workspace, repair the stale structural audit, and keep the architecture honest: a passing wiring audit is not evidence that the production semantic producer exists.

## Actual path

```text
standalone CLI entry (packages/cli/src/index.ts)
  → loadRouteSyncStandaloneComposition(ROUTESYNC_UPSTREAM_COMPOSITION_MODULE)
  → host export: requestTypeDerivationSemanticComposition
  → isRequestTypeDerivationSemanticPipelineComposition (identity/capability shape gate)
  → createProgramFromSemanticComposition
  → composeRouteSyncCliUpstream
      ├─ controllerInvocationManifestCompositionAuthority
      └─ assembleRequestTypeDerivationProductionPipeline(host capabilities)
  → routesync_cli_upstream_composition_available
  → createProgram(exact resolved composition)
  → scan/sync command dispatch
```

The manifest authority is owned by `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` and its explicit contract in `controllerInvocationManifestCompositionInterface.ts`. It performs project-root identity canonicalization, controller discovery, source reading, source identity binding, source pipeline delivery, invocation judgment/inventory authority, and manifest-builder preparation through explicit dependencies.

The request-type pipeline contract and assembler are owned upstream in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` and `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts`.

## Root cause still open

The repository does not provide a concrete production composition bundle implementing source-bound reasoning, a complete independent verifier for all 34 canonical derivation laws, decision, authority, and integrity. The executable therefore requires a host module and intentionally fails closed if it is absent or invalid. Do not manufacture a fake producer, infer proof closure from the inventory, or fall back to legacy `RequestType[]` semantics merely to make the CLI run.

## Change in this phase

The Phase 2598 audit had drifted from the current implementation: it expected the old `requestTypeDerivationSemanticPipelineResolution.resolve(...)` call and old `cli_upstream_composition_missing` arm inside `packages/cli/src/index.ts`. The current entrypoint correctly delegates the external module boundary to `standaloneCompositionLoader.ts`, whose closed ADT uses `composition_module_missing` / `composition_module_invalid` / `composition_module_loaded`. The audit now checks that actual path and separately verifies the canonical core missing-composition ADT.

## Boundary findings

- The program factory requires the complete CLI composition; no uncomposed program singleton remains.
- The available program is constructed from the exact composition returned by the upstream assembler.
- The manifest composition is explicit and source-correlated; source acquisition failures are represented as closed judgments rather than silently omitted.
- The standalone executable is not self-sufficient until a real host-owned semantic composition is shipped or supplied.
- This phase does not claim full typecheck, Vitest, package build, or Laravel integration validation.

## Validation performed

- Phase 2596 executable gate: 6/6 passed.
- Phase 2597 root-cause audit: 6/6 passed.
- Phase 2598 composition closure: 7/7 passed after aligning the stale assertion with the current loader ADT.
- Phase 2600 manifest preflight public contract: 6/6 passed.
- Phase 2605 CLI manifest/upstream trace: 9/9 passed.
