import type { ExpressionAst } from './ast';
import type { Expression, ModelStaticOperation, QueryOperation } from './expression';
import type { ModelName } from './names';
import type { SourceSpan } from './provenance';
import type { Option, Sequence } from './collections';

export type QueryOperationAst =
  | { readonly kind: 'instance'; readonly operation: QueryOperation }
  | { readonly kind: 'model_static'; readonly operation: ModelStaticOperation }
  | { readonly kind: 'database_table'; readonly expression: Expression };

export type QuerySubqueryRole =
  | { readonly kind: 'select' }
  | { readonly kind: 'from' }
  | { readonly kind: 'where' }
  | { readonly kind: 'where_exists' }
  | { readonly kind: 'where_in' }
  | { readonly kind: 'where_scalar' }
  | { readonly kind: 'join' }
  | { readonly kind: 'lateral_join' }
  | { readonly kind: 'union' }
  | { readonly kind: 'relation' }
  | { readonly kind: 'nested' };

export type QuerySubqueryOuterReference = {
  readonly kind: 'query_outer_reference';
  readonly expression: Expression;
  readonly source: SourceSpan;
};

export type QuerySubqueryCorrelation =
  | { readonly kind: 'correlated'; readonly references: Sequence<QuerySubqueryOuterReference> }
  | { readonly kind: 'uncorrelated' };

export type QuerySubqueryAst = {
  readonly kind: 'query_subquery_ast';
  readonly operations: Sequence<QueryOperationAst>;
  readonly role: QuerySubqueryRole;
  readonly alias: Option<Expression>;
  readonly correlation: QuerySubqueryCorrelation;
  readonly expression: Expression;
  readonly model: { readonly kind: 'known'; readonly name: ModelName } | { readonly kind: 'unknown' };
  readonly source: SourceSpan;
  readonly nestedQueries: readonly QuerySubqueryAst[];
};

export type QueryAst = {
  readonly kind: 'query_ast';
  readonly operations: Sequence<QueryOperationAst>;
  readonly expression: ExpressionAst;
  readonly model: { readonly kind: 'known'; readonly name: ModelName } | { readonly kind: 'unknown' };
  readonly source: SourceSpan;
  readonly nestedQueries: readonly QuerySubqueryAst[];
};

export type QueryAsts = {
  readonly kind: 'query_asts';
  readonly items: Sequence<QueryAst>;
};
