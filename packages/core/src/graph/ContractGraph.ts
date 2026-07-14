import { RouteManifest, ParsedModel, ParsedResource, ParsedRoute } from '../types/route';
import { SemanticResolution } from '../types/contract';
import { ServiceDependency } from '../types/semantic';

export type NodeId = string;

export function isResolvedField(field: { resolved?: SemanticResolution }): field is { resolved: SemanticResolution } {
  return field.resolved !== undefined && field.resolved.status === 'resolved';
}

export class ContractGraph {
  private resourceIndex = new Map<string, ParsedResource>();
  private modelIndex = new Map<string, ParsedModel>();
  private controllerIndex = new Map<string, ControllerNode>();
  private outgoing = new Map<NodeId, ServiceDependency[]>();
  private incoming = new Map<NodeId, ServiceDependency[]>();

  constructor(manifest: RouteManifest) {
    this.buildGraph(manifest);
  }

  private buildGraph(manifest: RouteManifest): void {
    // 1. Index Models (by reference) and normalize accessor resolutions
    if (manifest.models) {
      for (const model of manifest.models) {
        this.modelIndex.set(model.name, model);

        // Normalize accessors to use .resolved as Single Source of Truth
        if (model.accessors) {
          for (const accessor of Object.values(model.accessors)) {
            if (accessor) {
              accessor.resolved = accessor.resolved || accessor.semantic;
            }
          }
        }
      }
    }

    // 2. Index Resources (by reference) and normalize field resolutions
    if (manifest.resources) {
      for (const res of manifest.resources) {
        this.resourceIndex.set(res.name, res);

        if (res.fields) {
          for (const field of Object.values(res.fields)) {
            if (field) {
              field.resolved = field.resolved || field.semantic;
            }
          }
        }

        // Add implicit dependency edge from Resource to Model
        const potentialModelName = res.name.replace('Resource', '');
        if (this.modelIndex.has(potentialModelName)) {
          const edge: ServiceDependency = {
            from: `resource:${res.name}`,
            to: `model:${potentialModelName}`,
            type: 'depends_on_model',
            weight: 1.0
          };
          this.addEdge(edge);
        }
      }
    }

    // 3. Index Controllers (Group routes by controller name derived from route.name)
    if (manifest.routes) {
      for (const route of manifest.routes) {
        const parts = route.name.split('.');
        const controllerName = parts[0]
          ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + 'Controller'
          : 'UnknownController';

        let controller = this.controllerIndex.get(controllerName);
        if (!controller) {
          controller = { name: controllerName, routes: [] };
          this.controllerIndex.set(controllerName, controller);
        }
        controller.routes.push(route);

        // Add implicit dependencies from Controller to Model/Resource if referenced in response
        if (route.response) {
          const checkResponseModel = (node: any) => {
            if (!node || typeof node !== 'object') return;
            const meta = node.resolved || node.semantic || node;
            
            if (meta.type === 'model' && meta.model) {
              this.addEdge({
                from: `controller:${controllerName}`,
                to: `model:${meta.model}`,
                type: 'depends_on_model',
                weight: 1.0
              });
            } else if (meta.type === 'resource' && meta.resource) {
              this.addEdge({
                from: `controller:${controllerName}`,
                to: `resource:${meta.resource}`,
                type: 'depends_on_model',
                weight: 1.0
              });
            }

            if (node.fields && typeof node.fields === 'object') {
              Object.values(node.fields).forEach(f => checkResponseModel(f));
            }
          };
          checkResponseModel(route.response);
        }
      }
    }
  }

  private addEdge(edge: ServiceDependency): void {
    const fromId = edge.from;
    const toId = edge.to;

    // Outgoing edge index
    let outEdges = this.outgoing.get(fromId);
    if (!outEdges) {
      outEdges = [];
      this.outgoing.set(fromId, outEdges);
    }
    if (!outEdges.some(e => e.to === toId && e.type === edge.type)) {
      outEdges.push(edge);
    }

    // Incoming edge index
    let inEdges = this.incoming.get(toId);
    if (!inEdges) {
      inEdges = [];
      this.incoming.set(toId, inEdges);
    }
    if (!inEdges.some(e => e.from === fromId && e.type === edge.type)) {
      inEdges.push(edge);
    }
  }

  public resource(name: string): ParsedResource | undefined {
    return this.resourceIndex.get(name);
  }

  public model(name: string): ParsedModel | undefined {
    return this.modelIndex.get(name);
  }

  public controller(name: string): ControllerNode | undefined {
    return this.controllerIndex.get(name);
  }

  public getDependencies(id: NodeId): readonly ServiceDependency[] {
    return this.outgoing.get(id) || [];
  }

  public getDependents(id: NodeId): readonly ServiceDependency[] {
    return this.incoming.get(id) || [];
  }

  public getModelForResource(resourceName: string): ParsedModel | undefined {
    const deps = this.getDependencies(`resource:${resourceName}`);
    const modelDep = deps.find(d => d.type === 'depends_on_model' && d.to.startsWith('model:'));
    if (!modelDep) return undefined;
    const modelName = modelDep.to.substring(6); // remove 'model:' prefix
    return this.model(modelName);
  }

  public allResources(): ParsedResource[] {
    return Array.from(this.resourceIndex.values());
  }

  public allModels(): ParsedModel[] {
    return Array.from(this.modelIndex.values());
  }

  public allControllers(): ControllerNode[] {
    return Array.from(this.controllerIndex.values());
  }
}

export interface ControllerNode {
  name: string;
  routes: ParsedRoute[];
}
