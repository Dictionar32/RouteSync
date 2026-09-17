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

export interface ServiceNode {
  kind: "service_node";
  name: string;
  namespace?: string;
  methods: string[];
  layer: "service";
  dependencies: ServiceDependency[];
  confidence: number;
}

export interface ControllerAction {
  name: string;
}

export interface ControllerNode {
  kind: "controller_node";
  name: string;
  routes: string[];
  actions: ControllerAction[];
  layer: "controller";
  calls: string[];
  confidence: number;
}

export interface ServiceGraph {
  services: ModelServiceMap<ServiceNode>;
  controllers: ModelControllerMap<ControllerNode>;
  models: ModelNodeMap<ServiceModelNode>;
  edges: ServiceDependency[];
}
