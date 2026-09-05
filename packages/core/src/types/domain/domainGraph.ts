import type { RouteManifest } from "./base";
import type { EndpointContract } from "./contracts";
import type { ParsedModel } from "./database";
import type { ParsedRoute } from "./routes";
import {
  ResourceGroupKind,
  type FullCrudResourceGroupDescriptor,
  type ReadOnlyCrudResourceGroupDescriptor,
  type FlexibleCrudResourceGroupDescriptor,
  type SingletonResourceGroupDescriptor,
  type CustomResourceGroupDescriptor,
  type CrudResourceGroupDescriptor,
  type ResourceGroupDescriptor
} from "./resourceGroupDescriptors";

/**
 * Partitioned Subgraphs for Resource Groups.
 *
 * Guarantees that resource groups are categorized into typed subgraphs
 * at the Origin Boundary with 0 downstream re-classification or switch checks.
 */
export interface ResourceGroupGraph<TRoute = ParsedRoute> {
  /** Fine-grained subgraphs */
  readonly fullCrud: readonly FullCrudResourceGroupDescriptor<TRoute>[];
  readonly readOnlyCrud: readonly ReadOnlyCrudResourceGroupDescriptor<TRoute>[];
  readonly flexibleCrud: readonly FlexibleCrudResourceGroupDescriptor<TRoute>[];
  readonly singleton: readonly SingletonResourceGroupDescriptor<TRoute>[];
  readonly custom: readonly CustomResourceGroupDescriptor<TRoute>[];

  /** Unified CRUD subgraph (FullCrud | ReadOnlyCrud | FlexibleCrud) */
  readonly crud: readonly CrudResourceGroupDescriptor<TRoute>[];

  /** Complete ordered list for global sequence preservation */
  readonly all: readonly ResourceGroupDescriptor<TRoute>[];
}

/**
 * Pure Functional Dataflow Partitioning for Resource Groups.
 *
 * Transforms an immutable collection of ResourceGroupDescriptors
 * into a partitioned ResourceGroupGraph in a single O(N) pass.
 * Pure function: Zero `new`, zero object lifecycle ceremony, zero duplicate copying.
 */
export function createResourceGroupGraph<TRoute = ParsedRoute>(
  groups: readonly ResourceGroupDescriptor<TRoute>[]
): ResourceGroupGraph<TRoute> {
  const fullCrud: FullCrudResourceGroupDescriptor<TRoute>[] = [];
  const readOnlyCrud: ReadOnlyCrudResourceGroupDescriptor<TRoute>[] = [];
  const flexibleCrud: FlexibleCrudResourceGroupDescriptor<TRoute>[] = [];
  const singleton: SingletonResourceGroupDescriptor<TRoute>[] = [];
  const custom: CustomResourceGroupDescriptor<TRoute>[] = [];
  const crud: CrudResourceGroupDescriptor<TRoute>[] = [];

  for (const group of groups) {
    switch (group.kind) {
      case ResourceGroupKind.FullCrud:
        fullCrud.push(group);
        crud.push(group);
        break;
      case ResourceGroupKind.ReadOnlyCrud:
        readOnlyCrud.push(group);
        crud.push(group);
        break;
      case ResourceGroupKind.FlexibleCrud:
        flexibleCrud.push(group);
        crud.push(group);
        break;
      case ResourceGroupKind.Singleton:
        singleton.push(group);
        break;
      case ResourceGroupKind.Custom:
        custom.push(group);
        break;
    }
  }

  return Object.freeze({
    fullCrud: Object.freeze(fullCrud),
    readOnlyCrud: Object.freeze(readOnlyCrud),
    flexibleCrud: Object.freeze(flexibleCrud),
    singleton: Object.freeze(singleton),
    custom: Object.freeze(custom),
    crud: Object.freeze(crud),
    all: groups
  });
}

/**
 * Backward compatibility alias for ScannedResourceGroupGraph.
 */
export const ScannedResourceGroupGraph = Object.freeze({
  from: createResourceGroupGraph
});

/**
 * Top-Level Classified Domain Graph (SSOT Data Carrier).
 */
export interface ClassifiedDomainGraph<TRoute = ParsedRoute> {
  readonly manifest: RouteManifest;
  readonly contracts: readonly EndpointContract[];
  readonly resourceGroups: readonly ResourceGroupDescriptor<TRoute>[];
  readonly resourceGroupMap: ReadonlyMap<string, ResourceGroupDescriptor<TRoute>>;
  readonly resourceGroupGraph: ResourceGroupGraph<TRoute>;
  readonly models: readonly ParsedModel[];
}
