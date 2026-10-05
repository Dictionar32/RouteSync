/** Declarative graph compilation from canonical route/source relations. */
import type { CompleteLaravelSourceModel } from '../../types/upstream/highLevelSourceModel';
import type { ServiceSemanticContract, ModelHighLevelContract, RouteHighLevelContract, ControllerActionFlowContract } from '../../types/upstream/highLevelContracts';
import type { ServiceGraph, ServiceNode, ControllerNode, ServiceModelNode, ServiceDependency } from '../../types/semantic';
import { createGraphEdgeRelation, type GraphEdgeRelation } from './graphEdgeRelation';
import { buildModelNode, buildServiceNode, buildControllerNode } from './nodeFactories';
import { createActionName } from '../../types/upstream/names';
import type { ModelReference, ServiceReference, DependencyTargetReference } from '../../types/upstream/semanticReferences';
import { isStructuralSemanticRelation } from '../../types/upstream/semanticReferences';
import { GraphNodeIndex } from './graphNodeIndex';
import { createControllerNodeName, createServiceNodeName } from '../../types/semantic/nominalVocabulary';
import type { ServiceMethod } from '../../types/upstream/service';
import type { RelationIndex } from '../../semantic/foundation/relationMembership';
import { relationIndexLookup, relationIndexAdd } from '../../semantic/foundation/relationMembership';
import { relationContains } from '../../semantic/foundation/relationMembership';
import { relationEqual } from '../../semantic/foundation/relationFoundation';
import { relationOptionFold, relationProject, relationVariantFold, relationFold } from '../../semantic/foundation/relationalSequence';
import { relationResolve } from '../../semantic/foundation/relationFoundation';
import { relationSome, type RelationOption } from '../../semantic/foundation/relationFoundation';
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

const sequenceToArray = <T>(items: Sequence<T>): readonly T[] => relationResolve(
  relationEqual(items.kind, 'empty'),
  () => [],
  () => [items.head, ...sequenceToArray(items.tail)],
);

const serviceMethods = (service: ServiceSemanticContract): readonly ServiceMethod[] => sequenceToArray(service.methods.items);

const serviceDependencies = (service: ServiceSemanticContract): readonly ServiceDependency[] => {
  const from: ServiceReference = { kind: 'service_reference', name: service.identity.name };
  return relationProject(
    sequenceToArray(service.resolvedDependencies.items),
    resolved => relationVariantFold<DependencyTargetReference, 'model_reference', ServiceDependency>(
      resolved.target,
      'model_reference',
      () => ({ from, to: resolved.target, type: 'depends_on_model', weight: 1 }),
      serviceTarget => relationVariantFold<DependencyTargetReference, 'service_reference', ServiceDependency>(
        resolved.target,
        'service_reference',
        () => ({ from, to: serviceTarget, type: 'depends_on_service', weight: 1 }),
        classTarget => ({ from, to: classTarget, type: 'depends_on_class', weight: 1 }),
      ),
    ),
  );
};

export function registerServicesFromSourceModel(sourceModel: CompleteLaravelSourceModel, builder: GraphBuilderContext): void {
  const services = sequenceToArray(sourceModel.contracts.services);
  relationProject(services, service => {
    const reference: ServiceReference = { kind: 'service_reference', name: service.name };
    builder.servicesMap.set(reference, buildServiceNode(
      createServiceNodeName(reference.name.value.value),
      [...serviceMethods(service)],
      [],
      service.dependencies,
      service.resolvedDependencies,
    ));
  });
  relationProject(services, service => {
    const dependencies = serviceDependencies(service);
    relationProject(dependencies, dependency => builder.addGraphEdgeRelation(createGraphEdgeRelation(
      dependency.from, dependency.to, dependency.type, 'service_dependency', dependency.weight,
    )));
  });
}

const routeControllerTarget = (route: RouteHighLevelContract): RelationOption<import('../../types/upstream/semanticReferences').ControllerReference> =>
  relationVariantFold(route.bindings.target, 'controller_action', () =>
    relationVariantFold(route.bindings.target, 'controller_invokable', () => ({ kind: 'none' } as const), value =>
      relationSome(value.controller),
    ),
    value => relationSome(value.controller),
  );

const controllerNodeFromAction = (action: ControllerActionFlowContract): ControllerNode => buildControllerNode(
  createControllerNodeName(action.controller.value.value),
  [],
  [createActionName(action.action)],
);

/** Seed graph controller nodes from canonical contracts, then consume the canonical relation graph for dependency edges. */
const registerControllersFromSourceModel = (
  sourceModel: CompleteLaravelSourceModel,
  builder: GraphBuilderContext,
): void => {
  const controllers = sequenceToArray(sourceModel.contracts.controllers);
  const seeded = relationFold(controllers, builder.controllersIndex, (index, action) => {
    const controllerName = action.controller.value.value;
    const current = relationOptionFold(
      relationIndexLookup(index, controllerName),
      () => controllerNodeFromAction(action),
      value => value,
    );
    const actionName = action.action.value.value;
    const actionNames = relationProject(current.actions, value => value.name.value.value);
    const next = relationResolve(
      relationContains(actionNames, actionName),
      () => current,
      () => ({ ...current, actions: [...current.actions, { name: createActionName(action.action) }] }),
    );
    return relationIndexAdd(index, controllerName, next);
  });
  relationProject(seeded, entry => builder.setController(entry[0], entry[1]));

};

const projectStructuralRelations = (
  sourceModel: CompleteLaravelSourceModel,
  builder: GraphBuilderContext,
): void => {
  relationProject(
    sequenceToArray(sourceModel.relations.relations),
    relation => {
      if (!isStructuralSemanticRelation(relation)) return;
      const projection = projectStructuralSemanticRelationToGraphEdge(relation);
      if (projection.kind === 'projected') builder.addGraphEdgeRelation(projection.relation);
    },
  );
};

const addRouteFact = (route: RouteHighLevelContract, builder: GraphBuilderContext): void => {
  relationOptionFold(
    routeControllerTarget(route),
    () => undefined,
    controller => relationOptionFold(
      relationIndexLookup(builder.controllersIndex, controller.name.value.value),
      () => undefined,
      current => relationResolve(
        relationContains(relationProject(current.actions, action => action.name.value.value), controller.action.value.value),
        () => undefined,
        () => {
          const path = route.identity.path.value.value;
          const routeAddition = relationResolve(
            relationContains(current.routes, path),
            () => [],
            () => [path],
          );
          builder.setController(controller.name.value.value, {
            ...current,
            routes: [...current.routes, ...routeAddition],
          });
        },
      ),
    ),
  );
};

const registerModelContract = (model: ModelHighLevelContract, builder: GraphBuilderContext): void => {
  const modelNode = buildModelNode(model.semantic);
  const modelReference: ModelReference = { kind: 'model_reference', name: model.identity.name };
  builder.modelsMap.set(modelReference, modelNode);
};

/** Compile the graph directly from the canonical upstream semantic contract catalog. */
export function compileGraphFromSourceModel(
  sourceModel: CompleteLaravelSourceModel,
  builder: GraphBuilderContext,
): ServiceGraph {
  relationProject(sequenceToArray(sourceModel.contracts.models), model => registerModelContract(model, builder));
  registerServicesFromSourceModel(sourceModel, builder);
  registerControllersFromSourceModel(sourceModel, builder);
  projectStructuralRelations(sourceModel, builder);
  relationProject(sequenceToArray(sourceModel.contracts.routes), route => addRouteFact(route, builder));
  return builder.buildGraph();
}
