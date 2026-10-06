import type { RouteSyncManifestFlow } from '../types/upstream/manifest';
import type {
  GraphControllerSurface,
  GraphModelSurface,
  GraphServiceSurface,
  GraphServiceMethodSurface,
  RouteSyncManifestGraphProjectionInterface,
  RouteSyncManifestGraphSurface,
} from './RouteSyncManifestGraphProjectionInterface';
import type { Sequence } from '../types/upstream/collections';
import type { ModelHighLevelContract, ServiceSemanticContract, ControllerActionFlowContract } from '../types/upstream/highLevelContracts';
import type { DependencyTargetReference } from '../types/upstream/semanticReferences';

const sequenceMap = <T, U>(
  items: Sequence<T>,
  map: (item: T) => U,
): Sequence<U> => items.kind === 'empty'
  ? { kind: 'empty' }
  : { kind: 'cons', head: map(items.head), tail: sequenceMap(items.tail, map) };

const projectModel = (model: ModelHighLevelContract): GraphModelSurface => ({
  identity: model.identity,
});

const projectService = (service: ServiceSemanticContract): GraphServiceSurface => ({
  name: service.name,
  methods: sequenceMap(service.methods.items, (method): GraphServiceMethodSurface => ({ name: method.name })),
  dependencyTargets: sequenceMap(service.resolvedDependencies.items, (dependency): DependencyTargetReference => dependency.target),
});

const projectController = (controller: ControllerActionFlowContract): GraphControllerSurface => ({
  controller: controller.controller,
  action: controller.action,
});


/** Materializes the minimal graph-specific semantic slice from upstream. */
export const routeSyncManifestGraphProjection: RouteSyncManifestGraphProjectionInterface = Object.freeze({
  project: (manifest: RouteSyncManifestFlow): RouteSyncManifestGraphSurface => Object.freeze({
    kind: 'route_sync_manifest_graph_surface' as const,
    models: sequenceMap(manifest.contracts.models, projectModel),
    services: sequenceMap(manifest.contracts.services, projectService),
    controllers: sequenceMap(manifest.contracts.controllers, projectController),
    relations: manifest.relations,
  }),
});

export const routeSyncManifestGraphSurfaceFromFlow = (
  manifest: RouteSyncManifestFlow,
): RouteSyncManifestGraphSurface => routeSyncManifestGraphProjection.project(manifest);
