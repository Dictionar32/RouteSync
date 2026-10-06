import { PrimitiveKind, PrimitiveType, ReadonlyCollectionType, CollectionKind, ErrorType } from './semanticType';
import type { MethodName } from './semanticValues';
import type { ResourceMethodResult, ResourceQueryState } from './resourceModelMethodSurface';
import type { ResourceQueryProjection } from './resourceQueryOperation';
import type { ResourceModelSurface } from './resourceModelSurface';
import type { ModelSemanticColumn, ModelSemanticAccessor } from './models';
import { meaningFor } from './resourceModelMethodResolverMeaning';
import { relationEqual, relationLookup, relationOptionFold, relationResolve } from '../../semantic/foundation/relationalSequence';

type ProjectionContext = {
  readonly state: ResourceQueryState;
  readonly method: MethodName;
  readonly property: import('./semanticValues').PropertyName;
  readonly semantic: ModelSemanticColumn | ModelSemanticAccessor;
  readonly semanticType: import('./semanticType').SemanticType;
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
  return relationResolve(relationEqual(state.kind, 'query_builder'), () => unsupported(state, method), () => {
    const member = surface.resolveProperty(projection.property);
    return relationResolve(relationEqual(member.kind, 'found'), () => unsupported(state, method), () => {
      const found = member as Extract<typeof member, { readonly kind: 'found' }>;
      return relationResolve(relationEqual(found.resolution.semantic.kind, 'relation'), () => unsupported(state, method), () => {
        const context: ProjectionContext = { state, method, property: found.resolution.property, semantic: found.resolution.semantic, semanticType: found.resolution.semanticType };
        return relationOptionFold(relationLookup(Object.entries(projectionHandlers), method.value.value), () => unsupported(state, method), ([, handler]) => handler(context));
      });
    });
  });
}

function origin(context: ProjectionContext) {
  return Object.freeze({ receiver: context.state, method: context.method, meaning: meaningFor(context.method) });
}

function valueCollectionResult(context: ProjectionContext): ResourceMethodResult {
  const semantic = context.semantic;
  const semanticType = context.semanticType;
  return { kind: 'value_collection', origin: origin(context), element: { kind: 'property', property: context.property, semantic, semanticType }, semanticType: ReadonlyCollectionType(CollectionKind.ARRAY, semanticType), cardinality: { kind: 'collection' }, traversal: { kind: 'rejected', reason: 'value_collection' } };
}

function valueResult(context: ProjectionContext): ResourceMethodResult {
  const semantic = context.semantic;
  const semanticType = context.semanticType;
  return { kind: 'scalar', origin: origin(context), operation: 'value', semanticType, cardinality: { kind: 'single' }, projection: { kind: 'property', property: context.property, semantic, semanticType }, traversal: { kind: 'scalar', semanticType, target: { kind: 'scalar', semanticType }, cardinality: { kind: 'single' }, next: { kind: 'retain' } } };
}

function aggregateResult(context: ProjectionContext, operation: 'sum' | 'avg' | 'min' | 'max'): ResourceMethodResult {
  const semantic = context.semantic;
  const semanticType = context.semanticType;
  const resultType = primitiveType(PrimitiveKind.NUMBER);
  return { kind: 'scalar', origin: origin(context), operation, semanticType: resultType, cardinality: { kind: 'single' }, projection: { kind: 'aggregate', operation, property: context.property, semantic, inputType: semanticType, semanticType: resultType }, traversal: { kind: 'scalar', semanticType: resultType, target: { kind: 'scalar', semanticType: resultType }, cardinality: { kind: 'single' }, next: { kind: 'retain' } } };
}



function unsupported(state: ResourceQueryState, method: MethodName): ResourceMethodResult {
  return { kind: 'unsupported', origin: Object.freeze({ receiver: state, method, meaning: meaningFor(method) }), method, semanticType: ErrorType('resource method unsupported'), cardinality: { kind: 'single' }, traversal: { kind: 'rejected', reason: 'unsupported' } };
}

