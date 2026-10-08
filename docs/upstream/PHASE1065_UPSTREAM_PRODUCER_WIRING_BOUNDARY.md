# Phase 1065 — Upstream Producer → Wiring Boundary

## Purpose

The CLI wiring layer must consume the upstream manifest producer through `ManifestBuilderInterface`, not through the concrete `StaticLaravelScanner` facade.

## Boundary

```text
Laravel route/controller/request/resource/model/relation/schema evidence
        ↓
upstream scanner + semantic construction
        ↓
ManifestBuilderInterface.build(SourceProjectIdentity)
        ↓
RouteSyncManifest / RouteSyncManifestFlow
        ↓
+---------------- downstream wiring ----------------+
| graph: InterfaceDependencyBoundary<...>            |
| dataflow: SemanticDataflowRuntimeBoundary          |
| IR: DataFlowProjectionInterface                    |
+----------------------------------------------------+
```

`DataFlowInterface` remains domain-neutral. It is not a scanner contract and does not encode Laravel route/controller/model/resource/schema policy.

`InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned: the consumer/wiring side declares how it projects an upstream value. Upstream producer contracts do not import it.

## Repair

`packages/cli/src/commands/scan.ts` and `sync.ts` now consume `manifestBuilder.build(sourceProject)` instead of `StaticLaravelScanner.create(...).executeUpstream()`. This removes a concrete upstream facade dependency from CLI wiring while retaining `StaticLaravelScanner` as an upstream compatibility facade for existing producer/test consumers.

## Ecommerce evidence

The fixture remains evidence for distinct lanes:

- route declarations establish endpoint evidence;
- controller/request code establishes input/value-flow evidence;
- Eloquent model relations and migration foreign keys establish structural/provenance relations;
- resources establish response/value projections;
- graph consumes structural manifest flow;
- semantic dataflow computes closure before downstream IR projection.

## External alignment

The separation matches the generic-interface pattern documented by MLIR and the separation of generic dataflow solving from source/sink/barrier configuration documented by CodeQL. Laravel's Request and Resource documentation likewise places HTTP input and resource transformation semantics in framework-specific layers rather than in a generic dataflow execution contract.
