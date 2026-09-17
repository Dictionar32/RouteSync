/**
 * manifestGraphCompiler.ts
 *
 * Traverses RouteManifest to index models, resources, controllers, and dependency edges.
 *
 * @module core/graph/service
 */

import type { RouteManifest } from '../../types/route';
import type { ServiceGraph, ServiceNode, ControllerNode, ServiceModelNode, ServiceDependency } from '../../types/semantic';
import { buildModelNode, buildServiceNode, buildControllerNode } from './nodeFactories';
import { assembleServiceGraph } from './graphAssembler';

export interface GraphBuilderContext {
  readonly modelsMap: Map<string, ServiceModelNode>;
  readonly servicesMap: Map<string, ServiceNode>;
  readonly controllersMap: Map<string, ControllerNode>;
  readonly edges: ServiceDependency[];
  linkGraph(fromNode: string, toNode: string, type: ServiceDependency['type'], weight?: number, relationKind?: string): void;
}

export function compileGraphFromManifest(
  manifest: RouteManifest,
  builder: GraphBuilderContext
): ServiceGraph {
  // 1. Models Indexing & Relations Traversal
  for (const m of manifest.models) {
    const modelNode = buildModelNode(m.name);
    builder.modelsMap.set(m.name, modelNode);

    if (m.relations) {
      for (const rel of m.relations) {
        builder.linkGraph(m.name, rel.targetModel, 'depends_on_model', 1.0, rel.type);
      }
    }
  }

  // 2. Resources Indexing & Explicit BaseModel Link
  for (const res of manifest.resources) {
    const fieldsList = res.fields.map(f => f.name);
    const serviceNode = buildServiceNode(res.name, fieldsList);
    builder.servicesMap.set(res.name, serviceNode);

    if (res.baseModel) {
      builder.linkGraph(res.name, res.baseModel, 'depends_on_model');
    }
  }

  // 3. Controllers & Route Endpoints Indexing
  for (const route of manifest.routes) {
    const controllerName = route.controllerName || `${route.resourceName}Controller`;

    let controller: ControllerNode | undefined = builder.controllersMap.get(controllerName);
    if (!controller) {
      controller = buildControllerNode(controllerName, [], []);
      builder.controllersMap.set(controllerName, controller);
    }

    if (!controller.routes.includes(route.path)) {
      controller.routes.push(route.path);
    }

    const actionName = route.actionName || 'index';
    if (!controller.actions.some((a: { name: string }) => a.name === actionName)) {
      controller.actions.push({ name: actionName });
    }


  }

  return assembleServiceGraph(builder.modelsMap, builder.servicesMap, builder.controllersMap, builder.edges);
}
