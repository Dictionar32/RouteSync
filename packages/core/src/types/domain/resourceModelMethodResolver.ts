import { PrimitiveKind, PrimitiveType, ReadonlyCollectionType, CollectionKind, ReferenceType, type SemanticType } from '../../compiler/types/SemanticType';
import type { ResourceExpressionModel } from './resourceExpressionModel';
import { SemanticValueFactory, type MethodName, type PropertyName } from './semanticValues';
import type { ModelSemanticDefinition } from './models';
import { matchResourceModelMethodMeaning, type ResourceModelMethodMeaning } from './resourceModelMethodMeaning';
import type { ResourceMethodInvocation, ResourceMethodResult, ResourceMethodSemanticOrigin, ResourceMethodTraversalProjection, ResourceQueryScalarProjection, ResourceQueryState } from './resourceModelMethodSurface';
import { createResourceModelSemanticSurface, type ResourceModelSurface } from './resourceModelSurface';
import { meaningFor } from './resourceModelMethodResolverMeaning';
import { resolveResourceQueryProjection } from './resourceModelMethodResolverProjection';
import { resolveResourceQueryOperation } from './resourceModelMethodResolverOperation';
import type { ResourceResolvedQueryOperation } from './resourceQueryOperation';

export { meaningFor };
export { knownMethodNames } from './resourceModelMethodResolverMeaning';
export { resolveResourceQueryProjection } from './resourceModelMethodResolverProjection';

function semanticOrigin(state: ResourceQueryState, method: MethodName): ResourceMethodSemanticOrigin { return Object.freeze({ receiver: state, method, meaning: meaningFor(method) }); }
function modelType(model: ModelSemanticDefinition): SemanticType { return ReferenceType.model('', model.identity.name.value.value); }
function collectionType(model: ModelSemanticDefinition): { readonly elementType: SemanticType; readonly semanticType: SemanticType } {
  const elementType = modelType(model);
  return Object.freeze({ elementType, semanticType: new ReadonlyCollectionType(CollectionKind.ARRAY, elementType) });
}
function scalarType(operation: Extract<ResourceModelMethodMeaning, { kind: 'scalar' }>['operation']): SemanticType {
  const types: Readonly<Record<'exists' | 'count' | 'sum' | 'avg' | 'min' | 'max' | 'value', SemanticType>> = {
    exists: new PrimitiveType(PrimitiveKind.BOOLEAN),
    count: new PrimitiveType(PrimitiveKind.NUMBER),
    sum: new PrimitiveType(PrimitiveKind.NUMBER),
    avg: new PrimitiveType(PrimitiveKind.NUMBER),
    min: new PrimitiveType(PrimitiveKind.NUMBER),
    max: new PrimitiveType(PrimitiveKind.NUMBER),
    value: new PrimitiveType(PrimitiveKind.NUMBER),
  };
  return types[operation];
}

function queryBuilderResult(state: ResourceQueryState, method: MethodName, meaning: Extract<ResourceModelMethodMeaning, { kind: 'query_origin' | 'query_mutation' }>): ResourceMethodResult {
  const origin = semanticOrigin(state, method);
  const semanticType = modelType(state.model);
  return { kind: 'query_builder', origin, model: state.model, semanticType, traversal: { kind: 'query_builder', model: state.model, semanticType, target: { kind: 'query', model: state.model, semanticType }, cardinality: { kind: 'query' }, next: { kind: 'query_builder', model: state.model } } };
}

function singleModelResult(state: ResourceQueryState, method: MethodName, meaning: Extract<ResourceModelMethodMeaning, { kind: 'single_model' }>): ResourceMethodResult {
  const origin = semanticOrigin(state, method);
  const semanticType = modelType(state.model);
  return { kind: 'single_model', origin, model: state.model, lookup: meaning, semanticType, traversal: { kind: 'single_model', model: state.model, semanticType, target: { kind: 'model', model: state.model, semanticType }, cardinality: { kind: 'single' }, next: { kind: 'model_instance', model: state.model } } };
}

