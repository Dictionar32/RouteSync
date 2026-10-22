# RouteSync Phase 2565 — CLI Manifest Builder Operation Injection

## Root cause

The active CLI composition path still imported and called `prepareManifestBuilderOperation` directly inside `closeInventory`. This bypassed `ControllerInvocationManifestCompositionDependencies`, leaving the terminal inventory-to-manifest transition as a hidden module dependency even though the composition root already modeled discovery, reading, invocation analysis, judgment, and inventory closure as explicit dependencies.

## Implementation

- Added `ManifestBuilderOperationPreparationInterface` beside the upstream `ManifestBuilderInterface` and its `ManifestBuilderInput`.
- Exported `manifestBuilderOperationPreparation` as a named `const` typed by that interface from the upstream manifest-builder wiring.
- Exported the interface and named operation through `@routesync/core`.
- Added the preparation operation to `ControllerInvocationManifestCompositionDependencies`.
- Changed the validated inventory branch to invoke the injected operation and execute the returned parameterless `build()` operation.
- Wired the canonical production composition to the existing upstream preparation operation.
- Kept inventory rejection as a terminal ADT; rejected inventory cannot invoke manifest preparation.
- Added `audit:phase2565-cli-manifest-builder-operation-injection`.

## Active path

`CLI composition -> upstream inventory authority -> validated receipt -> injected ManifestBuilderOperationPreparationInterface -> ManifestBuilderInterface.build() -> source AST projection -> manifest judgment`

The CLI no longer imports the raw preparation function on this path. The implementation does not add semantic foundation/relations dependencies and does not create a second manifest builder.

## Validation boundary

The Phase 2565 structural audit and selected-file syntax transpilation are run separately. Full project typecheck, package build, Vitest, and end-to-end CLI execution are not claimed unless separately executed.
