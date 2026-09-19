import type { ColumnName, PropertyName } from './semanticValues';

export type ResourceSqlNumericExpression =
  | { readonly kind: 'column'; readonly name: ColumnName }
  | { readonly kind: 'property'; readonly name: PropertyName }
  | { readonly kind: 'literal'; readonly value: number }
  | { readonly kind: 'binary'; readonly operator: 'add' | 'subtract' | 'multiply' | 'divide'; readonly left: ResourceSqlNumericExpression; readonly right: ResourceSqlNumericExpression };

export type ResourceSqlExpressionResult =
  | { readonly kind: 'numeric' };

export type ResourceSqlExpression =
  | { readonly kind: 'numeric'; readonly expression: ResourceSqlNumericExpression; readonly result: ResourceSqlExpressionResult }
  | { readonly kind: 'column'; readonly name: ColumnName; readonly result: ResourceSqlExpressionResult };

export interface ResourceSqlRawExpressionModel {
  readonly source: { readonly kind: 'sql_source'; readonly value: string };
  readonly expression: ResourceSqlExpression;
}
