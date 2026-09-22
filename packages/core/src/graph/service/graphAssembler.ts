/**
 * graphAssembler.ts
 *
 * Assembles final immutable ServiceGraph with frozen domain collections.
 *
 * @module core/graph/service
 */

import type {
  ServiceGraph,
  ServiceNode,
  ControllerNode,
  ServiceModelNode,
  ServiceDependency
} from '../../types/semantic';
import {
  ModelServiceMap,
  ModelControllerMap,
  ModelNodeMap
} from '../../types/domain/semanticCollections';
import type { GraphNodeIndex } from './graphNodeIndex';

export function assembleServiceGraph(
  modelsMap: GraphNodeIndex<ServiceModelNode>,
  servicesMap: GraphNodeIndex<ServiceNode>,
  controllersMap: ReadonlyMap<string, ControllerNode>,
  edges: readonly ServiceDependency[]
): ServiceGraph {
  const models = ModelNodeMap.fromEntries(
    Array.from(modelsMap).filter(entry => entry.reference.kind === 'model_reference').map(entry => ({ name: entry.reference.name.value.value, model: entry.value }))
  );
  const services = ModelServiceMap.fromEntries(
    Array.from(servicesMap).filter(entry => entry.reference.kind === 'service_reference').map(entry => ({ name: entry.reference.name.value.value, service: entry.value }))
  );
  const controllers = ModelControllerMap.fromEntries(
    Array.from(controllersMap.entries()).map(([name, controller]) => ({ name, controller }))
  );
  return {
    models,
    services,
    controllers,
    edges: [...edges]
  };
}
