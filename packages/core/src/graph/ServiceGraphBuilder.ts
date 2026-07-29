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
   * Builds the graph from a RouteManifest.
   */
  public buildFromManifest(manifest: RouteManifest): ServiceGraph {
    if (manifest.models) {
      manifest.models.forEach((m) => {
        const modelNode = this.buildModelNode(m.name);
        modelNode.table = m.table;
        if (m.columns) {
          const fields: Record<string, { type: string; nullable: boolean }> = {};
          m.columns.forEach((col) => {
            fields[col.name] = { type: col.type, nullable: col.nullable };
          });
          modelNode.fields = fields;
        }
        if (m.relations) {
          modelNode.relations = m.relations;
        }
        this.graph.models[m.name] = modelNode;

        if (m.relations) {
          for (const rel of Object.values(m.relations)) {
            // `type` tetap 'depends_on_model' demi backward-compat (lihat
            // ContractGraph.ts yang mencocokkan `d.type === 'depends_on_model'`).
            // Cardinality aslinya (hasMany/belongsTo/dst) dibawa lewat
            // relationKind, bukan lagi dibuang.
            this.linkGraph(m.name, rel.model, 'depends_on_model', 1.0, rel.type);
          }
        }
      });
    }

    if (manifest.resources) {
      manifest.resources.forEach((res) => {
        const fieldsList = Object.keys(res.fields || {});
        const serviceNode = this.buildServiceNode(res.name, fieldsList);
        this.graph.services[res.name] = serviceNode;

        const potentialModelName = res.name.replace('Resource', '');
        if (this.graph.models[potentialModelName]) {
          this.linkGraph(res.name, potentialModelName, 'depends_on_model');
        }
      });
    }

    if (manifest.routes) {
      manifest.routes.forEach((route) => {
        const parts = route.name.split('.');
        const controllerName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + 'Controller' : 'UnknownController';

        let controller = this.graph.controllers[controllerName];
        if (!controller) {
          controller = this.buildControllerNode(controllerName, [], []);
          this.graph.controllers[controllerName] = controller;
        }

        if (!controller.routes.includes(route.path)) {
          controller.routes.push(route.path);
        }
        const actionName = route.action || (parts[1] || 'index');
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
            if (obj.kind === 'object' && obj.fields && typeof obj.fields === 'object') {
              Object.values(obj.fields).forEach(f => checkResponseModel(f));
            }
          };
          checkResponseModel(route.response);
        }
      });
    }

    return this.graph;
  }
}