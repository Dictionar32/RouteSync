import { PrimitiveKind, PrimitiveType, type SemanticType } from '../../compiler/types/SemanticType';
import type { ResourceModelSurface } from './resourceModelSurface';
import type { ResourceAggregateProjection } from './resourceQueryAggregateSurface';

export type ResourceAggregateResolution =
  | { readonly kind: 'resolved'; readonly type: SemanticType }
  | { readonly kind: 'rejected'; readonly reason: 'missing_projection' | 'missing_member' | 'unsupported_projection' };

export function resolveAggregateProjection(surface: ResourceModelSurface, projection: ResourceAggregateProjection): ResourceAggregateResolution {
  if (projection.kind === 'raw_expression') return projection.expression.expression.kind === 'numeric'
    ? Object.freeze({ kind: 'resolved', type: new PrimitiveType(PrimitiveKind.NUMBER) })
    : Object.freeze({ kind: 'rejected', reason: 'unsupported_projection' });
  const member = surface.resolveProperty(projection.property);
  if (member.kind === 'missing') return Object.freeze({ kind: 'rejected', reason: 'missing_member' });
  if (member.resolution.semantic.kind === 'relation') return Object.freeze({ kind: 'rejected', reason: 'unsupported_projection' });
  return Object.freeze({ kind: 'resolved', type: member.resolution.semanticType });
}
