/**
 * serviceGraphTypes.ts
 *
 * Service nodes, controller nodes, and graph topologies.
 *
 * @module core/types/semantic
 */

import type {
  ModelServiceMap,
  ModelControllerMap,
  ModelNodeMap
} from '../domain/semanticCollections';
import type { ServiceDependency, ServiceModelNode } from './modelGraphTypes';
import type { ActionName } from '../upstream/names';
import type { ServiceMethod, ServiceDependencyFacts, ResolvedServiceDependencies } from '../upstream/service';
import type { ControllerNodeName, ServiceNodeName, ConfidenceScore } from './nominalVocabulary';

export interface ServiceNode {
  kind: "service_node";
  name: ServiceNodeName;
  namespace?: string;
  methods: ServiceMethod[];
  layer: "service";
  dependencies: ServiceDependency[];
  dependencyFacts: ServiceDependencyFacts;
  resolvedDependencies: ResolvedServiceDependencies;
  confidence: ConfidenceScore;
}

export interface ControllerAction {
  name: ActionName;
}

export interface ControllerNode {
  kind: "controller_node";
  name: ControllerNodeName;
  routes: string[];
  actions: ControllerAction[];
  layer: "controller";
  calls: string[];
  confidence: ConfidenceScore;
}

export interface ServiceGraph {
  services: ModelServiceMap<ServiceNode>;
  controllers: ModelControllerMap<ControllerNode>;
  models: ModelNodeMap<ServiceModelNode>;
  edges: ServiceDependency[];
}
