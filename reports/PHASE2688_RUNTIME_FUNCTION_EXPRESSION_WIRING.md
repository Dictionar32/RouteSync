# Phase 2688 — Runtime function-expression wiring

## Scope

This phase extends the previous upstream CLI manifest trace by applying both requested TypeScript runtime declaration styles to the real source path:

- `export function prepareManifestBuilderOperation(input: ManifestBuilderInput): ManifestBuilderInterface` remains the explicit manifest-operation preparation entry point.
- `export const manifestBuilderOperationPreparation: ManifestBuilderOperationPreparationInterface = ...` remains the interface-typed composition value.
- `export const projectRouteSyncManifestFlow = (manifest: RouteSyncManifest): RouteSyncManifestFlow => { return ...; }` is now the named, explicitly typed function expression that actually projects the canonical manifest flow.
- `routeSyncManifestFlowProjection` delegates to that exact function expression, and `routeSyncManifestFlowFromManifest` remains the named declaration-style public entry point through the interface.

## Runtime path

`CLI scan/sync -> buildManifestWithInvocationPipeline -> controllerInvocationManifestCompositionAuthority.compose -> validated inventory receipt -> prepareManifestBuilderOperation(input) -> manifest builder -> complete manifest -> routeSyncManifestFlowFromManifest -> routeSyncManifestFlowProjection.project -> projectRouteSyncManifestFlow -> RouteSyncManifestFlow`.

The function expression is not an examples-only sample: the interface authority invokes the exact exported function used by the public flow conversion. A regression assertion compares its output with the interface-backed entry point.

## Verification

Run `node scripts/audits/audit-phase2688-runtime-function-expression-wiring.cjs` and the preceding phase audits. These scripts perform structural source checks. The regression test is added but must be run under Vitest; this workspace has no installed `node_modules`, so this phase does not claim typecheck, test-run, package-build, or end-to-end success.

## Documentation reference

The official TypeScript handbook documents named exported functions and exported interface declarations as distinct module declarations, and its function documentation explains explicit parameter/return typing and function expressions:

- https://www.typescriptlang.org/docs/handbook/modules/reference.html
- https://www.typescriptlang.org/docs/handbook/2/functions.html
