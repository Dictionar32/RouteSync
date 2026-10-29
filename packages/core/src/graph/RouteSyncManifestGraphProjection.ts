import type { RouteSyncManifestFlow } from '../types/upstream/manifest';
import type {
  GraphControllerSurface,
  GraphModelSurface,
  GraphServiceSurface,
  GraphServiceMethodSurface,
  RouteSyncManifestGraphProjectionInterface,
  RouteSyncManifestGraphSurface,
} from './RouteSyncManifestGraphProjectionInterface';
import type { ModelHighLevelContract, ServiceSemanticContract, ControllerActionFlowContract } from '../types/upstream/highLevelContracts';
import type { DependencyTargetReference } from '../types/upstream/semanticReferences';

const projectModel = (model: ModelHighLevelContract): GraphModelSurface => ({
  identity: model.identity,
});

const projectService = (service: ServiceSemanticContract): GraphServiceSurface => ({
  name: service.name,
  methods: Object.freeze(service.methods.items.map((method): GraphServiceMethodSurface => ({ name: method.name }))),
  dependencyTargets: Object.freeze(service.resolvedDependencies.items.map((dependency): DependencyTargetReference => dependency.target)),
});

const projectController = (controller: ControllerActionFlowContract): GraphControllerSurface => ({
  controller: controller.controller,
  action: controller.action,
});


/** Materializes the minimal graph-specific semantic slice from upstream. */
export const routeSyncManifestGraphProjection: RouteSyncManifestGraphProjectionInterface = Object.freeze({
  project: (manifest: RouteSyncManifestFlow): RouteSyncManifestGraphSurface => Object.freeze({
    kind: 'route_sync_manifest_graph_surface' as const,
    models: Object.freeze(manifest.contracts.models.map(projectModel)),
    services: Object.freeze(manifest.contracts.services.map(projectService)),
    controllers: Object.freeze(manifest.contracts.controllers.map(projectController)),
    relations: manifest.relations,
  }),
});
