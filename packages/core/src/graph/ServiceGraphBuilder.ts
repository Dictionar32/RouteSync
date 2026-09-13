import type {
  ServiceGraph,
  ServiceNode,
  ControllerNode,
  ModelNode,
  ExecutionLayer,
  ServiceDependency
} from '../types/semantic';
import type { RouteManifest } from '../types/route';
import {
  detectExecutionLayer,
  buildServiceNode,
  buildControllerNode,
  buildModelNode,
  assembleServiceGraph,
  compileGraphFromManifest
} from './service';

export class ServiceGraphBuilder {
  private readonly modelsMap = new Map<string, ModelNode>();
  private readonly servicesMap = new Map<string, ServiceNode>();
  private readonly controllersMap = new Map<string, ControllerNode>();
  private readonly edges: ServiceDependency[] = [];

  public detectLayer(filePath: string, code: string): ExecutionLayer {
    return detectExecutionLayer(filePath, code);
  }

  public extractMethods(_classAST: unknown): string[] {
    return [];
  }

  public buildServiceNode(name: string, methods: string[]): ServiceNode {
    return buildServiceNode(name, methods);
  }

  public buildControllerNode(name: string, routes: string[], actions: string[]): ControllerNode {
    return buildControllerNode(name, routes, actions);
  }

  public buildModelNode(name: string): ModelNode {
    return buildModelNode(name);
  }

  public registerModel(name: string, model: ModelNode): void {
    this.modelsMap.set(name, model);
  }

  public registerService(name: string, service: ServiceNode): void {
    this.servicesMap.set(name, service);
  }

  public registerController(name: string, controller: ControllerNode): void {
    this.controllersMap.set(name, controller);
  }

  public getModel(name: string): ModelNode | undefined {
    return this.modelsMap.get(name);
  }

  public getService(name: string): ServiceNode | undefined {
    return this.servicesMap.get(name);
  }

  public getController(name: string): ControllerNode | undefined {
    return this.controllersMap.get(name);
  }

  public linkGraph(
    fromNode: string,
    toNode: string,
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
}
