import { PrimitiveKind, PrimitiveType, ReadonlyCollectionType, CollectionKind, ErrorType } from '../../compiler/types/SemanticType';
import type { MethodName } from './semanticValues';
import type { ResourceMethodResult, ResourceQueryState } from './resourceModelMethodSurface';
import type { ResourceQueryProjection } from './resourceQueryOperation';
import type { ResourceModelSurface } from './resourceModelSurface';
import type { ModelSemanticColumn, ModelSemanticAccessor } from './models';
import { meaningFor } from './resourceModelMethodResolverMeaning';

type ProjectionContext = {
  readonly state: ResourceQueryState;
  readonly method: MethodName;
  readonly property: import('./semanticValues').PropertyName;
  readonly semantic: ModelSemanticColumn | ModelSemanticAccessor;
  readonly semanticType: import('../../compiler/types/SemanticType').SemanticType;
};

type ProjectionHandler = (context: ProjectionContext) => ResourceMethodResult;

const projectionHandlers: Readonly<Record<'pluck' | 'value' | 'sum' | 'avg' | 'min' | 'max', ProjectionHandler>> = {
  pluck: context => valueCollectionResult(context),
  value: context => valueResult(context),
  sum: context => aggregateResult(context, 'sum'),
  avg: context => aggregateResult(context, 'avg'),
  min: context => aggregateResult(context, 'min'),
  max: context => aggregateResult(context, 'max'),
};

export function resolveResourceQueryProjection(
  state: ResourceQueryState,
  method: MethodName,
  projection: Extract<ResourceQueryProjection, { readonly kind: 'property' }>,
  surface: ResourceModelSurface,
): ResourceMethodResult {
  if (state.kind !== 'query_builder') return unsupported(state, method);
  const member = surface.resolveProperty(projection.property);
  if (member.kind !== 'found') return unsupported(state, method);
  if (member.resolution.semantic.kind === 'relation') return unsupported(state, method);
  const context: ProjectionContext = {
    state,
    method,
    property: member.resolution.property,
    semantic: member.resolution.semantic,
    semanticType: member.resolution.semanticType,
  };
  return projectionHandlers[method.value.value as keyof typeof projectionHandlers](context);
}

function origin(context: ProjectionContext) {
  return Object.freeze({ receiver: context.state, method: context.method, meaning: meaningFor(context.method) });
}

function valueCollectionResult(context: ProjectionContext): ResourceMethodResult {
  const semantic = context.semantic;
  const semanticType = context.semanticType;
  return { kind: 'value_collection', origin: origin(context), element: { kind: 'property', property: context.property, semantic, semanticType }, semanticType: new ReadonlyCollectionType(CollectionKind.ARRAY, semanticType), cardinality: { kind: 'collection' }, traversal: { kind: 'rejected', reason: 'value_collection' } };
}

function valueResult(context: ProjectionContext): ResourceMethodResult {
  const semantic = context.semantic;
  const semanticType = context.semanticType;
  return { kind: 'scalar', origin: origin(context), operation: 'value', semanticType, cardinality: { kind: 'single' }, projection: { kind: 'property', property: context.property, semantic, semanticType }, traversal: { kind: 'scalar', semanticType, target: { kind: 'scalar', semanticType }, cardinality: { kind: 'single' }, next: { kind: 'retain' } } };
}

function aggregateResult(context: ProjectionContext, operation: 'sum' | 'avg' | 'min' | 'max'): ResourceMethodResult {
  const semantic = context.semantic;
  const semanticType = context.semanticType;
  const resultType = new PrimitiveType(PrimitiveKind.NUMBER);
  return { kind: 'scalar', origin: origin(context), operation, semanticType: resultType, cardinality: { kind: 'single' }, projection: { kind: 'aggregate', operation, property: context.property, semantic, inputType: semanticType, semanticType: resultType }, traversal: { kind: 'scalar', semanticType: resultType, target: { kind: 'scalar', semanticType: resultType }, cardinality: { kind: 'single' }, next: { kind: 'retain' } } };
}



function unsupported(state: ResourceQueryState, method: MethodName): ResourceMethodResult {
  return { kind: 'unsupported', origin: Object.freeze({ receiver: state, method, meaning: meaningFor(method) }), method, semanticType: new ErrorType('resource method unsupported'), cardinality: { kind: 'single' }, traversal: { kind: 'rejected', reason: 'unsupported' } };
}

