import type { ModelName, PropertyName } from './semanticValues';
import type { ModelSemanticProperty } from './models';
import type { ResourceModelSurface } from './resourceModelSurface';
import type { ResourceTraversalCardinality, ResourceTraversalResolvedStep, ResourceTraversalStep, ResourceTraversalTarget } from './resourceTraversalModel';
import type { SemanticType } from '../../compiler/types/SemanticType';

export type ResourceTraversalMemberResolution =
  | { readonly kind: 'property'; readonly sourceModel: ModelName; readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'column' | 'accessor' }> }
  | { readonly kind: 'relation'; readonly sourceModel: ModelName; readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'relation' }>; readonly cardinality: ResourceTraversalCardinality };

export type ResourceTraversalResolutionResult =
  | { readonly kind: 'resolved'; readonly member: ResourceTraversalMemberResolution; readonly target: ResourceTraversalTarget; readonly cardinality: ResourceTraversalCardinality; readonly semanticType: SemanticType }
  | { readonly kind: 'unresolved'; readonly reason: 'source_model' | 'member' | 'method' };

export function resolveResourceTraversalMember(surface: ResourceModelSurface, step: ResourceTraversalStep): ResourceTraversalResolutionResult {
  if (step.kind === 'method') return { kind: 'unresolved', reason: 'method' };
  if (step.sourceModel.kind !== 'known') return { kind: 'unresolved', reason: 'source_model' };
  if (step.kind === 'property') {
    const lookup = surface.resolveProperty(step.property);
    if (lookup.kind === 'missing') return { kind: 'unresolved', reason: 'member' };
    const semanticType = lookup.resolution.semanticType;
    const target: ResourceTraversalTarget = { kind: 'scalar', semanticType };
    return {
      kind: 'resolved',
      member: { kind: 'property', sourceModel: surface.model, semantic: lookup.resolution.semantic },
      target,
      cardinality: { kind: 'single' },
      semanticType,
    };
  }
  const lookup = surface.resolveRelation(step.relation);
  if (lookup.kind === 'missing') return { kind: 'unresolved', reason: 'member' };
  const cardinality: ResourceTraversalCardinality = lookup.resolution.multiplicity.kind === 'collection'
    ? { kind: 'collection' }
    : { kind: 'single' };
  const target: ResourceTraversalTarget = lookup.resolution.multiplicity.kind === 'collection'
    ? { kind: 'collection', model: lookup.resolution.targetModel, elementType: lookup.resolution.semanticType, semanticType: lookup.resolution.semanticType }
    : { kind: 'model', model: lookup.resolution.targetModel, semanticType: lookup.resolution.semanticType };
  return {
    kind: 'resolved',
    member: {
      kind: 'relation',
      sourceModel: surface.model,
      semantic: lookup.resolution.semantic,
      cardinality,
    },
    target,
    cardinality,
    semanticType: lookup.resolution.semanticType,
  };
}
