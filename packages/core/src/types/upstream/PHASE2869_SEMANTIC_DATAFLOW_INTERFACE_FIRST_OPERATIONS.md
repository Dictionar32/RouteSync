# Phase 2869 — Semantic Data-Flow Interface-First Domain Operations

## Applied

The existing upstream semantic model now exposes three domain operations as explicitly typed runtime objects:

- `semanticDependency: SemanticDependencyOperationsInterface` with `.create(...)`
- `semanticValueFlow: SemanticValueFlowOperationsInterface` with `.create(...)`
- `semanticEdge: SemanticDataFlowEdgeOperationsInterface` with `.create(...)`
- `semanticIdentifier: SemanticIdentifierOperationsInterface` with `.create(...)`
- `semanticOperation: SemanticOperationOperationsInterface` with `.create(...)`

Their production and test call sites were migrated to `.create(...)`. This removes the direct exported arrow-function API for these five domain operations without introducing a generic relation helper or duplicating the existing semantic data-flow types. The edge still preserves its explicit relationship code and source/target knowledge IDs.

`packages/core/src/types/upstream/collections.ts` remains empty.

## Audit results

Run with:

```sh
npm run audit:phase2869-semantic-dataflow-interface-first-operations
```

The audit checks the named interfaces, interface-first runtime exports, migrated call sites, preserved semantic relationship shape, and empty `collections.ts`. It also reports an inventory of other direct exported arrow initializers in the upstream tree so those are visible rather than silently represented as zero.

## CLI manifest path traced

The existing CLI manifest path remains:

`scan.ts` / `sync.ts` → `manifestScanOperation.scan(...)` → `RouteSyncCliManifestScanOperationFactoryInterface` → `controllerInvocationManifestCompositionAuthority.compose(...)` → source-project canonicalization and discovery → source-document reading and identity binding → invocation semantic pipeline and judgment authority → inventory authority → manifest builder preparation → `ControllerInvocationManifest` terminal judgment → `continueForDriftAudit(...)`.

The current manifest terminal ADT distinguishes complete, blocked, and rejected outcomes. The source-AST projection blocker remains a non-complete result; this change does not reinterpret AST failure as an empty valid manifest.

## Remaining work / limits

This is a focused migration, not a claim that every upstream export has been migrated. The audit inventory is expected to show remaining direct exported arrow initializers elsewhere in the 356-file upstream tree. Each remaining export needs classification against its existing domain contract before migration; value constructors and internal helpers should not receive mechanically duplicated interfaces. No full build, typecheck, or CLI end-to-end test is claimed by this report.
