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
  ModelNode,
  ServiceDependency
} from '../../types/semantic';
import {
  ModelServiceMap,
  ModelControllerMap,
  ModelNodeMap
} from '../../types/domain/semanticCollections';

export function assembleServiceGraph(
  modelsMap: ReadonlyMap<string, ModelNode>,
  servicesMap: ReadonlyMap<string, ServiceNode>,
  controllersMap: ReadonlyMap<string, ControllerNode>,
  edges: readonly ServiceDependency[]
): ServiceGraph {
  const models = ModelNodeMap.fromEntries(
    Array.from(modelsMap.entries()).map(([name, model]) => ({ name, model }))
  );
  const services = ModelServiceMap.fromEntries(
    Array.from(servicesMap.entries()).map(([name, service]) => ({ name, service }))
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
