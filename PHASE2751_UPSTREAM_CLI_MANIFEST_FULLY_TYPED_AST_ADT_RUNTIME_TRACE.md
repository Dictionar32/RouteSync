# Phase 2751 — Fully Typed AST/ADT and Upstream CLI Manifest Runtime Trace

## Goal

Establish and audit the concrete CLI-to-manifest runtime path. Runtime entrypoints on this path use named TypeScript interfaces and exported, interface-typed operation objects (`export const name: Interface = Object.freeze({ ... })`) rather than exported free functions or exported inferred arrow-function declarations.

## Runtime trace (current source)

```text
CLI executable / host-owned semantic composition
  -> routeSyncCliProgramFactory.createFromSemanticComposition(...)
  -> routeSyncCliUpstreamCompositionFactory.compose(manifestAuthority, semanticComposition)
  -> requestTypeDerivationProductionPipelineAssembler.assemble(semanticComposition)
       rejected -> routesync_cli_upstream_semantic_assembly_rejected (ADT)
       assembled -> routesync_cli_upstream_composition_available (ADT)
  -> routeSyncCliManifestScanOperationFactory.create(manifestAuthority)
  -> ControllerInvocationManifestCompositionAuthorityInterface.compose(input)
  -> canonicalize source-project root identity
  -> discover complete controller source inventory
  -> read source documents and bind each result to requested source identity
  -> PHP source invocation semantic pipeline / source-bound judgments
  -> inventory authority closes source-to-judgment correspondence
       rejected -> controller_invocation_manifest_inventory_rejected (ADT)
       validated receipt -> manifestBuilderOperationPreparation.prepare(input).build()
  -> laravelSourceAstPipelineFactory.create(...).execute()
       blocked AST projection -> manifest_builder_blocked (ADT)
       complete AST projection -> completeLaravelSourceModelBuilder.build(...)
  -> dataflow manifest surface + resource-group capability authority
  -> manifest_builder_complete / RouteSyncManifest
  -> routeSyncManifestFlowProjection.project(manifest)
```

The separate authority-backed RouteManifest projection route is:

```text
routeManifestProjectionOperations.project(preflight, semanticPipeline)
  -> authorityBackedRouteManifestProjectionFactory.create(semanticPipeline)
  -> authorityBackedRouteManifestTypeLoweringFactory.create(semanticPipeline)
  -> judgment-bearing projected | not_projectable result
  -> routeManifestProjectionCompositionFactory
  -> integratedRouteManifestAuthorityFactory
  -> integrated_manifest | manifest_derivation_blocked
```

These are related manifest paths but not interchangeable claims: the authority-backed projection is not assumed to run on every default CLI scan/sync invocation.

## AST / ADT model

- **AST input:** source documents flow through the PHP source AST pipeline. The complete projection exposes an AST completion object containing scanned model, resource, request, provider, service, and response definitions.
- **Typed semantic handoff:** `completeLaravelSourceModelBuilder.build` receives an explicitly tagged input with `ast`, source identity, and typed semantic seeds.
- **ADT terminal outcomes:** discovery blocked, source read blocked, source identity rejected, inventory rejected, AST projection blocked, source-model build blocked, manifest builder blocked, and manifest builder complete are tagged outcomes. They must not be flattened into an empty manifest or converted into an inferred success.
- **Authority boundary:** CLI discovers and wires; core owns semantic judgment, inventory closure, AST interpretation, source-model construction, and manifest build.
- **Fail-closed rule:** semantic composition assembly rejection, inventory rejection, or incomplete AST/source-model evidence must preserve its discriminant and blocker data.

## Interface-first usage example

```ts
export interface ManifestScanOperationInterface {
  readonly scan: (input: ManifestScanInput) => Promise<ManifestScanJudgment>;
}

export interface ManifestScanOperationFactoryInterface {
  readonly create: (authority: ManifestCompositionAuthorityInterface) => ManifestScanOperationInterface;
}

export const manifestScanOperationFactory: ManifestScanOperationFactoryInterface = Object.freeze({
  create: (authority: ManifestCompositionAuthorityInterface): ManifestScanOperationInterface =>
    Object.freeze({
      scan: (input: ManifestScanInput): Promise<ManifestScanJudgment> => authority.compose(input),
    }),
});
```

For a stateless, named runtime capability, prefer a method-bearing object interface (`readonly scan: (...) => ...`) and an exported value explicitly annotated with that interface. A function type can still be expressed as an interface call signature, but it is not an object-shaped operation registry.

## Verification

Run:

```sh
npm run audit:phase2751-upstream-cli-manifest-runtime-trace
npm run audit:phase2750-upstream-cli-manifest-interface-operations
npm run audit:phase2703-upstream-runtime-interface-operations
```

The audit is a source-structure guard, not a substitute for `tsc --noEmit`, unit tests, build, or CLI end-to-end execution. Those broader checks remain unverified in this workspace because dependencies are not installed.

## Upstream references

- TypeScript interfaces and call signatures: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript structural type compatibility: https://www.typescriptlang.org/docs/handbook/type-compatibility