function modelCollectionResult(state: ResourceQueryState, method: MethodName): ResourceMethodResult {
  const elementType = modelType(state.model);
  const semanticType = new ReadonlyCollectionType(CollectionKind.ARRAY, elementType);
  const origin = semanticOrigin(state, method);
  const traversal: Extract<ResourceMethodTraversalProjection, { kind: 'model_collection' }> = {
    kind: 'model_collection', model: state.model, elementType, semanticType,
    target: { kind: 'collection', model: state.model, elementType, semanticType },
    cardinality: { kind: 'collection' }, next: { kind: 'model_instance', model: state.model }
  };
  return { kind: 'model_collection', origin, model: state.model, elementType, semanticType, traversal };
}

function paginatedCollectionResult(state: ResourceQueryState, method: MethodName, meaning: Extract<ResourceModelMethodMeaning, { kind: 'paginated_collection' }>): ResourceMethodResult {
  const elementType = modelType(state.model);
  const semanticType = new ReadonlyCollectionType(CollectionKind.ARRAY, elementType);
  const origin = semanticOrigin(state, method);
  const traversal: Extract<ResourceMethodTraversalProjection, { kind: 'paginated_collection' }> = {
    kind: 'paginated_collection', model: state.model, elementType, semanticType,
    target: { kind: 'collection', model: state.model, elementType, semanticType },
    cardinality: { kind: 'paginated_collection' }, next: { kind: 'model_instance', model: state.model }
  };
  return { kind: 'paginated_collection', origin, model: state.model, delivery: meaning.delivery, elementType, semanticType, traversal };
}

function scalarResult(state: ResourceQueryState, method: MethodName, meaning: Extract<ResourceModelMethodMeaning, { kind: 'scalar' }>): ResourceMethodResult {
  const origin = semanticOrigin(state, method);
  const semanticType = scalarType(meaning.operation);
  return { kind: 'scalar', origin, operation: meaning.operation, semanticType, projection: { kind: 'none' }, traversal: { kind: 'scalar', semanticType, target: { kind: 'scalar', semanticType }, cardinality: { kind: 'single' }, next: { kind: 'retain' } } };
}

function rejected(state: ResourceQueryState, method: MethodName, reason: 'value_collection' | 'unsupported'): ResourceMethodResult {
  return { kind: 'unsupported', origin: semanticOrigin(state, method), method, traversal: { kind: 'rejected', reason } };
}

export function resolveResourceModelMethod(state: ResourceQueryState, method: MethodName): ResourceMethodResult {
  const meaning = meaningFor(method);
  if (state.kind === 'model_instance' && meaning.kind !== 'query_origin') return rejected(state, method, 'unsupported');
  return matchResourceModelMethodMeaning(meaning, {
    query_origin: value => queryBuilderResult(state, method, value),
    query_mutation: value => queryBuilderResult(state, method, value),
    single_model: value => singleModelResult(state, method, value),
    model_collection: () => modelCollectionResult(state, method),
    paginated_collection: value => paginatedCollectionResult(state, method, value),
    scalar: value => scalarResult(state, method, value),
    value_collection: () => rejected(state, method, 'value_collection'),
    unsupported: () => rejected(state, method, 'unsupported'),
  });
}

export function resolveResourceMethodInvocation(state: ResourceQueryState, method: MethodName, arguments_: readonly ResourceExpressionModel[]): ResourceMethodInvocation {
  const meaning = meaningFor(method);
  const operation = resolveResourceQueryOperation(method, meaning, arguments_);
  let result: ResourceMethodResult;
  if (operation.kind === 'projection') result = resolveProjectionInvocation(state, method, operation, createResourceModelSemanticSurface(state.model));
  else result = resolveResourceModelMethod(state, method);
  return Object.freeze({ method, operation, meaning, result });
}

function resolveProjectionInvocation(
  state: ResourceQueryState,
  method: MethodName,
  operation: Extract<ResourceResolvedQueryOperation, { readonly kind: 'projection' }>,
  surface: ResourceModelSurface,
): ResourceMethodResult {
  return resolveResourceQueryProjection(state, method, operation.primary, surface);
}
