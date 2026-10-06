/**
 * modelGraphTypes.ts
 *
 * Service-graph model node descriptors, Eloquent cast collections, and dependencies.
 *
 * @module core/types/semantic
 */

import type { ModelDefinition } from '../upstream/model';
import type { ModelColumnFact } from '../upstream/modelSourceFacts';
import type { GraphSemanticRelation, GraphSemanticNodeReference } from '../../graph/service/graphRelation';

export type ExecutionLayer =
  | "controller"
  | "service"
  | "model"
  | "repository";

export type ServiceGraphNodeReference = GraphSemanticNodeReference;

/** @deprecated Compatibility aliases; graph implementation owns these contracts. */
export type GraphEdgeRelation = GraphSemanticRelation;
export type GraphEdgeRelationOrigin = GraphSemanticRelation['origin'];

/** Materialized graph edge retained as the public graph projection. */
export interface ServiceDependency {
  readonly from: ServiceGraphNodeReference;
  readonly to: ServiceGraphNodeReference;
  readonly type: "calls" | "composes" | "depends_on_class" | "depends_on_model" | "depends_on_service" | "uses_repository" | "routes_to_controller";
  readonly weight: number;
}



export interface GraphModelNodeSurface {
  readonly identity: ModelDefinition['identity'];
}

export interface ServiceModelNode {
  readonly kind: "model_node";
  readonly model: GraphModelNodeSurface;
  readonly layer: "model";
}

