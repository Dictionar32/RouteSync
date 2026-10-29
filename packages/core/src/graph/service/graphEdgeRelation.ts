import type { GraphSemanticRelation, GraphSemanticRelationOrigin } from './graphRelation';
import type { ServiceGraphNodeReference, ServiceDependency } from '../../types/semantic/modelGraphTypes';

/** Graph implementation alias for the canonical upstream semantic contract. */
export type GraphEdgeRelation = GraphSemanticRelation;
export type GraphEdgeRelationOrigin = GraphSemanticRelationOrigin;

export interface GraphEdgeRelationOperationsInterface {
  readonly create: (
    from: ServiceGraphNodeReference,
    to: ServiceGraphNodeReference,
    type: ServiceDependency['type'],
    origin: GraphEdgeRelationOrigin,
    weight?: number,
    provenance?: GraphEdgeRelation['provenance'],
  ) => GraphEdgeRelation;
}

const createGraphEdgeRelationValue: GraphEdgeRelationOperationsInterface['create'] = (
  from,
  to,
  type,
  origin,
  weight = 1,
  provenance,
) => Object.freeze({
  kind: 'graph_edge_relation',
  from,
  to,
  type,
  weight,
  origin,
  closed: true,
  ...(provenance === undefined ? {} : { provenance }),
});

export const graphEdgeRelationOperations: GraphEdgeRelationOperationsInterface = Object.freeze({
  create: createGraphEdgeRelationValue,
});
