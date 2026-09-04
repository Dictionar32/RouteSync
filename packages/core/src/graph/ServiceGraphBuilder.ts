import {
  ServiceGraph,
  ServiceNode,
  ControllerNode,
  ModelNode,
  ExecutionLayer,
  ServiceDependency
} from '../types/semantic';
import { RouteManifest } from '../types/route';

export class ServiceGraphBuilder {
  private graph: ServiceGraph = {
    services: {},
    controllers: {},
    models: {},
    edges: []
  };

  /**
   * Detects the execution layer based on file path and code heuristics.
   */
  public detectLayer(filePath: string, code: string): ExecutionLayer {
    if (filePath.includes('Controller.php') || filePath.match(/Controller\.php$/)) {
      return 'controller';
    }
    if (filePath.includes('Service.php') || filePath.match(/Service\.php$/)) {
      return 'service';
    }
    if (filePath.includes('Models/') || filePath.match(/Model\.php$/)) {
      return 'model';
    }
    return 'unknown';
  }

  /**
   * Extracts methods and their properties from a parsed Class AST.
   */
  public extractMethods(classAST: unknown): string[] {
    return [];
  }

  public buildServiceNode(name: string, methods: string[]): ServiceNode {
    return {
      kind: 'service_node',
      name,
      methods,
      layer: 'service',
      dependencies: [],
      confidence: 1.0
    };
  }

  public buildControllerNode(name: string, routes: string[], actions: string[]): ControllerNode {
    return {
      kind: 'controller_node',
      name,
      routes,
      actions: actions.map(a => ({ name: a })),
      layer: 'controller',
      calls: [],
      confidence: 1.0
    };
  }

  public buildModelNode(name: string): ModelNode {
    return {
      kind: 'model_node',
      name,
      layer: 'model',
      confidence: 1.0
    };
  }

  /**
   * Links nodes together to form the Dependency Graph Edges.
   */
  public linkGraph(
    fromNode: string,
    toNode: string,
    type: ServiceDependency['type'],
    weight = 1.0,
    relationKind?: string
  ): void {
    this.graph.edges.push({
      from: fromNode,
      to: toNode,
      type,
      relationKind,
      weight
    });
  }

  /**
   * Gets the final assembled graph.
   */
  public getGraph(): ServiceGraph {
    return this.graph;
  }

  /**
   * Builds the graph from a RouteManifest (Pure 1-Pass Upstream Traversal).
   */
  public buildFromManifest(manifest: RouteManifest): ServiceGraph {
    // 1. Models Indexing & Relations Traversal
    for (const m of manifest.models) {
      const modelNode = this.buildModelNode(m.name);
      modelNode.table = m.table;
      
      const fields: Record<string, { type: string; nullable: boolean }> = {};
      for (const col of m.columns) {
        fields[col.name] = { type: col.type, nullable: col.nullable };
      }
      modelNode.fields = fields;
      this.graph.models[m.name] = modelNode;

      if (m.relations) {
        for (const rel of m.relations) {
          this.linkGraph(m.name, rel.targetModel, 'depends_on_model', 1.0, rel.type);
        }
      }
    }

    // 2. Resources Indexing & Explicit BaseModel Link
    for (const res of manifest.resources) {
      const fieldsList = res.fields.map(f => f.name);
      const serviceNode = this.buildServiceNode(res.name, fieldsList);
      this.graph.services[res.name] = serviceNode;

      if (res.baseModel) {
        this.linkGraph(res.name, res.baseModel, 'depends_on_model');
      }
    }

    // 3. Controllers & Route Endpoints Indexing
    for (const route of manifest.routes) {
      const controllerName = route.controllerName || `${route.resourceName}Controller`;

      let controller = this.graph.controllers[controllerName];
      if (!controller) {
        controller = this.buildControllerNode(controllerName, [], []);
        this.graph.controllers[controllerName] = controller;
      }

      if (!controller.routes.includes(route.path)) {
        controller.routes.push(route.path);
      }
      
      const actionName = route.actionName || 'index';
      if (!controller.actions.some(a => a.name === actionName)) {
        controller.actions.push({ name: actionName });
      }

      if (route.response) {
        const checkResponseModel = (node: unknown) => {
          if (!node || typeof node !== 'object') return;
          const obj = node as Record<string, unknown>;
          if (typeof obj.model === 'string') {
            this.linkGraph(controllerName, obj.model, 'depends_on_model');
          }
          if (obj.kind === 'object' && Array.isArray(obj.fields)) {
            for (const f of obj.fields) checkResponseModel(f);
          }
        };
        checkResponseModel(route.response);
      }
    }

    return this.graph;
  }
}