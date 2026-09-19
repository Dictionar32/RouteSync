import type { ResourceExpressionModel } from './resourceExpressionModel';
import type { MethodName, PropertyName, RelationName } from './semanticValues';

export type ResourceQueryComparisonOperator =
  | 'equal' | 'not_equal' | 'less_than' | 'less_than_or_equal'
  | 'greater_than' | 'greater_than_or_equal' | 'like' | 'not_like'
  | 'in' | 'not_in' | 'null' | 'not_null';

export interface ResourceQueryPredicate {
  readonly property: PropertyName;
  readonly operator: ResourceQueryComparisonOperator;
  readonly operand: ResourceExpressionModel;
}

export interface ResourceRelationLoadTarget {
  readonly path: readonly RelationName[];
  readonly selection: { readonly kind: 'all' } | { readonly kind: 'properties'; readonly properties: readonly PropertyName[] };
}

export type ResourceQueryProjection =
  | { readonly kind: 'property'; readonly property: PropertyName }
  | { readonly kind: 'raw'; readonly expression: ResourceExpressionModel };

export type ResourceQueryOrderingTarget =
  | { readonly kind: 'property'; readonly property: PropertyName }
  | { readonly kind: 'raw'; readonly expression: ResourceExpressionModel };

export type ResourceQueryOperationError =
  | { readonly kind: 'invalid_arguments' }
  | { readonly kind: 'unsupported_shape' };

export type ResourcePaginationSize =
  | { readonly kind: 'framework_default' }
  | { readonly kind: 'explicit'; readonly value: ResourceExpressionModel };


export type ResourceResolvedQueryOperation =
  | { readonly kind: 'none' }
  | { readonly kind: 'filter'; readonly method: MethodName; readonly predicate: ResourceQueryPredicate }
  | { readonly kind: 'relation_load'; readonly method: MethodName; readonly targets: readonly ResourceRelationLoadTarget[] }
  | { readonly kind: 'relation_filter'; readonly method: MethodName; readonly targets: readonly ResourceRelationLoadTarget[]; readonly callback: ResourceExpressionModel }
  | { readonly kind: 'ordering'; readonly method: MethodName; readonly target: ResourceQueryOrderingTarget; readonly direction: 'ascending' | 'descending' }
  | { readonly kind: 'projection'; readonly method: MethodName; readonly projections: readonly ResourceQueryProjection[] }
  | { readonly kind: 'pagination'; readonly method: MethodName; readonly pageSize: ResourcePaginationSize }
  | { readonly kind: 'window'; readonly method: MethodName; readonly operation: 'limit' | 'offset' | 'take' | 'skip'; readonly value: ResourceExpressionModel }
  | { readonly kind: 'grouping'; readonly method: MethodName; readonly properties: readonly PropertyName[] }
  | { readonly kind: 'having'; readonly method: MethodName; readonly predicate: ResourceQueryPredicate }
  | { readonly kind: 'locking'; readonly method: MethodName; readonly mode: 'for_update' | 'shared' }
  | { readonly kind: 'distinct'; readonly method: MethodName }
  | { readonly kind: 'conditional'; readonly method: MethodName; readonly branch: 'when' | 'unless'; readonly condition: ResourceExpressionModel; readonly callback: ResourceExpressionModel }
  | { readonly kind: 'invalid'; readonly method: MethodName; readonly error: ResourceQueryOperationError };
