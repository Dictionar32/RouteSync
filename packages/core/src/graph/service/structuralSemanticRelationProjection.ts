import type { StructuralSemanticRelation } from '../../types/upstream/semanticReferences';
import type { ServiceDependency } from '../../types/semantic/modelGraphTypes';
import type { GraphEdgeRelation } from './graphEdgeRelation';
import { graphEdgeRelationOperations } from './graphEdgeRelation';

/** Closed result for the structural-relation -> graph-edge boundary. */
export type StructuralGraphEdgeProjection =
  | { readonly kind: 'projected'; readonly relation: GraphEdgeRelation }
  | { readonly kind: 'not_projectable'; readonly sourceKind: StructuralSemanticRelation['kind'] };

export interface StructuralSemanticRelationProjectionOperationsInterface {
  readonly project: (relation: StructuralSemanticRelation) => StructuralGraphEdgeProjection;
}

const projectStructuralSemanticRelationToGraphEdgeValue = (
  relation: StructuralSemanticRelation,
): StructuralGraphEdgeProjection => {
  switch (relation.kind) {
    case 'controller_dependency':
      return {
        kind: 'projected',
        relation: graphEdgeRelationOperations.create(
          relation.controller,
          relation.dependency,
          'calls',
          'controller_dependency',
          1,
        ),
      };
    case 'controller_resource':
      return {
        kind: 'projected',
        relation: graphEdgeRelationOperations.create(
          relation.controller,
          relation.resource,
          'composes',
          'controller_resource_dependency',
          1,
        ),
      };
    case 'controller_model':
      return relation.model.kind === 'model_class'
        ? {
            kind: 'projected',
            relation: graphEdgeRelationOperations.create(
              relation.controller,
              { kind: 'model_reference', name: relation.model.name },
              'depends_on_model',
              'controller_model_dependency',
              1,
            ),
          }
        : { kind: 'not_projectable', sourceKind: relation.kind };
    case 'resource_model':
      return {
        kind: 'projected',
        relation: graphEdgeRelationOperations.create(
          relation.resource,
          relation.model,
          'depends_on_model',
          'resource_model_dependency',
          1,
        ),
      };
    case 'model_relation':
      return {
        kind: 'projected',
        relation: graphEdgeRelationOperations.create(
          relation.model,
          relation.target,
          'depends_on_model',
          'model_relation',
          1,
          {
            kind: 'model_relation',
            relation: relation.relation,
            ...(relation.relation.provenance === undefined ? {} : { lineage: relation.relation.provenance }),
          },
        ),
      };
    case 'route_controller':
      return {
        kind: 'projected',
        relation: graphEdgeRelationOperations.create(
          relation.route,
          relation.controller,
          'routes_to_controller',
          'route_controller',
          1,
        ),
      };
    case 'request_property':
    case 'response_resource':
    case 'response_model':
    case 'route_request':
    case 'route_response':
    case 'controller_response':
      return { kind: 'not_projectable', sourceKind: relation.kind };
  }
};

export const structuralSemanticRelationProjectionOperations: StructuralSemanticRelationProjectionOperationsInterface = Object.freeze({
  project: projectStructuralSemanticRelationToGraphEdgeValue,
});
