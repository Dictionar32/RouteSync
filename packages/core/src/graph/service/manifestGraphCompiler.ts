/** Declarative graph compilation from canonical route/source relations. */
import type { RouteManifest } from '../../types/route';
import type { CompleteLaravelSourceModel } from '../../types/upstream/highLevelSourceModel';
import type { ServiceSemanticContract } from '../../types/upstream/highLevelContracts';
import type { ServiceGraph, ServiceNode, ControllerNode, ServiceModelNode, ServiceDependency } from '../../types/semantic';
import { buildModelNode, buildServiceNode, buildControllerNode } from './nodeFactories';
import { createActionName } from '../../types/upstream/names';
import type { ModelReference, ResourceReference, ServiceReference } from '../../types/upstream/semanticReferences';
import { GraphNodeIndex } from './graphNodeIndex';
import { createControllerNodeName, createServiceNodeName } from '../../types/semantic/nominalVocabulary';
import { assembleServiceGraph } from './graphAssembler';
import type { ServiceMethod } from '../../types/upstream/service';
import type { RelationIndex } from '../../semantic/kernel/relationMembership';
import { relationIndexLookup } from '../../semantic/kernel/relationMembership';
import { relationContains } from '../../semantic/kernel/relationMembership';
import { relationOptionFold, relationProject, relationSelect } from '../../semantic/kernel/relationalSequence';
import { relationEqual, relationResolve } from '../../semantic/kernel/relationFoundation';
import { relationSome, type RelationOption } from '../../semantic/kernel/relationFoundation';
import type { Sequence } from '../../types/upstream/collections';
import { matchRouteHandler } from '../../types/domain/routeHandlers';

export interface GraphBuilderContext {
  readonly modelsMap: GraphNodeIndex<ServiceModelNode>;
  readonly servicesMap: GraphNodeIndex<ServiceNode>;
  readonly controllersIndex: RelationIndex<string, ControllerNode>;
  readonly edges: readonly ServiceDependency[];
  setController(name: string, controller: ControllerNode): void;
  linkGraph(
    fromNode: ServiceReference | ResourceReference | ModelReference,
    toNode: ServiceReference | ResourceReference | ModelReference,
    type: ServiceDependency['type'],
    weight: number,
  ): void;
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
    resolved => ({ from, to: resolved.target, type: 'depends_on_model', weight: 1 }),
  );
};

const registerService = (service: ServiceSemanticContract, builder: GraphBuilderContext): void => {
  const reference: ServiceReference = { kind: 'service_reference', name: service.name };
  const dependencies = serviceDependencies(service);
  builder.servicesMap.set(reference, buildServiceNode(
    createServiceNodeName(reference.name.value.value),
    [...serviceMethods(service)],
    [...dependencies],
    service.dependencies,
    service.resolvedDependencies,
  ));
  relationProject(
    relationSelect(dependencies, dependency => builder.modelsMap.has(dependency.to)),
    dependency => builder.linkGraph(dependency.from, dependency.to, dependency.type, dependency.weight),
  );
};

export function registerServicesFromSourceModel(sourceModel: CompleteLaravelSourceModel, builder: GraphBuilderContext): void {
  relationProject(sequenceToArray(sourceModel.contracts.services), service => registerService(service, builder));
}

const routeControllerName = (route: RouteManifest['routes'][number]): RelationOption<string> =>
  matchRouteHandler(route.binding.operation.handler, {
    controllerAction: handler => relationSome(handler.controllerName.value.value),
    invokableController: handler => relationSome(handler.controllerName.value.value),
    closure: () => ({ kind: 'none' } as const),
  });

const addRouteFact = (route: RouteManifest['routes'][number], builder: GraphBuilderContext): void => {
  const controller = routeControllerName(route);
  relationOptionFold(
    controller,
    () => false,
    controllerName => {
      const current = relationOptionFold(
        relationIndexLookup(builder.controllersIndex, controllerName),
        () => buildControllerNode(createControllerNodeName(controllerName), [], []),
        value => value,
      );
      const path = route.provenance.uri.value.value;
      const action = route.binding.operation.name.value.value;
      const routeAddition = relationResolve(
        relationContains(current.routes, path),
        () => [],
        () => [path],
      );
      const actionNames = relationProject(current.actions, value => value.name.value.value);
      const actionAddition = relationResolve(
        relationContains(actionNames, action),
        () => [],
        () => [{ name: createActionName(action) }],
      );
      const nextController: ControllerNode = {
        ...current,
        routes: [...current.routes, ...routeAddition],
        actions: [...current.actions, ...actionAddition],
      };
      builder.setController(controllerName, nextController);
    },
  );
};

export function compileGraphFromManifest(
  manifest: RouteManifest,
  builder: GraphBuilderContext,
  sourceModel: RelationOption<CompleteLaravelSourceModel>,
): ServiceGraph {
  relationProject(manifest.models, model => {
    const modelNode = buildModelNode(model.definition.semantic);
    const modelReference: ModelReference = { kind: 'model_reference', name: model.definition.identity.name };
    builder.modelsMap.set(modelReference, modelNode);
    relationProject(
      sequenceToArray(model.definition.relations.items),
      relation => builder.linkGraph(
        modelReference,
        relation.target,
        'depends_on_model',
        1.0,
      ),
    );
  });

  relationOptionFold(sourceModel, () => false, value => { registerServicesFromSourceModel(value, builder); return true; });

  relationProject(manifest.resources, resource => builder.linkGraph(
    { kind: 'resource_reference', name: resource.definition.name },
    resource.definition.model,
    'depends_on_model',
    1.0,
  ));

  relationProject(manifest.routes, route => addRouteFact(route, builder));

  return assembleServiceGraph(builder.modelsMap, builder.servicesMap, builder.controllersIndex, builder.edges);
}
