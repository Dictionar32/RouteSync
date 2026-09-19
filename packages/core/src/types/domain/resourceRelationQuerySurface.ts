import { PrimitiveKind, PrimitiveType, type SemanticType } from '../../compiler/types/SemanticType';
import type { EloquentRelationCardinality, RelationForeignKey } from './eloquentTypes';
import type { ModelSemanticProperty, ModelSemanticRelation } from './models';
import type { ResourceModelSurface } from './resourceModelSurface';
import type { ResourcePaginationDelivery } from './resourceResponseSemantic';
import type { MethodName, ModelName, PropertyName, RelationName } from './semanticValues';

export interface ResourceRelationSemanticTarget {
  readonly sourceModel: ModelName;
  readonly relation: ModelSemanticRelation;
  readonly targetModel: ModelName;
  readonly semanticType: SemanticType;
  readonly cardinality: EloquentRelationCardinality;
  readonly foreignKey: RelationForeignKey;
}

export type ResourceRelationQueryState =
  | { readonly kind: 'relation_query'; readonly target: ResourceRelationSemanticTarget; readonly surface: ResourceModelSurface }
  | { readonly kind: 'model_instance'; readonly model: ModelName };

export type ResourceRelationMethodKind =
  | 'query_mutation'
  | 'single_model'
  | 'model_collection'
  | 'paginated_collection'
  | 'scalar'
  | 'unsupported';

export type ResourceRelationScalarProjection =
  | {
      readonly kind: 'property';
      readonly property: PropertyName;
      readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'column' | 'accessor' }>;
      readonly semanticType: SemanticType;
    }
  | {
      readonly kind: 'aggregate';
      readonly operation: 'sum' | 'avg' | 'min' | 'max';
      readonly property: PropertyName;
      readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'column' | 'accessor' }>;
      readonly inputType: SemanticType;
      readonly semanticType: SemanticType;
    };

export type ResourceRelationMethodResult =
  | {
      readonly kind: 'relation_query';
      readonly target: ResourceRelationSemanticTarget;
      readonly semanticType: SemanticType;
      readonly cardinality: EloquentRelationCardinality;
    }
  | {
      readonly kind: 'single_model';
      readonly target: ResourceRelationSemanticTarget;
      readonly semanticType: SemanticType;
      readonly cardinality: { readonly kind: 'single' };
    }
  | {
      readonly kind: 'model_collection';
      readonly target: ResourceRelationSemanticTarget;
      readonly semanticType: SemanticType;
      readonly cardinality: { readonly kind: 'collection' };
    }
  | {
      readonly kind: 'paginated_collection';
      readonly target: ResourceRelationSemanticTarget;
      readonly delivery: ResourcePaginationDelivery;
      readonly semanticType: SemanticType;
      readonly cardinality: { readonly kind: 'paginated_collection' };
    }
  | {
      readonly kind: 'scalar';
      readonly target: ResourceRelationSemanticTarget;
      readonly operation: 'exists' | 'count' | 'sum' | 'avg' | 'min' | 'max' | 'value';
      readonly semanticType: SemanticType;
      readonly projection: ResourceRelationScalarProjection;
    }
  | {
      readonly kind: 'value_collection';
      readonly target: ResourceRelationSemanticTarget;
      readonly property: PropertyName;
      readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'column' | 'accessor' }>;
      readonly elementType: SemanticType;
      readonly semanticType: SemanticType;
    }
  | { readonly kind: 'unsupported'; readonly method: MethodName };

const MUTATIONS = Object.freeze(['where', 'orWhere', 'whereHas', 'with', 'latest', 'oldest', 'orderBy', 'lockForUpdate'] as const);
const SINGLE = Object.freeze(['first', 'firstOrFail', 'sole'] as const);
const COLLECTION = Object.freeze(['get', 'all', 'getModels'] as const);
const PAGINATED = Object.freeze(['paginate', 'simplePaginate', 'cursorPaginate'] as const);
const SCALAR = Object.freeze(['exists', 'count', 'sum', 'avg', 'min', 'max', 'value', 'pluck'] as const);

