import type { ModelSemanticRelation } from '../../types/upstream/model';
import type { ModelRelationProvenance } from '../../types/upstream/modelRelationProvenance';
import type { ClassReference, ControllerReference, ModelReference, ResourceReference, RouteReference, ServiceReference } from '../../types/upstream/semanticReferences';

/** Closed semantic node vocabulary accepted by the service-graph projection. */
export type GraphSemanticNodeReference =
  | ClassReference
  | ControllerReference
  | ModelReference
  | ResourceReference
  | RouteReference
  | ServiceReference;

export type GraphSemanticEdgeType =
  | 'calls'
  | 'composes'
  | 'depends_on_class'
  | 'depends_on_model'
  | 'depends_on_service'
  | 'uses_repository'
  | 'routes_to_controller';

export type GraphSemanticRelationOrigin =
  | 'service_dependency'
  | 'controller_dependency'
  | 'controller_resource_dependency'
  | 'controller_model_dependency'
  | 'model_relation'
  | 'resource_model_dependency'
  | 'route_controller';

/**
 * Downstream graph projection contract. It consumes canonical upstream semantic
 * references and relation provenance; upstream semantic relations remain the
 * authority and this graph contract must not redefine their meaning.
 */
export interface GraphSemanticRelation {
  readonly kind: 'graph_edge_relation';
  readonly from: GraphSemanticNodeReference;
  readonly to: GraphSemanticNodeReference;
  readonly type: GraphSemanticEdgeType;
  readonly weight: number;
  readonly origin: GraphSemanticRelationOrigin;
  readonly closed: true;
  readonly provenance?: {
    readonly kind: 'model_relation';
    readonly relation: ModelSemanticRelation;
    readonly lineage?: ModelRelationProvenance;
  };
}
