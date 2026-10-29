# Phase2981 — Fully Explicit Simplicity: Graph Controller Runtime Operations

## Objective

Move controller registry knowledge out of the deleted generic relation-membership foundation and into the graph domain. Expose the runtime graph-builder factory through an explicitly typed, frozen operation object, and update the CLI consumer.

## Runtime trace

```text
PHP / Laravel route and controller evidence
        ↓
Upstream route/controller semantic contracts
        ↓
CLI scan composition
        ↓
serviceGraphBuilderFactory.createBuilder()
        ↓
ServiceGraphBuilder
        ├── GraphNodeIndex: model/service references
        ├── ControllerRegistry: controller/action identity and action reconciliation
        └── GraphEdgeRelationSink: graph-edge evidence
        ↓
manifestGraphCompilationOperations.compile(surface, builderContext)
        ↓
serviceGraphAssemblyOperations.assemble(...)
        ↓
ServiceGraph
        ↓
manifest / IR consumers
```

## Interface-first runtime example

```typescript
export interface ServiceGraphBuilderFactoryInterface {
  readonly createBuilder: () => ServiceGraphBuilderInterface;
  readonly createAssembly: () => ServiceGraphAssemblyInterface;
}

export const serviceGraphBuilderFactory: ServiceGraphBuilderFactoryInterface = Object.freeze({
  createBuilder: () => new ServiceGraphBuilder(),
  createAssembly: () => new ServiceGraphBuilder(),
});
```

The CLI now calls `serviceGraphBuilderFactory.createBuilder()`. Controller registration and action deduplication are owned by the graph-specific `ControllerRegistry` operation contract, not by a generic relation foundation.

## What changed

- Added `graph/service/controllerRegistry.ts` with explicit `ControllerRegistry`, `ControllerLookup`, and `ControllerRegistryOperationsInterface` contracts.
- Migrated `ServiceGraphBuilder` controller registration and lookup to `ControllerRegistry`.
- Migrated manifest graph controller action reconciliation to `registry.registerAction(...)`.
- Migrated graph assembly to consume typed controller entries.
- Replaced the exported graph-builder factory arrows with `serviceGraphBuilderFactory: ServiceGraphBuilderFactoryInterface = Object.freeze(...)` and updated CLI/core exports and focused graph tests.
- Did not restore `relationMembership.ts`, `relationalSequence.ts`, or `semanticRelations.ts`.
- Left `packages/core/src/types/upstream/collections.ts` empty.

## Remaining blockers / next trace

1. `manifestGraphCompiler.ts` still uses the deleted `relationalSequence` module for Sequence folding/projection. The next change should identify the existing upstream Sequence ADT owner and move its operations there; do not create another generic relation foundation.
2. The current `ServiceGraphBuilder` model/service `Lookup` types refer to the intentionally empty `upstream/collections.ts`. The owning typed lookup ADT boundary must be located before repairing that build path.
3. Build-log imports in other compiler, upstream, CLI, manifest and IR consumers remain unresolved. Migrate each consumer into its domain-specific interface/ADT rather than restoring deleted relation modules or bulk-replacing them with primitive branches.
4. Continue replacing runtime exports on the actual upstream → CLI → manifest → IR execution path with named, typed operation objects. Do not mechanically convert unrelated private helpers or test-only functions.

## Verification boundary

The phase audit is structural only. It does not claim a successful full workspace build or test suite. Run `npm run audit:phase2981-graph-runtime-controller-operations` from the workspace root to verify the 10 structural checks.
