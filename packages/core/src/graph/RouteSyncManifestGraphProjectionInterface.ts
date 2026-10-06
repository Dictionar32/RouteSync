import type { InterfaceDependencyBoundary } from '../types/interfaces/interfaceDependencyBoundary';
import type {
  ServiceSemanticContract,
  ControllerActionFlowContract,
} from '../types/upstream/highLevelContracts';
import type { RouteSyncManifestFlow } from '../types/upstream/manifest';
import type { SemanticRelationGraph } from '../types/upstream/semanticReferences';
import type { ModelDefinition } from '../types/upstream/model';
import type { DependencyTargetReference } from '../types/upstream/semanticReferences';
import type { ControllerName, ActionName } from '../types/upstream/names';
import type { Sequence } from '../types/upstream/collections';

/**
 * Minimal graph-owned model slice. Graph construction needs the canonical
 * model identity and already-resolved semantic model definition; it does not
 * need the complete Laravel model contract.
 */
export interface GraphModelSurface {
  readonly identity: ModelDefinition['identity'];
}

/** Minimal service method slice retained by graph nodes. */
export interface GraphServiceMethodSurface {
  readonly name: import('../types/upstream/names').ActionName;
}

/** Minimal service slice required by graph node/edge construction. */
export interface GraphServiceSurface {
  readonly name: ServiceSemanticContract['name'];
  readonly methods: Sequence<GraphServiceMethodSurface>;
  readonly dependencyTargets: Sequence<DependencyTargetReference>;
}

/** Minimal controller/action slice required by graph node construction. */
export interface GraphControllerSurface {
  readonly controller: ControllerName;
  readonly action: ActionName;
}


/**
 * Downstream-owned graph wiring boundary. The graph compiler receives a
 * construction-free semantic slice plus the canonical relation graph. It does
 * not inherit the whole LaravelSemanticContractCatalog.
 */
export interface RouteSyncManifestGraphProjectionInterface
  extends InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface> {}

export interface RouteSyncManifestGraphSurface {
  readonly kind: 'route_sync_manifest_graph_surface';
  readonly models: Sequence<GraphModelSurface>;
  readonly services: Sequence<GraphServiceSurface>;
  readonly controllers: Sequence<GraphControllerSurface>;
  readonly relations: SemanticRelationGraph;
}

