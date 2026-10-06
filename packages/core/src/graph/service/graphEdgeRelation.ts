import type { GraphSemanticRelation, GraphSemanticRelationOrigin } from './graphRelation';
import type { ServiceGraphNodeReference, ServiceDependency } from '../../types/semantic/modelGraphTypes';

/** Graph implementation alias for the canonical upstream semantic contract. */
export type GraphEdgeRelation = GraphSemanticRelation;
export type GraphEdgeRelationOrigin = GraphSemanticRelationOrigin;

export const createGraphEdgeRelation = (
  from: ServiceGraphNodeReference,
  to: ServiceGraphNodeReference,
  type: ServiceDependency['type'],
  origin: GraphEdgeRelationOrigin,
  weight = 1,
  provenance?: GraphEdgeRelation['provenance'],
): GraphEdgeRelation => Object.freeze({
  kind: 'graph_edge_relation',
  from,
  to,
  type,
  weight,
  origin,
  closed: true,
  ...(provenance === undefined ? {} : { provenance }),
});
