import type {
  ServiceGraph,
  ServiceNode,
  ControllerNode,
  ServiceModelNode,
  ExecutionLayer,
} from '../types/semantic';
import type { RouteSyncManifestGraphSurface } from './RouteSyncManifestGraphProjectionInterface';
import type { GraphModelNodeSurface } from '../types/semantic/modelGraphTypes';
import type { ActionName } from '../types/upstream/names';
import type { ControllerNodeName, ServiceNodeName } from '../types/semantic/nominalVocabulary';
import type { Lookup } from '../types/upstream/collections';
import { GraphNodeIndex } from './service/graphNodeIndex';
import type { GraphNodeReference } from './service/graphNodeIndex';
import { controllerRegistryOperations, type ControllerRegistry, type ControllerLookup } from './service/controllerRegistry';
import {
  graphNodeFactoryOperations,
  serviceGraphAssemblyOperations,
  manifestGraphCompilationOperations,
} from './service';
import type { ResourceReference } from '../types/upstream/semanticReferences';
import type { ServiceGraphBuilderInterface } from './ServiceGraphBuilderInterface';
import type { ServiceGraphAssemblyInterface } from './ServiceGraphAssemblyInterface';
import { GraphEdgeRelationSink } from './service/graphEdgeRelationSink';
import type { GraphEdgeRelation } from './service/graphEdgeRelation';

const modelReference = (name: string): GraphNodeReference => ({
  kind: 'model_reference',
  name: { kind: 'model_name', value: { kind: 'string_value', value: name } },
});

const serviceReference = (name: string): GraphNodeReference => ({
  kind: 'service_reference',
  name: { kind: 'class_name', value: { kind: 'string_value', value: name } },
});


export class ServiceGraphBuilder implements ServiceGraphBuilderInterface, ServiceGraphAssemblyInterface {
  private readonly modelsMap = GraphNodeIndex.empty<ServiceModelNode>();
  private readonly servicesMap = GraphNodeIndex.empty<ServiceNode>();
  private controllersIndex: ControllerRegistry = controllerRegistryOperations.empty();
  private readonly edgeSink = new GraphEdgeRelationSink();

  public detectLayer(filePath: string, code: string): ExecutionLayer {
    return graphNodeFactoryOperations.detectExecutionLayer(filePath, code);
  }


  public buildServiceNode(
    name: ServiceNodeName,
    methods: ActionName[],
  ): ServiceNode {
    return graphNodeFactoryOperations.buildServiceNode(name, methods);
  }

  public buildControllerNode(name: ControllerNodeName, actions: ActionName[]): ControllerNode {
    return graphNodeFactoryOperations.buildControllerNode(name, actions);
  }

  public buildModelNode(model: GraphModelNodeSurface): ServiceModelNode {
    return graphNodeFactoryOperations.buildModelNode(model);
  }

  public registerModel(name: string, model: ServiceModelNode): void {
    this.modelsMap.set(modelReference(name), model);
  }

  public registerService(name: string, service: ServiceNode): void {
    this.servicesMap.set(serviceReference(name), service);
  }

  public registerController(name: string, controller: ControllerNode): void {
    this.controllersIndex = this.controllersIndex.register(name, controller);
  }

  public getModel(name: string): Lookup<ServiceModelNode> {
    return this.modelsMap.lookup(modelReference(name));
  }

  public getService(name: string): Lookup<ServiceNode> {
    return this.servicesMap.lookup(serviceReference(name));
  }

  public getController(name: string): ControllerLookup {
    return this.controllersIndex.lookup(name);
  }

  public addGraphEdgeRelation(relation: GraphEdgeRelation): void {
    this.edgeSink.accept(relation);
  }

  public getGraph(): ServiceGraph {
    return serviceGraphAssemblyOperations.assemble(
      this.modelsMap,
      this.servicesMap,
      this.controllersIndex,
      this.edgeSink.getRelations(),
      this.edgeSink.materialize(),
    );
  }

  private graphContext() {
    const owner = this;
    return {
      modelsMap: owner.modelsMap,
      servicesMap: owner.servicesMap,
      get controllersIndex(): ControllerRegistry { return owner.controllersIndex; },
      setController: (name: string, controller: ControllerNode): void => owner.registerController(name, controller),
      buildGraph: (): ServiceGraph => owner.getGraph(),
      addGraphEdgeRelation: (relation: GraphEdgeRelation): void => owner.addGraphEdgeRelation(relation),
    };
  }

  public buildFromGraphSurface(surface: RouteSyncManifestGraphSurface): ServiceGraph {
    return manifestGraphCompilationOperations.compile(surface, this.graphContext());
  }

  public project(surface: RouteSyncManifestGraphSurface): ServiceGraph {
    return this.buildFromGraphSurface(surface);
  }
}

/** Runtime factory contract for graph composition. */
export interface ServiceGraphBuilderFactoryInterface {
  readonly createBuilder: () => ServiceGraphBuilderInterface;
  readonly createAssembly: () => ServiceGraphAssemblyInterface;
}

/** Composition factory: downstream receives contracts, not the concrete builder class. */
export const serviceGraphBuilderFactory: ServiceGraphBuilderFactoryInterface = Object.freeze({
  createBuilder: () => new ServiceGraphBuilder(),
  createAssembly: () => new ServiceGraphBuilder(),
});
