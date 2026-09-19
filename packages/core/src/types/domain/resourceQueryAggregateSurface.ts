import type { SemanticType } from '../../compiler/types/SemanticType';
import type { MethodName, ModelName, PropertyName } from './semanticValues';
import type { ResourceSqlRawExpressionModel } from './resourceSqlExpression';

export type ResourceAggregateKind =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'count'
  | 'exists'
  | 'value';

export type ResourceAggregateProjection =
  | { readonly kind: 'property'; readonly property: PropertyName }
  | { readonly kind: 'raw_expression'; readonly expression: ResourceSqlRawExpressionModel };

export interface ResourceQueryAggregateResult {
  readonly kind: 'scalar';
  readonly type: SemanticType;
}

export interface ResourceQueryAggregateInvocation {
  readonly model: ModelName;
  readonly method: MethodName;
  readonly aggregate: ResourceAggregateKind;
  readonly projection: ResourceAggregateProjection;
  readonly result: ResourceQueryAggregateResult;
}
