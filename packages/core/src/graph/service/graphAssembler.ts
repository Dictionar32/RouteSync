/** Declarative assembly of immutable ServiceGraph projections. */
import type { ServiceGraph, ServiceNode, ControllerNode, ServiceModelNode, ServiceDependency } from '../../types/semantic';
import type { GraphEdgeRelation } from './graphEdgeRelation';
import { ModelServiceMap, ModelControllerMap, ModelNodeMap } from '../../types/domain/semanticCollections';
import type { GraphNodeIndex } from './graphNodeIndex';
import type { RelationIndex } from '../../semantic/foundation/relationMembership';
import { relationEqual } from '../../semantic/foundation/relationFoundation';
import { relationProject, relationSelect } from '../../semantic/foundation/relationalSequence';
import { SemanticValueFactory } from '../../types/domain/semanticValues';

export function assembleServiceGraph(
  modelsMap: GraphNodeIndex<ServiceModelNode>,
  servicesMap: GraphNodeIndex<ServiceNode>,
  controllers: RelationIndex<string, ControllerNode>,
  edgeRelations: readonly GraphEdgeRelation[],
  edges: readonly ServiceDependency[],
): ServiceGraph {
  const models = ModelNodeMap.fromEntries(relationProject(
    relationSelect([...modelsMap], entry => relationEqual(entry.reference.kind, 'model_reference')),
    entry => ({ name: entry.reference.name, node: entry.value }),
  ));
  const services = ModelServiceMap.fromEntries(relationProject(
    relationSelect([...servicesMap], entry => relationEqual(entry.reference.kind, 'service_reference')),
    entry => ({ name: SemanticValueFactory.propertyName(entry.reference.name.value.value), service: entry.value }),
  ));
  const controllerEntries = relationProject(controllers, entry => ({ name: SemanticValueFactory.variableName(entry[0]), controller: entry[1] }));
  const controllerFacts = relationSelect(controllerEntries, entry => true);
  const controllerValues = relationProject(controllerFacts, entry => entry);
  const controllerLookup = ModelControllerMap.fromEntries(controllerValues);
  return Object.freeze({
    models,
    services,
    controllers: controllerLookup,
    edgeRelations: Object.freeze([...edgeRelations]),
    edges: Object.freeze([...edges]),
  });
}