function has(values: readonly string[], method: MethodName): boolean { return values.includes(method.value); }

export function classifyResourceRelationMethod(method: MethodName): ResourceRelationMethodKind {
  if (has(MUTATIONS, method)) return 'query_mutation';
  if (has(SINGLE, method)) return 'single_model';
  if (has(COLLECTION, method)) return 'model_collection';
  if (has(PAGINATED, method)) return 'paginated_collection';
  if (has(SCALAR, method)) return 'scalar';
  return 'unsupported';
}

function scalarSemanticType(operation: 'exists' | 'count' | 'sum' | 'avg' | 'min' | 'max'): SemanticType {
  return operation === 'exists' ? new PrimitiveType(PrimitiveKind.BOOLEAN) : new PrimitiveType(PrimitiveKind.NUMBER);
}

function propertyFromSurface(surface: ResourceModelSurface, property: PropertyName): Extract<ModelSemanticProperty, { readonly kind: 'column' | 'accessor' }> | undefined {
  const lookup = surface.resolveProperty(property);
  if (lookup.kind !== 'found' || lookup.resolution.semantic.kind === 'relation') return undefined;
  return lookup.resolution.semantic;
}

export function resolveResourceRelationMethod(state: ResourceRelationQueryState, method: MethodName): ResourceRelationMethodResult {
  if (state.kind !== 'relation_query') return { kind: 'unsupported', method };
  const target = state.target;
  switch (classifyResourceRelationMethod(method)) {
    case 'query_mutation': return { kind: 'relation_query', target, semanticType: target.semanticType, cardinality: target.cardinality };
    case 'single_model': return { kind: 'single_model', target, semanticType: target.semanticType, cardinality: { kind: 'single' } };
    case 'model_collection': return { kind: 'model_collection', target, semanticType: target.semanticType, cardinality: { kind: 'collection' } };
    case 'paginated_collection': {
      const delivery: ResourcePaginationDelivery = method.value === 'paginate'
        ? { kind: 'length_aware' }
        : method.value === 'simplePaginate'
          ? { kind: 'simple' }
          : { kind: 'cursor' };
      return { kind: 'paginated_collection', target, delivery, semanticType: target.semanticType, cardinality: { kind: 'paginated_collection' } };
    }
    case 'scalar':
      if (method.value === 'exists' || method.value === 'count') {
        return {
          kind: 'scalar',
          target,
          operation: method.value,
          semanticType: scalarSemanticType(method.value),
          projection: {
            kind: 'property',
            property: target.relation.property,
            semantic: target.relation,
            semanticType: target.semanticType
          }
        };
      }
      return { kind: 'unsupported', method };
    case 'unsupported': return { kind: 'unsupported', method };
  }
}

export function resolveResourceRelationProjection(
  state: ResourceRelationQueryState,
  method: MethodName,
  property: PropertyName,
): ResourceRelationMethodResult {
  if (state.kind !== 'relation_query') return { kind: 'unsupported', method };
  const semantic = propertyFromSurface(state.surface, property);
  if (semantic === undefined) return { kind: 'unsupported', method };
  const target = state.target;
  const semanticType = semantic.type;
  switch (method.value) {
    case 'pluck':
      return {
        kind: 'value_collection',
        target,
        property,
        semantic,
        elementType: semanticType,
        semanticType
      };
    case 'value':
      return {
        kind: 'scalar',
        target,
        operation: 'value',
        semanticType,
        projection: { kind: 'property', property, semantic, semanticType }
      };
    case 'sum':
    case 'avg':
    case 'min':
    case 'max': {
      const resultType = new PrimitiveType(PrimitiveKind.NUMBER);
      return {
        kind: 'scalar',
        target,
        operation: method.value,
        semanticType: resultType,
        projection: { kind: 'aggregate', operation: method.value, property, semantic, inputType: semanticType, semanticType: resultType }
      };
    }
    default: return { kind: 'unsupported', method };
  }
}
