import type { ServiceGraphNodeReference, ServiceDependency } from '../../types/semantic/modelGraphTypes';

/** Closed origin vocabulary for graph-edge derivation. */
export type GraphEdgeRelationOrigin =
  | 'service_dependency'
  | 'controller_dependency'
  | 'controller_resource_dependency'
  | 'controller_model_dependency'
  | 'model_relation'
  | 'resource_model_dependency';

/** Canonical semantic relation consumed by the graph materialization boundary. */
export interface GraphEdgeRelation {
  readonly kind: 'graph_edge_relation';
  readonly from: ServiceGraphNodeReference;
  readonly to: ServiceGraphNodeReference;
  readonly type: ServiceDependency['type'];
  readonly weight: number;
  readonly origin: GraphEdgeRelationOrigin;
}

export const createGraphEdgeRelation = (
  from: ServiceGraphNodeReference,
  to: ServiceGraphNodeReference,
  type: ServiceDependency['type'],
  origin: GraphEdgeRelationOrigin,
  weight = 1,
): GraphEdgeRelation => Object.freeze({
  kind: 'graph_edge_relation',
  from,
  to,
  type,
  weight,
  origin,
});
