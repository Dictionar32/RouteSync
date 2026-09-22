/**
 * manifestGraphCompiler.ts
 *
 * Traverses RouteManifest to index models, resources, controllers, and dependency edges.
 *
 * @module core/graph/service
 */

import type { RouteManifest } from '../../types/route';
import type { CompleteLaravelSourceModel, ServiceSemanticNode } from '../../types/upstream/highLevelSourceModel';
import type { ServiceGraph, ServiceNode, ControllerNode, ServiceModelNode, ServiceDependency } from '../../types/semantic';
import { buildModelNode, buildServiceNode, buildControllerNode } from './nodeFactories';
import { createActionName } from '../../types/upstream/names';
import type { ModelReference, ResourceReference, ServiceReference } from '../../types/upstream/semanticReferences';
import { GraphNodeIndex } from './graphNodeIndex';
import { createControllerNodeName, createServiceNodeName } from '../../types/semantic/nominalVocabulary';
import { assembleServiceGraph } from './graphAssembler';
import type { ServiceMethod } from '../../types/upstream/service';

export interface GraphBuilderContext {
  readonly modelsMap: GraphNodeIndex<ServiceModelNode>;
  readonly servicesMap: GraphNodeIndex<ServiceNode>;
  readonly controllersMap: Map<string, ControllerNode>;
  readonly edges: ServiceDependency[];
  linkGraph(fromNode: ServiceReference | ResourceReference | ModelReference, toNode: ServiceReference | ResourceReference | ModelReference, type: ServiceDependency['type'], weight?: number, relationKind?: string): void;
}

function serviceMethods(service: ServiceSemanticNode): ServiceMethod[] {
  const methods: ServiceMethod[] = [];
  let items = service.definition.methods.items;
  while (items.kind === 'cons') {
    methods.push(items.head);
    items = items.tail;
  }
  return methods;
}

function serviceDependencies(
  service: ServiceSemanticNode
): ServiceDependency[] {
  const dependencies: ServiceDependency[] = [];
  let items = service.resolvedDependencies.items;
  const from: ServiceReference = { kind: 'service_reference', name: service.identity.name };
  while (items.kind === 'cons') {
    const resolved = items.head;
    dependencies.push({
      from,
      to: resolved.target,
      type: 'depends_on_model',
      weight: 1,
    });
    items = items.tail;
  }
  return dependencies;
}

export function registerServicesFromSourceModel(
  sourceModel: CompleteLaravelSourceModel,
  builder: GraphBuilderContext
): void {
  let services = sourceModel.catalog.services;
  while (services.kind === 'cons') {
    const service = services.head;
    const reference: ServiceReference = { kind: 'service_reference', name: service.identity.name };
    const dependencies = serviceDependencies(service);
    builder.servicesMap.set(reference, buildServiceNode(
      createServiceNodeName(reference.name.value.value),
      serviceMethods(service),
      dependencies,
      service.definition.dependencies,
      service.resolvedDependencies
    ));
    for (const dependency of dependencies) {
      if (builder.modelsMap.has(dependency.to)) builder.edges.push(dependency);
    }
    services = services.tail;
  }
}

export function compileGraphFromManifest(
  manifest: RouteManifest,
  builder: GraphBuilderContext,
  sourceModel?: CompleteLaravelSourceModel
): ServiceGraph {
  // 1. Models Indexing & Relations Traversal
  for (const m of manifest.models) {
    const modelNode = buildModelNode(m.semantic);
    const modelReference: ModelReference = { kind: 'model_reference', name: { kind: 'model_name', value: { kind: 'string_value', value: m.name.value } } };
    builder.modelsMap.set(modelReference, modelNode);

    if (m.relations) {
      for (const rel of m.relations) {
        const from: ModelReference = modelReference;
      const to: ModelReference = { kind: 'model_reference', name: { kind: 'model_name', value: { kind: 'string_value', value: rel.targetModel.value } } };
      builder.linkGraph(from, to, 'depends_on_model', 1.0, rel.type);
      }
    }
  }

  // 2. Services come from canonical ServiceAst elevation, never from resource reclassification.
  if (sourceModel) {
    registerServicesFromSourceModel(sourceModel, builder);
  }

  // 3. Resources retain only their explicit model relation.
  for (const res of manifest.resources) {
    if (res.baseModel) {
      const from: ResourceReference = { kind: 'resource_reference', name: { kind: 'resource_name', value: { kind: 'string_value', value: res.name } } };
      const to: ModelReference = { kind: 'model_reference', name: { kind: 'model_name', value: { kind: 'string_value', value: res.baseModel } } };
      builder.linkGraph(from, to, 'depends_on_model');
    }
  }

  // 4. Controllers & Route Endpoints Indexing
  for (const route of manifest.routes) {
    const controllerName = route.controllerName || `${route.resourceName}Controller`;

    let controller: ControllerNode | undefined = builder.controllersMap.get(controllerName);
    if (!controller) {
      controller = buildControllerNode(createControllerNodeName(controllerName), [], []);
      builder.controllersMap.set(controllerName, controller);
    }

    if (!controller.routes.includes(route.path)) {
      controller.routes.push(route.path);
    }

    const actionName = route.actionName || 'index';
    if (!controller.actions.some(a => a.name.value.value === actionName)) {
      controller.actions.push({ name: createActionName(actionName) });
    }


  }

  return assembleServiceGraph(builder.modelsMap, builder.servicesMap, builder.controllersMap, builder.edges);
}
