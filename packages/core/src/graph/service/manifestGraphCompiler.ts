/** Declarative graph compilation from canonical route/source relations. */
import type {
  RouteSyncManifestGraphSurface,
  GraphServiceSurface,
  GraphServiceMethodSurface,
  GraphModelSurface,
  GraphControllerSurface,
} from '../RouteSyncManifestGraphProjectionInterface';
import type { ServiceGraph, ServiceNode, ControllerNode, ServiceModelNode, ServiceDependency } from '../../types/semantic';
import { createGraphEdgeRelation, type GraphEdgeRelation } from './graphEdgeRelation';
import { buildModelNode, buildServiceNode, buildControllerNode } from './nodeFactories';
import type { ModelReference, ServiceReference, DependencyTargetReference } from '../../types/upstream/semanticReferences';
import { isStructuralSemanticRelation } from '../../types/upstream/semanticReferences';
import { GraphNodeIndex } from './graphNodeIndex';
import { createControllerNodeName, createServiceNodeName } from '../../types/semantic/nominalVocabulary';
import type { RelationIndex } from '../../semantic/foundation/relationMembership';
import { relationIndexLookup, relationIndexAdd } from '../../semantic/foundation/relationMembership';
import { relationContains } from '../../semantic/foundation/relationMembership';
import { relationEqual } from '../../semantic/foundation/relationFoundation';
import { relationOptionFold, relationProject, relationVariantFold, relationFold } from '../../semantic/foundation/relationalSequence';
import { relationResolve } from '../../semantic/foundation/relationFoundation';
import { projectStructuralSemanticRelationToGraphEdge } from './structuralSemanticRelationProjection';
import type { Sequence } from '../../types/upstream/collections';

export interface GraphBuilderContext {
  readonly modelsMap: GraphNodeIndex<ServiceModelNode>;
  readonly servicesMap: GraphNodeIndex<ServiceNode>;
  readonly controllersIndex: RelationIndex<string, ControllerNode>;
  buildGraph(): ServiceGraph;
  setController(name: string, controller: ControllerNode): void;
  addGraphEdgeRelation(relation: GraphEdgeRelation): void;
}

const sequenceToArray = <T>(items: Sequence<T>): readonly T[] => relationVariantFold(
  items,
  'empty',
  cons => [cons.head, ...sequenceToArray(cons.tail)],
  () => [],
);

const serviceMethods = (service: GraphServiceSurface): readonly import('../../types/upstream/names').ActionName[] => relationProject(
  sequenceToArray(service.methods),
  (method: GraphServiceMethodSurface) => method.name,
);

const serviceDependencies = (service: GraphServiceSurface): readonly ServiceDependency[] => {
  const from: ServiceReference = { kind: 'service_reference', name: { kind: 'class_name', value: { kind: 'string_value', value: service.name.value.value } } };
  return relationProject(
    sequenceToArray(service.dependencyTargets),
    target => relationVariantFold<DependencyTargetReference, 'model_reference', ServiceDependency>(
      target,
      'model_reference',
      rest => relationVariantFold<DependencyTargetReference, 'service_reference', ServiceDependency>(
        rest,
        'service_reference',
        classTarget => ({ from, to: classTarget, type: 'depends_on_class', weight: 1 }),
        serviceTarget => ({ from, to: serviceTarget, type: 'depends_on_service', weight: 1 }),
      ),
      modelTarget => ({ from, to: modelTarget, type: 'depends_on_model', weight: 1 }),
    ),
  );
};

export function registerServicesFromGraphSurface(surface: RouteSyncManifestGraphSurface, builder: GraphBuilderContext): void {
  const services = sequenceToArray(surface.services);
  relationProject(services, service => {
    const reference: ServiceReference = { kind: 'service_reference', name: service.name };
    builder.servicesMap.set(reference, buildServiceNode(
      createServiceNodeName(reference.name.value.value),
      [...serviceMethods(service)],
    ));
  });
  relationProject(services, service => {
    const dependencies = serviceDependencies(service);
    relationProject(dependencies, dependency => builder.addGraphEdgeRelation(createGraphEdgeRelation(
      dependency.from, dependency.to, dependency.type, 'service_dependency', dependency.weight,
    )));
  });
}

const controllerNodeFromAction = (action: GraphControllerSurface): ControllerNode => buildControllerNode(
  createControllerNodeName(action.controller.value.value),
  [action.action],
);

/** Seed graph controller nodes from canonical contracts, then consume the canonical relation graph for dependency edges. */
const registerControllersFromGraphSurface = (
  surface: RouteSyncManifestGraphSurface,
  builder: GraphBuilderContext,
): void => {
  const controllers = sequenceToArray(surface.controllers);
  const seeded = relationFold(controllers, builder.controllersIndex, (index, action) => {
    const controllerName = action.controller.value.value;
    const current = relationOptionFold(
      relationIndexLookup(index, controllerName),
      () => controllerNodeFromAction(action),
      value => value,
    );
    const actionName = action.action.value.value;
    const actionNames = relationProject(current.actions, value => value.name);
    const next = relationResolve(
      relationContains(actionNames, action.action),
      () => current,
      () => ({ ...current, actions: [...current.actions, { name: action.action }] }),
    );
    return relationIndexAdd(index, controllerName, next);
  });
  relationProject(seeded, entry => builder.setController(entry[0], entry[1]));

};

const projectStructuralRelations = (
  surface: RouteSyncManifestGraphSurface,
  builder: GraphBuilderContext,
): void => {
  relationProject(
    sequenceToArray(surface.relations.relations),
    relation => {
      if (!isStructuralSemanticRelation(relation)) return;
      const projection = projectStructuralSemanticRelationToGraphEdge(relation);
      if (projection.kind === 'projected') builder.addGraphEdgeRelation(projection.relation);
    },
  );
};

const registerModelContract = (model: GraphModelSurface, builder: GraphBuilderContext): void => {
  const modelNode = buildModelNode({ identity: model.identity });
  const modelReference: ModelReference = { kind: 'model_reference', name: model.identity.name };
  builder.modelsMap.set(modelReference, modelNode);
};

/** Compile the graph from the canonical graph-specific downstream surface. */
export function compileGraphFromSurface(
  surface: RouteSyncManifestGraphSurface,
  builder: GraphBuilderContext,
): ServiceGraph {
  relationProject(sequenceToArray(surface.models), model => registerModelContract(model, builder));
  registerServicesFromGraphSurface(surface, builder);
  registerControllersFromGraphSurface(surface, builder);
  projectStructuralRelations(surface, builder);
  return builder.buildGraph();
}
