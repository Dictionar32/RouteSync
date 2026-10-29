/** Declarative graph compilation from canonical route/source relations. */
import type {
  RouteSyncManifestGraphSurface,
  GraphServiceSurface,
  GraphServiceMethodSurface,
  GraphModelSurface,
} from '../RouteSyncManifestGraphProjectionInterface';
import type { ServiceGraph, ControllerNode, ServiceNode, ServiceModelNode, ServiceDependency } from '../../types/semantic';
import { graphEdgeRelationOperations, type GraphEdgeRelation } from './graphEdgeRelation';
import { graphNodeFactoryOperations } from './nodeFactories';
import type { ModelReference, ServiceReference, DependencyTargetReference } from '../../types/upstream/semanticReferences';
import { isStructuralSemanticRelation } from '../../types/upstream/semanticReferences';
import { GraphNodeIndex } from './graphNodeIndex';
import { createServiceNodeName } from '../../types/semantic/nominalVocabulary';
import type { ControllerRegistry } from './controllerRegistry';
import { structuralSemanticRelationProjectionOperations } from './structuralSemanticRelationProjection';
import type { Sequence } from '../../types/upstream/collections';

export interface GraphBuilderContext {
  readonly modelsMap: GraphNodeIndex<ServiceModelNode>;
  readonly servicesMap: GraphNodeIndex<ServiceNode>;
  readonly controllersIndex: ControllerRegistry;
  buildGraph(): ServiceGraph;
  setController(name: string, controller: ControllerNode): void;
  addGraphEdgeRelation(relation: GraphEdgeRelation): void;
}

/** Graph-surface sequence consumption is owned by this graph compiler, not a generic relation foundation. */
const graphSurfaceSequenceToArray = <T>(items: Sequence<T>): readonly T[] => items.kind === 'empty'
  ? Object.freeze([])
  : Object.freeze([items.head, ...graphSurfaceSequenceToArray(items.tail)]);

const graphSurfaceSequenceOperations: Readonly<{ toArray: typeof graphSurfaceSequenceToArray }> = Object.freeze({
  toArray: graphSurfaceSequenceToArray,
});

const sequenceToArray = graphSurfaceSequenceOperations.toArray;

const serviceMethods = (service: GraphServiceSurface): readonly import('../../types/upstream/names').ActionName[] =>
  sequenceToArray(service.methods).map((method: GraphServiceMethodSurface) => method.name);

const serviceDependencies = (service: GraphServiceSurface): readonly ServiceDependency[] => {
  const from: ServiceReference = { kind: 'service_reference', name: { kind: 'class_name', value: { kind: 'string_value', value: service.name.value.value } } };
  return sequenceToArray(service.dependencyTargets).map((target): ServiceDependency => {
    switch (target.kind) {
      case 'model_reference': return { from, to: target, type: 'depends_on_model', weight: 1 };
      case 'service_reference': return { from, to: target, type: 'depends_on_service', weight: 1 };
    }
  });
};

const registerServicesFromGraphSurfaceImplementation = (surface: RouteSyncManifestGraphSurface, builder: GraphBuilderContext): void => {
  const services = sequenceToArray(surface.services);
  services.forEach(service => {
    const reference: ServiceReference = { kind: 'service_reference', name: service.name };
    builder.servicesMap.set(reference, graphNodeFactoryOperations.buildServiceNode(
      createServiceNodeName(reference.name.value.value),
      [...serviceMethods(service)],
    ));
  });
  services.forEach(service => {
    const dependencies = serviceDependencies(service);
    dependencies.forEach(dependency => builder.addGraphEdgeRelation(graphEdgeRelationOperations.create(
      dependency.from, dependency.to, dependency.type, 'service_dependency', dependency.weight,
    )));
  });
}

/** Seed graph controller nodes from canonical contracts, then consume the canonical relation graph for dependency edges. */
const registerControllersFromGraphSurface = (
  surface: RouteSyncManifestGraphSurface,
  builder: GraphBuilderContext,
): void => {
  const controllers = sequenceToArray(surface.controllers);
  const seeded = controllers.reduce(
    (registry, action) => registry.registerAction(action.controller.value.value, { name: action.action }),
    builder.controllersIndex,
  );
  seeded.entries.forEach(entry => builder.setController(entry.name, entry.controller));

};

const projectStructuralRelations = (
  surface: RouteSyncManifestGraphSurface,
  builder: GraphBuilderContext,
): void => {
  sequenceToArray(surface.relations.relations).forEach(relation => {
      if (!isStructuralSemanticRelation(relation)) return;
      const projection = structuralSemanticRelationProjectionOperations.project(relation);
      if (projection.kind === 'projected') builder.addGraphEdgeRelation(projection.relation);
    });
};

const registerModelContract = (model: GraphModelSurface, builder: GraphBuilderContext): void => {
  const modelNode = graphNodeFactoryOperations.buildModelNode({ identity: model.identity });
  const modelReference: ModelReference = { kind: 'model_reference', name: model.identity.name };
  builder.modelsMap.set(modelReference, modelNode);
};

/** Compile the graph from the canonical graph-specific downstream surface. */
const compileGraphFromSurfaceImplementation = (
  surface: RouteSyncManifestGraphSurface,
  builder: GraphBuilderContext,
): ServiceGraph => {
  sequenceToArray(surface.models).forEach(model => registerModelContract(model, builder));
  registerServicesFromGraphSurfaceImplementation(surface, builder);
  registerControllersFromGraphSurface(surface, builder);
  projectStructuralRelations(surface, builder);
  return builder.buildGraph();
}


export interface ManifestGraphCompilationOperationsInterface {
  readonly compile: (
    surface: RouteSyncManifestGraphSurface,
    builder: GraphBuilderContext,
  ) => ServiceGraph;
}

export const manifestGraphCompilationOperations: ManifestGraphCompilationOperationsInterface = Object.freeze({
  compile: compileGraphFromSurfaceImplementation,
});
