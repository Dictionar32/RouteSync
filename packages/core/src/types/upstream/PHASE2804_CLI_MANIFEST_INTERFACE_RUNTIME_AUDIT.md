# Phase 2804 — CLI Manifest Interface-First Runtime Audit

## Runtime trace

```text
packages/cli/src/index.ts
  -> createScanCommand(composition) / createSyncCommand(composition)
  -> composition.manifestScanOperation.scan(ControllerInvocationManifestCompositionInput)
  -> RouteSyncCliManifestScanOperationInterface.scan
  -> ControllerInvocationManifestCompositionAuthorityInterface.compose
  -> source-project identity canonicalization
  -> controller source discovery + source document reads
  -> source-document identity binding
  -> source invocation analysis + delivery
  -> invocation judgment authority + inventory closure authority
  -> ManifestBuilderOperationPreparationInterface.prepare(ManifestBuilderInput)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> source AST judgment (complete | blocked)
  -> source-model build judgment (complete | blocked)
  -> SemanticDataflowManifestSurfaceInterface
  -> ManifestBuilderJudgment (manifest_builder_complete | manifest_builder_blocked)
  -> CLI flow/dataflow/graph projections + request-resolution preflight
  -> request-type semantic projection (manifest_projected | manifest_projection_blocked)
  -> contract validation (validated | rejected)
  -> serialization/persistence (complete | rejected)
```

## Existing contract-first assessment

The CLI manifest boundary already has `RouteSyncCliManifestScanOperationInterface` and a frozen, explicitly typed `routeSyncCliManifestScanOperationFactory`. The composition owner already exposes `ControllerInvocationManifestCompositionAuthorityInterface.compose`. Core already owns `ManifestBuilderInterface`, `ManifestBuilderJudgment`, and `LaravelSourceAstPipelineInterface`. The flow projection is also exported as `routeSyncManifestFlowProjection: RouteSyncManifestFlowProjectionInterface = Object.freeze(...)`.

Therefore Phase 2804 adds no parallel upstream contract: existing interfaces cover the responsibilities. CLI scan/sync are presentation/composition adapters; semantic judgments and inventory closure remain core/upstream-owned.

## Interface-first usage example

```ts
const manifestScanOperation: RouteSyncCliManifestScanOperationInterface =
  composition.manifestScanOperation;

const scannedManifest: ControllerInvocationManifest =
  await manifestScanOperation.scan(Object.freeze({
    kind: 'controller_invocation_manifest_composition_input',
    sourceProject,
    routeSelection: Object.freeze({
      kind: 'laravel_route_source_selection_explicit',
      selection: routeSourceSelection,
    }),
  }));

switch (scannedManifest.kind) {
  case 'manifest_builder_complete':
    // Continue only with the authority-produced complete manifest.
    break;
  case 'manifest_builder_blocked':
    // Preserve the exact stage and blocker; do not substitute an empty manifest.
    break;
  case 'controller_invocation_manifest_inventory_rejected':
  case 'controller_invocation_manifest_source_discovery_blocked':
  case 'controller_invocation_manifest_source_project_identity_blocked':
  case 'controller_invocation_manifest_source_documents_blocked':
  case 'controller_invocation_manifest_source_document_identity_rejected':
    // Report the exact composition terminal ADT.
    break;
  default: {
    const exhaustive: never = scannedManifest;
    return exhaustive;
  }
}
```

The example illustrates ADT consumption; existing CLI commands retain richer output handling and exit behavior. Do not replace the domain union with booleans, `any`, generic `Result`, or empty successful collections.

## Export conversion guidance applied to this path

Use the established form when a public runtime operation has an object-shaped contract:

```ts
export interface ExampleOperationInterface {
  readonly run: (input: ExistingDomainInput) => ExistingDomainJudgment;
}

export const exampleOperation: ExampleOperationInterface = Object.freeze({
  run: (input: ExistingDomainInput): ExistingDomainJudgment => existingDomainAuthority.judge(input),
});
```

In the audited manifest path, the CLI scan/sync command factories and manifest scan operation already follow this pattern. Do not mechanically convert every `export function` across the repository: unrelated pure domain functions, value constructors, or internal helpers may have different ownership and compatibility constraints. For each reachable candidate, inspect the current upstream interfaces/ADTs first; add a contract only if a documented ownership gap exists. No generic reasoning primitive was introduced.

## Upstream contracts inspected

- `manifestBuilderInterface.ts`: complete/blocked manifest judgment and separate `source_ast` versus `source_model` blockers.
- `laravelSourceAstPipelineInterface.ts`: source-AST projection boundary and its blocked outcomes.
- `manifest.ts`: canonical manifest and flow projection types.
- `laravelControllerInvocationSemanticJudgmentInventoryInterface.ts`: inventory closure/receipt authority.
- `sourceAstSyntaxParserInterface.ts`: existing syntax-parser ownership considered before any proposed parser contract.

`packages/core/src/types/upstream/collections.ts` remains exactly zero bytes. No collection abstraction was added.

## Verification boundary

Run `npm run audit:phase2804-cli-manifest-interface-runtime` for the structural audit. This audit is not a full TypeScript typecheck, production build, complete test suite, or CLI scan/sync end-to-end execution. The standalone bundled script `scripts/scan-toko-online.cjs` is a separate generated/runtime artifact and is not rebuilt by this source-level phase; it must be handled through its actual bundling workflow rather than hand-edited as if it were source.
