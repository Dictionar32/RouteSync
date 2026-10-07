/** Declarative assembly of immutable ServiceGraph projections. */
import type { ServiceGraph, ServiceNode, ControllerNode, ServiceModelNode, ServiceDependency } from '../../types/semantic';
import type { GraphEdgeRelation } from './graphEdgeRelation';
import { ModelServiceMap, ModelControllerMap, ModelNodeMap } from '../../types/domain/semanticCollections';
import type { GraphNodeIndex, GraphNodeEntry } from './graphNodeIndex';
import type { RelationIndex } from '../../semantic/foundation/relationMembership';
import { relationEqual } from '../../semantic/foundation/relationFoundation';
import { relationProject, relationSelect } from '../../semantic/foundation/relationalSequence';
import type { ModelReference } from '../../types/upstream/semanticReferences';
import { SemanticValueFactory } from '../../types/domain/semanticValues';

export function assembleServiceGraph(
  modelsMap: GraphNodeIndex<ServiceModelNode>,
  servicesMap: GraphNodeIndex<ServiceNode>,
  controllers: RelationIndex<string, ControllerNode>,
  edgeRelations: readonly GraphEdgeRelation[],
  edges: readonly ServiceDependency[],
): ServiceGraph {
  const models = ModelNodeMap.fromEntries<ServiceModelNode>(relationProject(
    relationSelect(
      [...modelsMap],
      (entry): entry is GraphNodeEntry<ServiceModelNode> & { readonly reference: ModelReference } =>
        relationEqual(entry.reference.kind, 'model_reference'),
    ),
    (entry: GraphNodeEntry<ServiceModelNode> & { readonly reference: ModelReference }) => ({ name: entry.reference.name, node: entry.value }),
  ));
  const services = ModelServiceMap.fromEntries<ServiceNode>(relationProject(
    relationSelect([...servicesMap], (entry): entry is GraphNodeEntry<ServiceNode> & { readonly reference: import('../../types/upstream/semanticReferences').ServiceReference } => relationEqual(entry.reference.kind, 'service_reference')),
    (entry: GraphNodeEntry<ServiceNode> & { readonly reference: import('../../types/upstream/semanticReferences').ServiceReference }) => ({ name: SemanticValueFactory.propertyName(entry.reference.name.value.value), service: entry.value }),
  ));
  const controllerEntries = relationProject(controllers, entry => ({ name: SemanticValueFactory.variableName(entry[0]), controller: entry[1] }));
  const controllerFacts = relationSelect(controllerEntries, entry => true);
  const controllerValues = relationProject(controllerFacts, entry => entry);
  const controllerLookup = ModelControllerMap.fromEntries<ControllerNode>(controllerValues);
  return Object.freeze({
    models,
    services,
    controllers: controllerLookup,
    edgeRelations: Object.freeze([...edgeRelations]),
    edges: Object.freeze([...edges]),
  });
}
