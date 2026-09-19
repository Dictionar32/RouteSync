import { PrimitiveKind, PrimitiveType } from '../../compiler/types/SemanticType';
import type { ResourceExpressionModel } from './resourceExpressionModel';
import { type MethodName, type PropertyName } from './semanticValues';
import type { ResourceMethodResult, ResourceQueryState } from './resourceModelMethodSurface';
import type { ResourceModelSurface } from './resourceModelSurface';
import { meaningFor } from './resourceModelMethodResolverMeaning';

export function resolveResourceQueryProjection(state: ResourceQueryState, method: MethodName, property: PropertyName, surface: ResourceModelSurface): ResourceMethodResult {
  if (state.kind !== 'query_builder') return unsupported(state, method);
  const member = surface.resolveProperty(property);
  if (member.kind !== 'found') return unsupported(state, method);
  const semantic = member.resolution.semantic;
  const semanticType = member.resolution.semanticType;
  if (semantic.kind === 'relation') return unsupported(state, method);
  const origin = Object.freeze({ receiver: state, method, meaning: meaningFor(method) });
  switch (method.value) {
    case 'pluck': return { kind: 'value_collection', origin, element: { kind: 'property', property: member.resolution.property, semantic, semanticType } };
    case 'value': return { kind: 'scalar', origin, operation: 'value', semanticType, projection: { kind: 'property', property: member.resolution.property, semantic, semanticType } };
    case 'sum': case 'avg': case 'min': case 'max': {
      const resultType = new PrimitiveType(PrimitiveKind.NUMBER);
      return { kind: 'scalar', origin, operation: method.value, semanticType: resultType, projection: { kind: 'aggregate', operation: method.value, property: member.resolution.property, semantic, inputType: semanticType, semanticType: resultType } };
    }
    default: return unsupported(state, method);
  }
}



function unsupported(state: ResourceQueryState, method: MethodName): ResourceMethodResult {
  return { kind: 'unsupported', origin: Object.freeze({ receiver: state, method, meaning: meaningFor(method) }), method };
}

export function propertyArgument(expression: ResourceExpressionModel): PropertyName | undefined {
  if (expression.semantic.kind !== 'requires_binding') return undefined;
  return expression.semantic.requirement.kind === 'property' ? expression.semantic.requirement.property : undefined;
}
