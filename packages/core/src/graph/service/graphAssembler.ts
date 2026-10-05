/** Declarative assembly of immutable ServiceGraph projections. */
import type { ServiceGraph, ServiceNode, ControllerNode, ServiceModelNode, ServiceDependency } from '../../types/semantic';
import { ModelServiceMap, ModelControllerMap, ModelNodeMap } from '../../types/domain/semanticCollections';
import type { GraphNodeIndex } from './graphNodeIndex';
import type { RelationIndex } from '../../semantic/foundation/relationMembership';
import { relationEqual } from '../../semantic/foundation/relationFoundation';
import { relationProject, relationSelect } from '../../semantic/foundation/relationalSequence';

export function assembleServiceGraph(
  modelsMap: GraphNodeIndex<ServiceModelNode>,
  servicesMap: GraphNodeIndex<ServiceNode>,
  controllers: RelationIndex<string, ControllerNode>,
  edges: readonly ServiceDependency[],
): ServiceGraph {
  const models = ModelNodeMap.fromEntries(relationProject(
    relationSelect([...modelsMap], entry => relationEqual(entry.reference.kind, 'model_reference')),
    entry => ({ name: entry.reference.name.value.value, model: entry.value }),
  ));
  const services = ModelServiceMap.fromEntries(relationProject(
    relationSelect([...servicesMap], entry => relationEqual(entry.reference.kind, 'service_reference')),
    entry => ({ name: entry.reference.name.value.value, service: entry.value }),
  ));
  const controllerEntries = relationProject(controllers, entry => ({ name: entry[0], controller: entry[1] }));
  const controllerFacts = relationSelect(controllerEntries, entry => true);
  const controllerValues = relationProject(controllerFacts, entry => entry);
  const controllerLookup = ModelControllerMap.fromEntries(controllerValues);
  return Object.freeze({
    models,
    services,
    controllers: controllerLookup,
    edges: Object.freeze([...edges]),
  });
}
