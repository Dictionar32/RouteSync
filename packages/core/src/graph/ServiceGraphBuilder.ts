import { 
  ServiceGraph, 
  ServiceNode, 
  ControllerNode, 
  ModelNode, 
  ExecutionLayer, 
  ServiceDependency 
} from '../types/semantic';

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
    // TODO: Add Repository layer detection if needed
    return 'unknown';
  }

  /**
   * Extracts methods and their properties from a parsed Class AST.
   * This is a stub for future AST traversal.
   */
  public extractMethods(classAST: any): string[] {
    // Stub implementation
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
  public linkGraph(fromNode: string, toNode: string, type: ServiceDependency['type'], weight = 1.0): void {
    this.graph.edges.push({
      from: fromNode,
      to: toNode,
      type,
      weight
    });
  }

  /**
   * Gets the final assembled graph.
   */
  public getGraph(): ServiceGraph {
    return this.graph;
  }
}
