import type {
  ServiceGraph,
  ServiceNode,
  ControllerNode,
  ServiceModelNode,
  ExecutionLayer,
  ServiceDependency
} from '../types/semantic';
import type { RouteManifest } from '../types/route';
import type { RouteSyncManifest } from '../types/upstream/manifest';
import type { ModelSemanticDefinition } from '../types/upstream/model';
import type { ActionName } from '../types/upstream/names';
import type { ServiceMethod, ServiceDependencyFacts, ResolvedServiceDependencies } from '../types/upstream/service';
import type { ControllerNodeName, ServiceNodeName } from '../types/semantic/nominalVocabulary';
import { GraphNodeIndex } from './service/graphNodeIndex';
import {
  detectExecutionLayer,
  buildServiceNode,
  buildControllerNode,
  buildModelNode,
  assembleServiceGraph,
  compileGraphFromManifest
} from './service';

export class ServiceGraphBuilder {
  private readonly modelsMap = GraphNodeIndex.empty<ServiceModelNode>();
  private readonly servicesMap = GraphNodeIndex.empty<ServiceNode>();
  private readonly controllersMap = new Map<string, ControllerNode>();
  private readonly edges: ServiceDependency[] = [];

  public detectLayer(filePath: string, code: string): ExecutionLayer {
    return detectExecutionLayer(filePath, code);
  }

  public extractMethods(_classAST: unknown): string[] {
    return [];
  }

  public buildServiceNode(name: ServiceNodeName, methods: ServiceMethod[], dependencyFacts: ServiceDependencyFacts, resolvedDependencies: ResolvedServiceDependencies): ServiceNode {
    return buildServiceNode(name, methods, [], dependencyFacts, resolvedDependencies);
  }

  public buildControllerNode(name: ControllerNodeName, routes: string[], actions: ActionName[]): ControllerNode {
    return buildControllerNode(name, routes, actions);
  }

  public buildModelNode(model: ModelSemanticDefinition): ServiceModelNode {
    return buildModelNode(model);
  }

  public registerModel(name: string, model: ServiceModelNode): void {
    this.modelsMap.set({ kind: 'model_reference', name: { kind: 'model_name', value: { kind: 'string_value', value: name } } }, model);
  }

  public registerService(name: string, service: ServiceNode): void {
    this.servicesMap.set({ kind: 'service_reference', name: { kind: 'class_name', value: { kind: 'string_value', value: name } } }, service);
  }

  public registerController(name: string, controller: ControllerNode): void {
    this.controllersMap.set(name, controller);
  }

  public getModel(name: string): ServiceModelNode | undefined {
    const result = this.modelsMap.lookup({ kind: 'model_reference', name: { kind: 'model_name', value: { kind: 'string_value', value: name } } });
    return result.kind === 'found' ? result.value : undefined;
  }

  public getService(name: string): ServiceNode | undefined {
    const result = this.servicesMap.lookup({ kind: 'service_reference', name: { kind: 'class_name', value: { kind: 'string_value', value: name } } });
    return result.kind === 'found' ? result.value : undefined;
  }

  public getController(name: string): ControllerNode | undefined {
    return this.controllersMap.get(name);
  }

  public linkGraph(
    fromNode: import('../types/upstream/semanticReferences').ModelReference | import('../types/upstream/semanticReferences').ResourceReference | import('../types/upstream/semanticReferences').ServiceReference,
    toNode: import('../types/upstream/semanticReferences').ModelReference | import('../types/upstream/semanticReferences').ResourceReference | import('../types/upstream/semanticReferences').ServiceReference,
    type: ServiceDependency['type'],
    weight = 1.0,
    relationKind?: string
  ): void {
    this.edges.push({
      from: fromNode,
      to: toNode,
      type,
      relationKind,
      weight
    });
  }

  public getGraph(): ServiceGraph {
    return assembleServiceGraph(this.modelsMap, this.servicesMap, this.controllersMap, this.edges);
  }

  public buildFromManifest(manifest: RouteManifest): ServiceGraph {
    return compileGraphFromManifest(manifest, {
      modelsMap: this.modelsMap,
      servicesMap: this.servicesMap,
      controllersMap: this.controllersMap,
      edges: this.edges,
      linkGraph: (fromNode, toNode, type, weight, relationKind) =>
        this.linkGraph(fromNode, toNode, type, weight, relationKind)
    });
  }

  public buildFromRouteSyncManifest(manifest: RouteSyncManifest, routeManifest: RouteManifest): ServiceGraph {
    return compileGraphFromManifest(routeManifest, {
      modelsMap: this.modelsMap,
      servicesMap: this.servicesMap,
      controllersMap: this.controllersMap,
      edges: this.edges,
      linkGraph: (fromNode, toNode, type, weight, relationKind) =>
        this.linkGraph(fromNode, toNode, type, weight, relationKind)
    }, manifest.sourceModel.value);
  }

}
