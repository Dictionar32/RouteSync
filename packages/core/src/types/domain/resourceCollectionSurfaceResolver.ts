import type { ModelName, MethodName, PropertyName, RelationName } from '../upstream/names';
import type { ResourceModelSurface } from './resourceModelSurface';
import type { ResourceCollectionState } from './resourceCollectionTransformation';

export type ResourceCollectionMemberResolution =
  | { readonly kind: 'relation'; readonly relation: RelationName; readonly sourceModel: ModelName; readonly semantic: Extract<import('../upstream/model').ModelSemanticProperty, { readonly kind: 'relation' }>; readonly targetModel: ModelName; readonly type: import('../../compiler/types/SemanticType').SemanticType; readonly cardinality: import('../upstream/model').EloquentRelationCardinality; readonly targetShape: import('../upstream/model').ModelRelationTargetShape; readonly traversalTarget: import('../upstream/model').ModelRelationTraversalTarget }
  | { readonly kind: 'property'; readonly property: PropertyName; readonly sourceModel: ModelName; readonly semantic: Extract<import('./models').ModelSemanticProperty, { readonly kind: 'column' | 'accessor' }>; readonly type: import('../../compiler/types/SemanticType').SemanticType }
  | { readonly kind: 'missing'; readonly name: PropertyName };

export type ResourceCollectionTransformResolution =
  | { readonly kind: 'resolved'; readonly method: MethodName; readonly member: ResourceCollectionMemberResolution; readonly result: ResourceCollectionState }
  | { readonly kind: 'rejected'; readonly method: MethodName; readonly reason: 'source_not_model_collection' | 'member_not_found' };

export function resolveCollectionPluck(source: ResourceCollectionState, method: MethodName, name: PropertyName, surface: ResourceModelSurface): ResourceCollectionTransformResolution {
  if (source.kind !== 'model_collection' && source.kind !== 'paginated_collection') return Object.freeze({ kind: 'rejected', method, reason: 'source_not_model_collection' });
  const property = surface.resolveProperty(name);
  if (property.kind === 'found') {
    const element = Object.freeze({ kind: 'property' as const, sourceModel: source.model, property: name, semantic: property.resolution.semantic, type: property.resolution.semanticType });
    return Object.freeze({ kind: 'resolved' as const, method, member: Object.freeze({ kind: 'property' as const, property: name, sourceModel: source.model, semantic: property.resolution.semantic, type: property.resolution.semanticType }), result: Object.freeze({ kind: 'value_collection' as const, element }) });
  }
  const relation = surface.resolveRelation({ kind: 'relation_name', value: name.value });
  if (relation.kind === 'missing') return Object.freeze({ kind: 'rejected', method, reason: 'member_not_found' });
  const element = Object.freeze({ kind: 'relation' as const, sourceModel: source.model, relation: relation.resolution.relation, semantic: relation.resolution.semantic, targetModel: relation.resolution.targetModel, cardinality: relation.resolution.cardinality, targetShape: relation.resolution.targetShape, traversalTarget: relation.resolution.traversalTarget });
  return Object.freeze({ kind: 'resolved' as const, method, member: Object.freeze({ kind: 'relation' as const, relation: relation.resolution.relation, sourceModel: source.model, semantic: relation.resolution.semantic, targetModel: relation.resolution.targetModel, type: relation.resolution.semanticType, cardinality: relation.resolution.cardinality, targetShape: relation.resolution.targetShape, traversalTarget: relation.resolution.traversalTarget }), result: Object.freeze({ kind: 'value_collection' as const, element }) });
}
