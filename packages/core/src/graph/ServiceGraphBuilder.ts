import type {
  ServiceGraph,
  ServiceNode,
  ControllerNode,
  ServiceModelNode,
  ExecutionLayer,
} from '../types/semantic';
import type { RouteSyncManifest } from '../types/upstream/manifest';
import type { ModelSemanticDefinition } from '../types/upstream/model';
import type { ActionName } from '../types/upstream/names';
import type { ServiceMethod, ServiceDependencyFacts, ResolvedServiceDependencies } from '../types/upstream/service';
import type { ControllerNodeName, ServiceNodeName } from '../types/semantic/nominalVocabulary';
import type { Lookup } from '../types/upstream/collections';
import { GraphNodeIndex } from './service/graphNodeIndex';
import type { GraphNodeReference } from './service/graphNodeIndex';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../semantic/foundation/relationMembership';
import { relationOptionFold } from '../semantic/foundation/relationalSequence';
import {
  detectExecutionLayer,
  buildServiceNode,
  buildControllerNode,
  buildModelNode,
  assembleServiceGraph,
  compileGraphFromSourceModel,
} from './service';
import type { ResourceReference } from '../types/upstream/semanticReferences';
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

export class ServiceGraphBuilder {
  private readonly modelsMap = GraphNodeIndex.empty<ServiceModelNode>();
  private readonly servicesMap = GraphNodeIndex.empty<ServiceNode>();
  private controllersIndex: RelationIndex<string, ControllerNode> = Object.freeze([]);
  private readonly edgeSink = new GraphEdgeRelationSink();

  public detectLayer(filePath: string, code: string): ExecutionLayer {
    return detectExecutionLayer(filePath, code);
  }


  public buildServiceNode(
    name: ServiceNodeName,
    methods: ServiceMethod[],
    dependencyFacts: ServiceDependencyFacts,
    resolvedDependencies: ResolvedServiceDependencies,
  ): ServiceNode {
    return buildServiceNode(name, methods, [], dependencyFacts, resolvedDependencies);
  }

  public buildControllerNode(name: ControllerNodeName, routes: string[], actions: ActionName[]): ControllerNode {
    return buildControllerNode(name, routes, actions);
  }

  public buildModelNode(model: ModelSemanticDefinition): ServiceModelNode {
    return buildModelNode(model);
  }

  public registerModel(name: string, model: ServiceModelNode): void {
    this.modelsMap.set(modelReference(name), model);
  }

  public registerService(name: string, service: ServiceNode): void {
    this.servicesMap.set(serviceReference(name), service);
  }

  public registerController(name: string, controller: ControllerNode): void {
    this.controllersIndex = relationIndexAdd(this.controllersIndex, name, controller);
  }

  public getModel(name: string): Lookup<ServiceModelNode> {
    return this.modelsMap.lookup(modelReference(name));
  }

  public getService(name: string): Lookup<ServiceNode> {
    return this.servicesMap.lookup(serviceReference(name));
  }

  public getController(name: string): Lookup<ControllerNode> {
    return relationOptionFold(
      relationIndexLookup(this.controllersIndex, name),
      () => ({ kind: 'missing' } as const),
      value => ({ kind: 'found', value } as const),
    );
  }

  public addGraphEdgeRelation(relation: GraphEdgeRelation): void {
    this.edgeSink.accept(relation);
  }

  public getGraph(): ServiceGraph {
    return assembleServiceGraph(this.modelsMap, this.servicesMap, this.controllersIndex, this.edgeSink.materialize());
  }

  private graphContext() {
    const owner = this;
    return {
      modelsMap: owner.modelsMap,
      servicesMap: owner.servicesMap,
      get controllersIndex(): RelationIndex<string, ControllerNode> { return owner.controllersIndex; },
      setController: (name: string, controller: ControllerNode): void => owner.registerController(name, controller),
      buildGraph: (): ServiceGraph => owner.getGraph(),
      addGraphEdgeRelation: (relation: GraphEdgeRelation): void => owner.addGraphEdgeRelation(relation),
    };
  }

  public buildFromRouteSyncManifest(manifest: RouteSyncManifest): ServiceGraph {
    return compileGraphFromSourceModel(manifest.sourceModel, this.graphContext());
  }
}
