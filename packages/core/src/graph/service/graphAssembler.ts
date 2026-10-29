/** Declarative assembly of immutable ServiceGraph projections. */
import type { ServiceGraph, ServiceNode, ControllerNode, ServiceModelNode, ServiceDependency } from '../../types/semantic';
import type { GraphEdgeRelation } from './graphEdgeRelation';
import { ModelServiceMap, ModelControllerMap, ModelNodeMap } from '../../types/domain/semanticCollections';
import type { GraphNodeIndex, GraphNodeEntry } from './graphNodeIndex';
import type { ControllerRegistry } from './controllerRegistry';
import type { ModelReference } from '../../types/upstream/semanticReferences';
import { SemanticValueFactory } from '../../types/domain/semanticValues';

const assembleServiceGraphImplementation = (
  modelsMap: GraphNodeIndex<ServiceModelNode>,
  servicesMap: GraphNodeIndex<ServiceNode>,
  controllers: ControllerRegistry,
  edgeRelations: readonly GraphEdgeRelation[],
  edges: readonly ServiceDependency[],
): ServiceGraph => {
  const models = ModelNodeMap.fromEntries<ServiceModelNode>([...modelsMap]
    .filter((entry): entry is GraphNodeEntry<ServiceModelNode> & { readonly reference: ModelReference } => entry.reference.kind === 'model_reference')
    .map((entry: GraphNodeEntry<ServiceModelNode> & { readonly reference: ModelReference }) => ({ name: entry.reference.name, node: entry.value }))); 
  const services = ModelServiceMap.fromEntries<ServiceNode>([...servicesMap]
    .filter((entry): entry is GraphNodeEntry<ServiceNode> & { readonly reference: import('../../types/upstream/semanticReferences').ServiceReference } => entry.reference.kind === 'service_reference')
    .map((entry: GraphNodeEntry<ServiceNode> & { readonly reference: import('../../types/upstream/semanticReferences').ServiceReference }) => ({ name: SemanticValueFactory.propertyName(entry.reference.name.value.value), service: entry.value }))); 
  const controllerEntries = controllers.entries.map(entry => ({ name: SemanticValueFactory.variableName(entry.name), controller: entry.controller }));
  const controllerLookup = ModelControllerMap.fromEntries<ControllerNode>(controllerEntries);
  return Object.freeze({
    models,
    services,
    controllers: controllerLookup,
    edgeRelations: Object.freeze([...edgeRelations]),
    edges: Object.freeze([...edges]),
  });
}


export interface ServiceGraphAssemblyOperationsInterface {
  readonly assemble: (
    modelsMap: GraphNodeIndex<ServiceModelNode>,
    servicesMap: GraphNodeIndex<ServiceNode>,
    controllers: ControllerRegistry,
    edgeRelations: readonly GraphEdgeRelation[],
    edges: readonly ServiceDependency[],
  ) => ServiceGraph;
}

export const serviceGraphAssemblyOperations: ServiceGraphAssemblyOperationsInterface = Object.freeze({
  assemble: assembleServiceGraphImplementation,
});
