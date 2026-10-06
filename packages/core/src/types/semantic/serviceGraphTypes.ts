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
import type { GraphEdgeRelation } from '../../graph/service/graphEdgeRelation';
import type { ActionName } from '../upstream/names';
import type { ControllerNodeName, ServiceNodeName, ConfidenceScore } from './nominalVocabulary';

export interface ServiceNode {
  kind: "service_node";
  name: ServiceNodeName;
  namespace?: string;
  readonly methods: readonly { readonly name: ActionName }[];
  layer: "service";
  confidence: ConfidenceScore;
}

export interface ControllerAction {
  readonly name: ActionName;
}

export interface ControllerNode {
  kind: "controller_node";
  name: ControllerNodeName;
  readonly actions: readonly ControllerAction[];
  layer: "controller";
  confidence: ConfidenceScore;
}

export interface ServiceGraph {
  services: ModelServiceMap<ServiceNode>;
  controllers: ModelControllerMap<ControllerNode>;
  models: ModelNodeMap<ServiceModelNode>;
  /** Canonical semantic graph relations, including origin/provenance lineage. */
  readonly edgeRelations: readonly GraphEdgeRelation[];
  /** Compatibility projection for existing graph consumers. */
  readonly edges: readonly ServiceDependency[];
}
