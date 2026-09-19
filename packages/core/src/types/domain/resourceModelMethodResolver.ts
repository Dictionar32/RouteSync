import { PrimitiveKind, PrimitiveType, ReadonlyCollectionType, CollectionKind, ReferenceType, type SemanticType } from '../../compiler/types/SemanticType';
import type { ResourceExpressionModel } from './resourceExpressionModel';
import { SemanticValueFactory, type MethodName, type PropertyName } from './semanticValues';
import type { ModelSemanticDefinition } from './models';
import type { ResourceModelMethodMeaning } from './resourceModelMethodMeaning';
import type { ResourceMethodInvocation, ResourceMethodResult, ResourceMethodSemanticOrigin, ResourceQueryScalarProjection, ResourceQueryState } from './resourceModelMethodSurface';
import type { ResourceModelSurface } from './resourceModelSurface';
import { meaningFor } from './resourceModelMethodResolverMeaning';
import { resolveResourceQueryProjection } from './resourceModelMethodResolverProjection';
import { resolveResourceQueryOperation } from './resourceModelMethodResolverOperation';

export { meaningFor };
export { knownMethodNames } from './resourceModelMethodResolverMeaning';
export { resolveResourceQueryProjection } from './resourceModelMethodResolverProjection';

function semanticOrigin(state: ResourceQueryState, method: MethodName): ResourceMethodSemanticOrigin { return Object.freeze({ receiver: state, method, meaning: meaningFor(method) }); }
function modelType(model: ModelSemanticDefinition): SemanticType { return new ReferenceType('', model.identity.name.value); }
function collectionType(model: ModelSemanticDefinition): { readonly elementType: SemanticType; readonly semanticType: SemanticType } {
  const elementType = modelType(model);
  return Object.freeze({ elementType, semanticType: new ReadonlyCollectionType(CollectionKind.ARRAY, elementType) });
}
function scalarType(operation: Extract<ResourceModelMethodMeaning, { kind: 'scalar' }>['operation']): SemanticType { return operation === 'exists' ? new PrimitiveType(PrimitiveKind.BOOLEAN) : new PrimitiveType(PrimitiveKind.NUMBER); }

export function resolveResourceModelMethod(state: ResourceQueryState, method: MethodName): ResourceMethodResult {
  const meaning = meaningFor(method);
  if (state.kind === 'model_instance' && meaning.kind !== 'query_origin') return { kind: 'unsupported', origin: semanticOrigin(state, method), method };
  switch (meaning.kind) {
    case 'query_origin': case 'query_mutation': return { kind: 'query_builder', origin: semanticOrigin(state, method), model: state.model, semanticType: modelType(state.model) };
    case 'single_model': return { kind: 'single_model', origin: semanticOrigin(state, method), model: state.model, lookup: meaning, semanticType: modelType(state.model) };
    case 'model_collection': { const collection = collectionType(state.model); return { kind: 'model_collection', origin: semanticOrigin(state, method), model: state.model, ...collection }; }
    case 'paginated_collection': { const collection = collectionType(state.model); return { kind: 'paginated_collection', origin: semanticOrigin(state, method), model: state.model, delivery: meaning.delivery, ...collection }; }
    case 'scalar': return { kind: 'scalar', origin: semanticOrigin(state, method), operation: meaning.operation, semanticType: scalarType(meaning.operation), projection: { kind: 'none' } };
    case 'value_collection': return { kind: 'unsupported', origin: semanticOrigin(state, method), method };
    case 'unsupported': return { kind: 'unsupported', origin: semanticOrigin(state, method), method };
  }
}

export function resolveResourceMethodInvocation(state: ResourceQueryState, method: MethodName, arguments_: readonly ResourceExpressionModel[], surface?: ResourceModelSurface): ResourceMethodInvocation {
  const meaning = meaningFor(method);
  const operation = resolveResourceQueryOperation(method, meaning, arguments_);
  const result = state.kind === 'query_builder' && ['pluck', 'value', 'sum', 'avg', 'min', 'max'].includes(method.value)
    ? resolveProjectionInvocation(state, method, arguments_, surface)
    : resolveResourceModelMethod(state, method);
  return Object.freeze({ method, operation, meaning, result });
}

function resolveProjectionInvocation(state: ResourceQueryState, method: MethodName, arguments_: readonly ResourceExpressionModel[], surface?: ResourceModelSurface): ResourceMethodResult {
  const expression = arguments_[0];
  const property = expression === undefined ? undefined : propertyFromExpression(expression);
  return property === undefined || surface === undefined
    ? { kind: 'unsupported', origin: semanticOrigin(state, method), method }
    : resolveResourceQueryProjection(state, method, property, surface);
}

function propertyFromExpression(expression: ResourceExpressionModel): PropertyName | undefined {
  if (expression.semantic.kind !== 'requires_binding') return undefined;
  return expression.semantic.requirement.kind === 'property' ? expression.semantic.requirement.property : undefined;
}
