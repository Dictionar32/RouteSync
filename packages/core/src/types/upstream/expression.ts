import type { ClassName, ConstantName, ControllerName, FunctionName, MethodName, ModelName, PropertyName, RelationName, ResourceName, VariableName } from './names';
import type { ResourceOperation } from './resourceVocabulary';
import type { TypeExpression } from './typeVocabulary';
import type { SourceSpan } from './provenance';
import type { LiteralValue, SemanticValue } from './primitiveVocabulary';
import type { Expressions, MatchArms, ObjectProperties, RelationPaths, RelationPath, PropertyPath, SqlExpressions, ClosureCaptures, PropertyPaths, Sequence, Option } from './collections';
import type { NumberValue, StringValue } from './valueObjects';
import type { AssignmentTarget } from './assignment';
import type { SourceStatements } from './sourceStatements';
export type ConditionalExpressionBranches = { readonly kind: 'then_only'; readonly whenTrue: Expression } | { readonly kind: 'then_else'; readonly whenTrue: Expression; readonly whenFalse: Expression };
export type InterpolatedStringPart = { readonly kind: 'text'; readonly value: StringValue } | { readonly kind: 'expression'; readonly value: Expression };
export type InterpolatedStringParts = { readonly kind: 'interpolated_string_parts'; readonly items: Sequence<InterpolatedStringPart> };
export type ComparisonOperator =
  | { readonly kind: 'equal' }
  | { readonly kind: 'strict_equal' }
  | { readonly kind: 'not_equal' }
  | { readonly kind: 'strict_not_equal' }
  | { readonly kind: 'greater' }
  | { readonly kind: 'greater_equal' }
  | { readonly kind: 'less' }
  | { readonly kind: 'less_equal' }
  | { readonly kind: 'like' }
  | { readonly kind: 'not_like' };
export type CollectionOperation =
  | { readonly kind: 'is_empty' }
  | { readonly kind: 'to_array' }
  | { readonly kind: 'first' }
  | { readonly kind: 'pluck'; readonly field: PropertyName }
  | { readonly kind: 'filter'; readonly callback: Expression }
  | { readonly kind: 'values' }
  | { readonly kind: 'group_by'; readonly field: PropertyName }
  | { readonly kind: 'map'; readonly callback: Expression };
export type ExpressionArgumentName = { readonly kind: 'expression_argument_name'; readonly value: StringValue };
export type ExpressionArgument =
  | { readonly kind: 'positional'; readonly value: Expression }
  | { readonly kind: 'named'; readonly name: ExpressionArgumentName; readonly value: Expression }
  | { readonly kind: 'unpacked'; readonly value: Expression };
export type ExpressionArguments = { readonly kind: 'expression_arguments'; readonly items: Sequence<ExpressionArgument> };
export type ClosureParameterPassing =
  | { readonly kind: 'by_value' }
  | { readonly kind: 'by_reference' };
export type ClosureParameterVariadic =
  | { readonly kind: 'fixed' }
  | { readonly kind: 'variadic' };
export type ClosureParameterDefault =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: Expression };
export type ClosureParameterType =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: TypeExpression };
export type ClosureParameter = {
  readonly kind: 'closure_parameter';
  readonly name: VariableName;
  readonly type: ClosureParameterType;
  readonly passing: ClosureParameterPassing;
  readonly variadic: ClosureParameterVariadic;
  readonly defaultValue: ClosureParameterDefault;
};
export type ClosureParameters = { readonly kind: 'closure_parameters'; readonly items: Sequence<ClosureParameter> };
export type RequestArgument = { readonly kind: 'field'; readonly path: PropertyPath } | { readonly kind: 'default'; readonly value: Expression } | { readonly kind: 'fields'; readonly paths: PropertyPaths };
export type RequestArgumentMode = { readonly kind: 'absent' } | { readonly kind: 'present'; readonly value: RequestArgument };
export type ResponseJsonStatus =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: Expression };
export type ResponseOperation =
  | { readonly kind: 'json'; readonly data: Expression; readonly status: ResponseJsonStatus };
export type RedirectOperation =
  | { readonly kind: 'away'; readonly target: Expression };
export type ValidationOperation =
  | { readonly kind: 'ignore'; readonly value: Expression };
export type HttpClientOperation =
  | { readonly kind: 'accept_json' }
  | { readonly kind: 'as_json' }
  | { readonly kind: 'with_headers'; readonly headers: Expression }
  | { readonly kind: 'post'; readonly url: Expression; readonly payload: Expression };
export type StringValueOperation =
  | { readonly kind: 'trim' }
  | { readonly kind: 'to_string' };
export type PdfOperation =
  | { readonly kind: 'set_paper'; readonly size: Expression }
  | { readonly kind: 'download'; readonly filename: Expression };
export type ApplicationOperation =
  | { readonly kind: 'environment'; readonly environments: Expression };
export type DateTimeOperation =
  | { readonly kind: 'copy' }
  | { readonly kind: 'to_iso_string' }
  | { readonly kind: 'to_date_time_string' }
  | { readonly kind: 'sub_day' }
  | { readonly kind: 'add_months'; readonly value: Expression }
  | { readonly kind: 'sub_minutes'; readonly value: Expression }
  | { readonly kind: 'format'; readonly format: Expression }
  | { readonly kind: 'less_than'; readonly value: Expression }
  | { readonly kind: 'greater_than'; readonly value: Expression };
export type RequestOperation =
  | { readonly kind: 'all' } | { readonly kind: 'boolean'; readonly argument: RequestArgument }
  | { readonly kind: 'filled'; readonly argument: RequestArgument } | { readonly kind: 'get'; readonly argument: RequestArgument }
  | { readonly kind: 'input'; readonly argument: RequestArgument } | { readonly kind: 'integer'; readonly argument: RequestArgument }
  | { readonly kind: 'only'; readonly argument: RequestArgument } | { readonly kind: 'query'; readonly argument: RequestArgument }
  | { readonly kind: 'safe'; readonly argument: RequestArgumentMode } | { readonly kind: 'string'; readonly argument: RequestArgument }
  | { readonly kind: 'is'; readonly pattern: Expression }
  | { readonly kind: 'expects_json' }
  | { readonly kind: 'token' } | { readonly kind: 'user' } | { readonly kind: 'validate' } | { readonly kind: 'validated' };
export type QueryOrderingNullPlacement = { readonly kind: 'first' } | { readonly kind: 'last' };
export type QueryOrderingTarget =
  | { readonly kind: 'property'; readonly property: PropertyName }
  | { readonly kind: 'expression'; readonly expression: Expression }
  | { readonly kind: 'raw'; readonly expression: Expression; readonly bindings: Option<Expression> }
  | { readonly kind: 'subquery'; readonly expression: Expression };
export type QueryGrouping =
  | { readonly kind: 'query_grouping'; readonly targets: Sequence<QueryOrderingTarget> }
  | { readonly kind: 'raw'; readonly expression: Expression; readonly bindings: Option<Expression> };
export type QueryHavingCondition =
  | { readonly kind: 'basic'; readonly field: PropertyName; readonly operator: ComparisonOperator; readonly value: Expression }
  | { readonly kind: 'raw'; readonly expression: Expression; readonly bindings: Option<Expression> }
  | { readonly kind: 'between'; readonly field: PropertyName; readonly values: Expression };
export type QueryHaving = {
  readonly kind: 'query_having';
  readonly condition: QueryHavingCondition;
};
export type QueryLock =
  | { readonly kind: 'for_update' }
  | { readonly kind: 'shared' }
  | { readonly kind: 'custom'; readonly value: Expression };
export type QueryRelationCount =
  | { readonly kind: 'implicit' }
  | { readonly kind: 'explicit'; readonly value: Expression };
export type QueryRelationOperation =
  | { readonly kind: 'has'; readonly operator: ComparisonOperator; readonly count: QueryRelationCount }
  | { readonly kind: 'doesnt_have' }
  | { readonly kind: 'where_has'; readonly constraint: Expression; readonly operator: ComparisonOperator; readonly count: QueryRelationCount }
  | { readonly kind: 'where_doesnt_have'; readonly constraint: Expression }
  | { readonly kind: 'with' }
  | { readonly kind: 'with_where_has'; readonly constraint: Expression }
  | { readonly kind: 'load' }
  | { readonly kind: 'load_missing' };
export type QueryRelation = {
  readonly path: RelationPath;
  readonly operation: QueryRelationOperation;
  readonly source: SourceSpan;
};
export type QueryColumnReference = {
  readonly kind: 'query_column_reference';
  readonly expression: Expression;
  readonly source: SourceSpan;
};
export type QueryColumnComparison = {
  readonly kind: 'query_column_comparison';
  readonly left: QueryColumnReference;
  readonly operator: ComparisonOperator;
  readonly right: QueryColumnReference;
};
export type QueryColumnComparisons = {
  readonly kind: 'query_column_comparisons';
  readonly comparisons: Sequence<QueryColumnComparison>;
};
export type QueryColumnList = { readonly kind: 'query_column_list'; readonly columns: Sequence<QueryColumnReference> };
export type QueryDateRelative =
  | { readonly kind: 'today' }
  | { readonly kind: 'before_today' }
  | { readonly kind: 'after_today' }
  | { readonly kind: 'today_or_before' }
  | { readonly kind: 'today_or_after' }
  | { readonly kind: 'past' }
  | { readonly kind: 'future' }
  | { readonly kind: 'now_or_past' }
  | { readonly kind: 'now_or_future' };
export type QueryDatePart =
  | { readonly kind: 'date' }
  | { readonly kind: 'month' }
  | { readonly kind: 'day' }
  | { readonly kind: 'year' }
  | { readonly kind: 'time' }
  | { readonly kind: 'today' }
  | { readonly kind: 'before_today' }
  | { readonly kind: 'after_today' }
  | { readonly kind: 'today_or_before' }
  | { readonly kind: 'today_or_after' };
export type QueryLikeCaseSensitivity = { readonly kind: 'default' } | { readonly kind: 'case_sensitive'; readonly value: Expression };
export type QueryJsonCondition =
  | { readonly kind: 'contains'; readonly column: PropertyName; readonly path: Expression; readonly value: Expression }
  | { readonly kind: 'doesnt_contain'; readonly column: PropertyName; readonly path: Expression; readonly value: Expression }
  | { readonly kind: 'contains_key'; readonly column: PropertyName; readonly path: Expression }
  | { readonly kind: 'doesnt_contain_key'; readonly column: PropertyName; readonly path: Expression }
  | { readonly kind: 'length'; readonly column: PropertyName; readonly path: Expression; readonly operator: ComparisonOperator; readonly length: Expression }
  | { readonly kind: 'overlaps'; readonly column: PropertyName; readonly path: Expression; readonly value: Expression }
  | { readonly kind: 'doesnt_overlap'; readonly column: PropertyName; readonly path: Expression; readonly value: Expression };
export type QueryLikeNegation = { readonly kind: 'positive' } | { readonly kind: 'negated' };
export type QueryCondition =
  | { readonly kind: 'basic'; readonly field: PropertyName; readonly operator: ComparisonOperator; readonly value: Expression }
  | { readonly kind: 'column'; readonly comparison: QueryColumnComparison }
  | { readonly kind: 'column_group'; readonly comparisons: QueryColumnComparisons }
  | { readonly kind: 'between'; readonly field: PropertyName; readonly lower: Expression; readonly upper: Expression; readonly negated: boolean }
  | { readonly kind: 'between_columns'; readonly field: QueryColumnReference; readonly lower: QueryColumnReference; readonly upper: QueryColumnReference; readonly negated: boolean }
  | { readonly kind: 'value_between'; readonly value: Expression; readonly lower: QueryColumnReference; readonly upper: QueryColumnReference; readonly negated: boolean }
  | { readonly kind: 'in'; readonly field: PropertyName; readonly values: Expression; readonly negated: boolean }
  | { readonly kind: 'null'; readonly field: PropertyName; readonly negated: boolean }
  | { readonly kind: 'null_safe_equals'; readonly field: PropertyName; readonly value: Expression }
  | { readonly kind: 'date_part'; readonly part: QueryDatePart; readonly field: PropertyName; readonly operator: ComparisonOperator; readonly value: Expression }
  | { readonly kind: 'date_relative'; readonly part: QueryDateRelative; readonly field: PropertyName }
  | { readonly kind: 'row_values'; readonly columns: QueryColumnList; readonly operator: ComparisonOperator; readonly values: Expression }
  | { readonly kind: 'nested'; readonly expression: Expression }
  | { readonly kind: 'not'; readonly expression: Expression }
  | { readonly kind: 'relation'; readonly relation: QueryRelation }
  | { readonly kind: 'exists'; readonly query: Expression; readonly negated: boolean }
  | { readonly kind: 'raw'; readonly expression: Expression; readonly bindings: Option<Expression> }
  | { readonly kind: 'any'; readonly columns: QueryColumnList; readonly operator: ComparisonOperator; readonly value: Expression }
  | { readonly kind: 'all'; readonly columns: QueryColumnList; readonly operator: ComparisonOperator; readonly value: Expression }
  | { readonly kind: 'none'; readonly columns: QueryColumnList; readonly operator: ComparisonOperator; readonly value: Expression }
  | { readonly kind: 'like'; readonly field: PropertyName; readonly value: Expression; readonly caseSensitive: QueryLikeCaseSensitivity; readonly negated: QueryLikeNegation }
  | { readonly kind: 'json'; readonly condition: QueryJsonCondition }
  | { readonly kind: 'full_text'; readonly field: PropertyName; readonly value: Expression }
  | { readonly kind: 'vector_similarity'; readonly field: PropertyName; readonly vector: Expression; readonly threshold: Option<Expression>; readonly order: Option<Expression> }
  | { readonly kind: 'vector_distance'; readonly field: PropertyName; readonly vector: Expression; readonly maxDistance: Expression };
export type QueryRelationAggregateFunction =
  | { readonly kind: 'count' } | { readonly kind: 'sole' } | { readonly kind: 'doesnt_exist' }
  | { readonly kind: 'min' }
  | { readonly kind: 'max' }
  | { readonly kind: 'avg' }
  | { readonly kind: 'sum' }
  | { readonly kind: 'exists' };
export type QueryRelationAggregate = {
  readonly path: RelationPath;
  readonly function: QueryRelationAggregateFunction;
  readonly column: Option<PropertyName>;
  readonly alias: Option<PropertyName>;
  readonly constraint: Option<Expression>;
  readonly source: SourceSpan;
};
export type QueryProjection =
  | { readonly kind: 'columns'; readonly arguments: ExpressionArguments }
  | { readonly kind: 'raw'; readonly expressions: SqlExpressions }
  | { readonly kind: 'raw_expression'; readonly expression: Expression }
  | { readonly kind: 'subquery'; readonly query: Expression; readonly alias: Expression }
  | { readonly kind: 'expression'; readonly expression: Expression; readonly alias: Expression }
  | { readonly kind: 'vector_distance'; readonly column: Expression; readonly vector: Expression; readonly alias: Expression | undefined };
export type QueryIndexHint =
  | { readonly kind: 'use'; readonly index: Expression }
  | { readonly kind: 'force'; readonly index: Expression }
  | { readonly kind: 'ignore'; readonly index: Expression };
export type QueryChunkById = {
  readonly kind: 'query_chunk_by_id';
  readonly count: Expression;
  readonly callback: Expression;
  readonly column: PropertyName | undefined;
  readonly alias: PropertyName | undefined;
  readonly direction: OrderDirection;
};

export type QueryLazyById = {
  readonly kind: 'query_lazy_by_id';
  readonly chunkSize: Expression | undefined;
  readonly column: PropertyName | undefined;
  readonly alias: PropertyName | undefined;
  readonly direction: OrderDirection;
};

export type QueryIterationDirection =
  | { readonly kind: 'ascending' }
  | { readonly kind: 'descending' }
  | { readonly kind: 'dynamic'; readonly expression: Expression };

export type QueryIteration =
  | { readonly kind: 'chunk_map'; readonly callback: Expression; readonly count: Expression | undefined }
  | { readonly kind: 'each'; readonly callback: Expression; readonly count: Expression | undefined }
  | { readonly kind: 'each_by_id'; readonly callback: Expression; readonly count: Expression | undefined; readonly column: PropertyName | undefined; readonly alias: PropertyName | undefined; readonly direction: QueryIterationDirection }
  | { readonly kind: 'ordered_chunk_by_id'; readonly count: Expression; readonly callback: Expression; readonly column: PropertyName | undefined; readonly alias: PropertyName | undefined; readonly direction: QueryIterationDirection }
  | { readonly kind: 'ordered_lazy_by_id'; readonly chunkSize: Expression | undefined; readonly column: PropertyName | undefined; readonly alias: PropertyName | undefined; readonly direction: QueryIterationDirection };

export type QueryReturning = { readonly columns: Expression; readonly uniqueBy: Option<Expression> };
export type QueryMutation =
  | { readonly kind: 'insert_or_ignore'; readonly values: Expression }
  | { readonly kind: 'insert_or_ignore_returning'; readonly values: Expression; readonly returning: QueryReturning }
  | { readonly kind: 'insert_using'; readonly columns: Expression; readonly query: Expression }
  | { readonly kind: 'insert_or_ignore_using'; readonly columns: Expression; readonly query: Expression }
  | { readonly kind: 'increment_each'; readonly columns: Expression }
  | { readonly kind: 'decrement_each'; readonly columns: Expression }
  | { readonly kind: 'truncate' };

export type QueryPipeline =
  | { readonly kind: 'when'; readonly condition: Expression; readonly callback: Expression; readonly defaultCallback: Expression | undefined }
  | { readonly kind: 'unless'; readonly condition: Expression; readonly callback: Expression; readonly defaultCallback: Expression | undefined }
  | { readonly kind: 'tap'; readonly callback: Expression }
  | { readonly kind: 'pipe'; readonly callback: Expression };

export type QueryExecutionHook =
  | { readonly kind: 'before_query'; readonly callback: Expression }
  | { readonly kind: 'after_query'; readonly callback: Expression };

export type QueryExecutionConfiguration =
  | { readonly kind: 'use_write_pdo' }
  | { readonly kind: 'fetch_using'; readonly arguments: ExpressionArguments };

export type QueryTerminal =
  | { readonly kind: 'find_or'; readonly key: Expression; readonly columns: Option<Expression>; readonly callback: Option<Expression> }
  | { readonly kind: 'sole_value'; readonly field: PropertyName }
  | { readonly kind: 'raw_value'; readonly expression: Expression; readonly bindings: Option<Expression> };

export type QueryOperation =
  | { readonly kind: 'select'; readonly projection: QueryProjection }
  | { readonly kind: 'add_select'; readonly projection: QueryProjection }
  | { readonly kind: 'select_sub'; readonly projection: Extract<QueryProjection, { readonly kind: 'subquery' }> }
  | { readonly kind: 'select_expression'; readonly projection: Extract<QueryProjection, { readonly kind: 'expression' }> }
  | { readonly kind: 'from_sub'; readonly query: Expression; readonly alias: Expression }
  | { readonly kind: 'index_hint'; readonly hint: QueryIndexHint }
  | { readonly kind: 'select_vector_distance'; readonly projection: Extract<QueryProjection, { readonly kind: 'vector_distance' }> }
  | { readonly kind: 'explain' }
  | { readonly kind: 'distinct' }
  | { readonly kind: 'join'; readonly join: QueryJoin }
  | { readonly kind: 'left_join'; readonly join: QueryJoin }
  | { readonly kind: 'right_join'; readonly join: QueryJoin }
  | { readonly kind: 'cross_join'; readonly join: QueryJoin }
  | { readonly kind: 'join_sub'; readonly join: QueryJoin }
  | { readonly kind: 'join_lateral'; readonly join: QueryJoin }
  | { readonly kind: 'left_join_lateral'; readonly join: QueryJoin }
  | { readonly kind: 'straight_join'; readonly join: QueryJoin }
  | { readonly kind: 'union'; readonly query: Expression }
  | { readonly kind: 'union_all'; readonly query: Expression }
  | { readonly kind: 'having'; readonly having: QueryHaving }
  | { readonly kind: 'or_having'; readonly having: QueryHaving }
  | { readonly kind: 'lock'; readonly lock: QueryLock }
  | { readonly kind: 'offset'; readonly value: Expression }
  | { readonly kind: 'in_random_order' }
  | { readonly kind: 'random_order' }
  | { readonly kind: 'chunk'; readonly count: Expression; readonly callback: Expression }
  | { readonly kind: 'iteration'; readonly iteration: QueryIteration }
  | { readonly kind: 'mutation'; readonly mutation: QueryMutation }
  | { readonly kind: 'order_by_vector_distance'; readonly column: Expression; readonly vector: Expression }
  | { readonly kind: 'pipeline'; readonly pipeline: QueryPipeline }
  | { readonly kind: 'execution_hook'; readonly hook: QueryExecutionHook }
  | { readonly kind: 'execution_configuration'; readonly configuration: QueryExecutionConfiguration }
  | { readonly kind: 'terminal'; readonly terminal: QueryTerminal }
  | { readonly kind: 'lazy'; readonly chunkSize: Expression | undefined }
  | { readonly kind: 'lazy_by_id'; readonly value: QueryLazyById }
  | { readonly kind: 'insert'; readonly values: Expression }
  | { readonly kind: 'insert_get_id'; readonly values: Expression; readonly sequence: Option<Expression> }
  | { readonly kind: 'upsert'; readonly values: Expression; readonly uniqueBy: Expression; readonly update: Expression }
  | { readonly kind: 'force_delete' }
  | { readonly kind: 'restore' }
  | { readonly kind: 'with_trashed' }
  | { readonly kind: 'only_trashed' }
  | { readonly kind: 'without_trashed' }
  | { readonly kind: 'where'; readonly condition: QueryCondition }
  | { readonly kind: 'or_where'; readonly condition: QueryCondition }
  | { readonly kind: 'where_raw'; readonly condition: Extract<QueryCondition, { readonly kind: 'raw' }> }
  | { readonly kind: 'reorder'; readonly target: QueryOrderingTarget | undefined; readonly direction: OrderDirection | undefined } | { readonly kind: 'group_limit'; readonly value: Expression; readonly column: QueryOrderingTarget } | { readonly kind: 'in_order_of'; readonly column: PropertyName; readonly values: Expression }
  | { readonly kind: 'chunk_by_id'; readonly value: QueryChunkById }
  | { readonly kind: 'from_raw'; readonly expression: Expression; readonly bindings: Option<Expression> }
  | { readonly kind: 'lazy_by_id'; readonly value: QueryLazyById }
  | { readonly kind: 'timeout'; readonly seconds: Expression }
  | { readonly kind: 'relation'; readonly relation: QueryRelation }
  | { readonly kind: 'relation_aggregate'; readonly aggregate: QueryRelationAggregate }
  | { readonly kind: 'where_has'; readonly condition: Extract<QueryCondition, { readonly kind: 'relation' }> } | { readonly kind: 'where_key'; readonly value: Expression }
  | { readonly kind: 'with'; readonly relations: RelationPaths }
  | { readonly kind: 'latest'; readonly target: QueryOrderingTarget | undefined } | { readonly kind: 'oldest'; readonly target: QueryOrderingTarget | undefined } | { readonly kind: 'order_by'; readonly target: QueryOrderingTarget; readonly direction: OrderDirection } | { readonly kind: 'order_by_raw'; readonly target: Extract<QueryOrderingTarget, { readonly kind: 'raw' }> }
  | { readonly kind: 'limit'; readonly value: Expression }
  | { readonly kind: 'first' } | { readonly kind: 'first_or_fail' } | { readonly kind: 'find'; readonly key: Expression } | { readonly kind: 'get' } | { readonly kind: 'get_with_columns'; readonly columns: Expression } | { readonly kind: 'find_or_fail'; readonly key: Expression }
  | { readonly kind: 'paginate'; readonly perPage: Expression; readonly columns: Option<Expression>; readonly pageName: Option<Expression>; readonly page: Option<Expression> }
  | { readonly kind: 'simple_paginate'; readonly perPage: Expression; readonly columns: Option<Expression>; readonly pageName: Option<Expression> }
  | { readonly kind: 'cursor_paginate'; readonly perPage: Expression; readonly columns: Option<Expression>; readonly cursorName: Option<Expression>; readonly cursor: Option<Expression> }
  | { readonly kind: 'sum'; readonly value: AggregateOperand } | { readonly kind: 'avg'; readonly value: AggregateOperand } | { readonly kind: 'min'; readonly value: AggregateOperand } | { readonly kind: 'max'; readonly value: AggregateOperand }
  | { readonly kind: 'count' } | { readonly kind: 'sole' } | { readonly kind: 'doesnt_exist' } | { readonly kind: 'group_by'; readonly grouping: QueryGrouping } | { readonly kind: 'map'; readonly callback: Expression } | { readonly kind: 'filter'; readonly callback: Expression }
  | { readonly kind: 'values' } | { readonly kind: 'pluck'; readonly field: PropertyName; readonly key: Option<PropertyName> } | { readonly kind: 'value'; readonly field: PropertyName } | { readonly kind: 'exists' } | { readonly kind: 'select_raw'; readonly expressions: SqlExpressions } | { readonly kind: 'select_raw_expression'; readonly expression: Expression; readonly bindings: Option<Expression> }
  | { readonly kind: 'delete' } | { readonly kind: 'fill'; readonly values: Expression } | { readonly kind: 'create'; readonly values: Expression } | { readonly kind: 'update'; readonly values: Expression } | { readonly kind: 'update_or_create'; readonly lookup: Expression; readonly values: Expression }
  | { readonly kind: 'first_or_create'; readonly attributes: Expression; readonly values: Expression } | { readonly kind: 'update_or_insert'; readonly lookup: Expression; readonly values: Expression }
  | { readonly kind: 'increment'; readonly field: PropertyName; readonly amount: Expression; readonly updates: Option<Expression> } | { readonly kind: 'decrement'; readonly field: PropertyName; readonly amount: Expression; readonly updates: Option<Expression> } | { readonly kind: 'save' }
  | { readonly kind: 'load'; readonly relations: RelationPaths } | { readonly kind: 'lock_for_update' };
export type QueryJoinTarget =
  | { readonly kind: 'table'; readonly expression: Expression }
  | { readonly kind: 'subquery'; readonly expression: Expression; readonly alias: Expression }
  | { readonly kind: 'lateral'; readonly expression: Expression; readonly alias: Expression };
export type QueryJoinConstraint =
  | { readonly kind: 'expression'; readonly expression: Expression }
  | { readonly kind: 'closure'; readonly expression: Expression };
export type QueryJoin = {
  readonly target: QueryJoinTarget;
  readonly type: JoinType;
  readonly constraint: QueryJoinConstraint | undefined;
};
export type JoinType = { readonly kind: 'inner' } | { readonly kind: 'left' } | { readonly kind: 'right' } | { readonly kind: 'cross' } | { readonly kind: 'straight' };
export type AggregateOperand = { readonly kind: 'property'; readonly name: PropertyName } | { readonly kind: 'sql'; readonly expression: SqlExpression };
export type OrderDirection = { readonly kind: 'ascending' } | { readonly kind: 'descending' };
export type ModelStaticOperation =
  | { readonly kind: 'all' } | { readonly kind: 'query' } | { readonly kind: 'where'; readonly condition: QueryCondition }
  | { readonly kind: 'where_key'; readonly value: Expression } | { readonly kind: 'with'; readonly relations: RelationPaths }
  | { readonly kind: 'order_by'; readonly target: QueryOrderingTarget; readonly direction: OrderDirection }
  | { readonly kind: 'order_by_raw'; readonly target: Extract<QueryOrderingTarget, { readonly kind: 'raw' }> }
  | { readonly kind: 'order_by_nulls'; readonly target: QueryOrderingTarget; readonly direction: OrderDirection; readonly nulls: QueryOrderingNullPlacement }
  | { readonly kind: 'select'; readonly columns: Expression } | { readonly kind: 'find_or_fail'; readonly key: Expression }
  | { readonly kind: 'create'; readonly values: Expression } | { readonly kind: 'update_or_create'; readonly lookup: Expression; readonly values: Expression }
  | { readonly kind: 'first_or_create'; readonly attributes: Expression; readonly values: Expression };
export type AuthenticationOperation =
  | { readonly kind: 'create_token'; readonly name: Expression }
  | { readonly kind: 'current_access_token' };
export type MethodOperation = { readonly kind: 'authentication'; readonly operation: AuthenticationOperation } | { readonly kind: 'validation'; readonly operation: ValidationOperation } | { readonly kind: 'query'; readonly operation: QueryOperation } | { readonly kind: 'collection'; readonly operation: CollectionOperation } | { readonly kind: 'request'; readonly operation: RequestOperation } | { readonly kind: 'resource'; readonly operation: ResourceOperation } | { readonly kind: 'response'; readonly operation: ResponseOperation } | { readonly kind: 'redirect'; readonly operation: RedirectOperation } | { readonly kind: 'http_client'; readonly operation: HttpClientOperation } | { readonly kind: 'pdf'; readonly operation: PdfOperation } | { readonly kind: 'application'; readonly operation: ApplicationOperation } | { readonly kind: 'string_value'; readonly operation: StringValueOperation } | { readonly kind: 'date_time'; readonly operation: DateTimeOperation } | { readonly kind: 'domain'; readonly name: MethodName };
export type FrameworkStaticReceiver =
  | { readonly kind: 'database'; readonly name: ClassName } | { readonly kind: 'validation'; readonly name: ClassName } | { readonly kind: 'hash'; readonly name: ClassName }
  | { readonly kind: 'http'; readonly name: ClassName } | { readonly kind: 'pdf'; readonly name: ClassName } | { readonly kind: 'socialite'; readonly name: ClassName } | { readonly kind: 'string'; readonly name: ClassName }
  | { readonly kind: 'schema'; readonly name: ClassName } | { readonly kind: 'event'; readonly name: ClassName } | { readonly kind: 'date_time'; readonly name: ClassName } | { readonly kind: 'attribute'; readonly name: ClassName };
export type StaticReceiver = { readonly kind: 'controller'; readonly name: ControllerName } | { readonly kind: 'model'; readonly name: ModelName } | { readonly kind: 'resource'; readonly name: ResourceName } | { readonly kind: 'framework'; readonly receiver: FrameworkStaticReceiver } | { readonly kind: 'class'; readonly name: ClassName };
export type AttributeFactoryCallback =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly expression: Expression };
export type AttributeCaching =
  | { readonly kind: 'default' }
  | { readonly kind: 'should_cache' }
  | { readonly kind: 'without_object_caching' };
export type AttributeFactoryConfiguration = {
  readonly kind: 'attribute_factory_configuration';
  readonly caching: AttributeCaching;
};
export type AttributeFactoryDefinition = {
  readonly kind: 'attribute_factory';
  readonly get: AttributeFactoryCallback;
  readonly set: AttributeFactoryCallback;
  readonly configuration: AttributeFactoryConfiguration;
};

export type ResourceStaticOperation =
  | { readonly kind: 'collection' };

export type StaticMethodAction =
  | { readonly kind: 'model'; readonly operation: ModelStaticOperation }
  | { readonly kind: 'resource'; readonly operation: ResourceStaticOperation }
  | { readonly kind: 'database_raw' } | { readonly kind: 'database_table' } | { readonly kind: 'database_transaction' } | { readonly kind: 'validation_unique' } | { readonly kind: 'hash_check' } | { readonly kind: 'hash_make' }
  | { readonly kind: 'http_with_basic_auth' } | { readonly kind: 'pdf_load_view' } | { readonly kind: 'socialite_driver' } | { readonly kind: 'string_uuid' } | { readonly kind: 'string_random' } | { readonly kind: 'string_before' }
  | { readonly kind: 'schema_create' } | { readonly kind: 'schema_table' } | { readonly kind: 'schema_drop_if_exists' } | { readonly kind: 'event_listen' } | { readonly kind: 'date_parse' } | { readonly kind: 'attribute_make'; readonly definition: AttributeFactoryDefinition } | { readonly kind: 'domain'; readonly name: MethodName };
export type BinaryOperator = { readonly kind: 'concat' } | { readonly kind: 'add' } | { readonly kind: 'subtract' } | { readonly kind: 'multiply' } | { readonly kind: 'divide' } | { readonly kind: 'modulo' } | ComparisonOperator | { readonly kind: 'and' } | { readonly kind: 'or' } | { readonly kind: 'bitwise_and' } | { readonly kind: 'bitwise_or' } | { readonly kind: 'bitwise_xor' } | { readonly kind: 'left_shift' } | { readonly kind: 'right_shift' };
export type UnaryOperator = { readonly kind: 'negate' } | { readonly kind: 'not' } | { readonly kind: 'positive' } | { readonly kind: 'bitwise_not' } | { readonly kind: 'cast'; readonly target: SemanticValue };
export type BuiltinFunction =
  | { readonly kind: 'isset' }
  | { readonly kind: 'implode' }
  | { readonly kind: 'method_exists' }
  | { readonly kind: 'array_key_exists' }
  | { readonly kind: 'array_map' }
  | { readonly kind: 'array_filter' }
  | { readonly kind: 'array_sum' }
  | { readonly kind: 'array_column' }
  | { readonly kind: 'array_diff' }
  | { readonly kind: 'array_merge' }
  | { readonly kind: 'array_slice' }
  | { readonly kind: 'array_shift' }
  | { readonly kind: 'array_unshift' }
  | { readonly kind: 'base64_decode' }
  | { readonly kind: 'base64_encode' }
  | { readonly kind: 'filter_var' }
  | { readonly kind: 'floor' }
  | { readonly kind: 'hash_equals' }
  | { readonly kind: 'http_build_query' }
  | { readonly kind: 'json_decode' }
  | { readonly kind: 'json_encode' }
  | { readonly kind: 'is_array' }
  | { readonly kind: 'is_numeric' }
  | { readonly kind: 'is_object' }
  | { readonly kind: 'is_string' }
  | { readonly kind: 'is_dir' }
  | { readonly kind: 'is_file' }
  | { readonly kind: 'is_a' }
  | { readonly kind: 'in_array' }
  | { readonly kind: 'max' }
  | { readonly kind: 'min' }
  | { readonly kind: 'round' }
  | { readonly kind: 'strlen' }
  | { readonly kind: 'str_replace' }
  | { readonly kind: 'strtr' }
  | { readonly kind: 'str_pad' }
  | { readonly kind: 'str_starts_with' }
  | { readonly kind: 'str_ends_with' }
  | { readonly kind: 'str_contains' }
  | { readonly kind: 'strtolower' }
  | { readonly kind: 'strtoupper' }
  | { readonly kind: 'substr' }
  | { readonly kind: 'trim' }
  | { readonly kind: 'ltrim' }
  | { readonly kind: 'rtrim' }
  | { readonly kind: 'explode' }
  | { readonly kind: 'preg_match' }
  | { readonly kind: 'preg_match_all' }
  | { readonly kind: 'preg_replace' }
  | { readonly kind: 'preg_quote' }
  | { readonly kind: 'sprintf' }
  | { readonly kind: 'call_user_func' }
  | { readonly kind: 'empty' }
  | { readonly kind: 'hash' }
  | { readonly kind: 'collect' }
  | { readonly kind: 'config' }
  | { readonly kind: 'now' }
  | { readonly kind: 'response' }
  | { readonly kind: 'redirect' }
  | { readonly kind: 'abort' }
  | { readonly kind: 'asset' }
  | { readonly kind: 'app' }
  | { readonly kind: 'copy' }
  | { readonly kind: 'random' }
  | { readonly kind: 'env' }
  | { readonly kind: 'route' }
  | { readonly kind: 'storage_path' }
  | { readonly kind: 'public_path' }
  | { readonly kind: 'number_format' }
  | { readonly kind: 'file_exists' }
  | { readonly kind: 'extension_loaded' }
  | { readonly kind: 'sys_get_temp_dir' }
  | { readonly kind: 'realpath' }
  | { readonly kind: 'base_path' }
  | { readonly kind: 'database_path' }
  | { readonly kind: 'parse_url' }
  | { readonly kind: 'array_rand' }
  | { readonly kind: 'uniqid' }
  | { readonly kind: 'count' } | { readonly kind: 'sole' } | { readonly kind: 'doesnt_exist' }
  | { readonly kind: 'dirname' }
  | { readonly kind: 'define' }
  | { readonly kind: 'microtime' }
  | { readonly kind: 'fake' }
  | { readonly kind: 'function_exists' }
  | { readonly kind: 'class_exists' }
  | { readonly kind: 'is_subclass_of' }
  | { readonly kind: 'class_basename' }
  | { readonly kind: 'app_path' }
  | { readonly kind: 'file' }
  | { readonly kind: 'file_get_contents' }
  | { readonly kind: 'file_put_contents' }
  | { readonly kind: 'error_reporting' }
  | { readonly kind: 'token_get_all' }
  | { readonly kind: 'print_r' };
export type CastType = { readonly kind: 'string' } | { readonly kind: 'integer' } | { readonly kind: 'float' } | { readonly kind: 'boolean' } | { readonly kind: 'date_time' } | { readonly kind: 'array' } | { readonly kind: 'json' };
export type SqlAggregate = { readonly kind: 'sum' } | { readonly kind: 'avg' } | { readonly kind: 'count' };
export type SqlExpression = { readonly kind: 'all_columns' } | { readonly kind: 'column'; readonly name: PropertyName } | { readonly kind: 'number'; readonly value: NumberValue } | { readonly kind: 'binary'; readonly operator: SqlBinaryOperator; readonly left: SqlExpression; readonly right: SqlExpression } | { readonly kind: 'aggregate'; readonly function: SqlAggregate; readonly expression: SqlExpression } | { readonly kind: 'coalesce'; readonly value: SqlExpression; readonly fallback: SqlExpression } | { readonly kind: 'round'; readonly value: SqlExpression; readonly precision: NumberValue } | { readonly kind: 'alias'; readonly value: SqlExpression; readonly name: PropertyName };
export type SqlBinaryOperator = { readonly kind: 'multiply' } | { readonly kind: 'add' } | { readonly kind: 'subtract' } | { readonly kind: 'divide' };
export type UnsupportedExpressionReason =
  | { readonly kind: 'unsupported_syntax' }
  | { readonly kind: 'missing_return_expression' };
export type ReferenceCardinality = { readonly kind: 'single' } | { readonly kind: 'collection' };
export type ClassConstantOwner =
  | { readonly kind: 'named_class'; readonly name: ClassName }
  | { readonly kind: 'self' }
  | { readonly kind: 'static' }
  | { readonly kind: 'parent' };
export type ClassConstantReference = {
  readonly kind: 'class_constant_reference';
  readonly owner: ClassConstantOwner;
  readonly name: ConstantName;
};
export type ArrayEntry =
  | { readonly kind: 'implicit'; readonly index: NumberValue; readonly value: Expression; readonly source: SourceSpan }
  | { readonly kind: 'keyed'; readonly key: Expression; readonly value: Expression; readonly source: SourceSpan }
  | { readonly kind: 'unpacked'; readonly value: Expression; readonly source: SourceSpan };
export type ExpressionDefinition = { readonly expression: Expression; readonly source: SourceSpan };

export type AnonymousClassMember =
  | { readonly kind: 'property'; readonly name: PropertyName; readonly value: Expression | { readonly kind: 'absent' } }
  | { readonly kind: 'method'; readonly name: MethodName; readonly parameters: ClosureParameters; readonly returnType: ClosureReturnType; readonly body: SourceStatements };
export type AnonymousClass = {
  readonly kind: 'anonymous_class';
  readonly extendsClass: ClassName | { readonly kind: 'absent' };
  readonly members: readonly AnonymousClassMember[];
};

export type MagicConstant = { readonly kind: 'dir' } | { readonly kind: 'file' };
export type ConstantReference = { readonly kind: 'constant_reference'; readonly name: ConstantName };

export type Expression =
  | { readonly kind: 'literal'; readonly value: LiteralValue; readonly source: SourceSpan }
  | { readonly kind: 'unsupported_expression'; readonly reason: UnsupportedExpressionReason; readonly source: SourceSpan } | { readonly kind: 'variable'; readonly name: VariableName; readonly source: SourceSpan }
  | { readonly kind: 'property'; readonly receiver: Expression; readonly property: PropertyName; readonly path: PropertyPath; readonly source: SourceSpan } | { readonly kind: 'relation'; readonly receiver: Expression; readonly relation: RelationName; readonly source: SourceSpan }
  | { readonly kind: 'method'; readonly receiver: Expression; readonly operation: MethodOperation; readonly arguments: ExpressionArguments; readonly path: PropertyPath; readonly source: SourceSpan }
  | { readonly kind: 'static_method'; readonly receiver: StaticReceiver; readonly action: StaticMethodAction; readonly arguments: ExpressionArguments; readonly source: SourceSpan } | { readonly kind: 'sql'; readonly expression: SqlExpression; readonly source: SourceSpan }
  | { readonly kind: 'builtin'; readonly function: BuiltinFunction; readonly arguments: ExpressionArguments; readonly source: SourceSpan } | { readonly kind: 'call'; readonly function: FunctionName; readonly arguments: ExpressionArguments; readonly source: SourceSpan } | { readonly kind: 'callable_call'; readonly callable: Expression; readonly arguments: ExpressionArguments; readonly source: SourceSpan }
  | { readonly kind: 'cast'; readonly target: CastType; readonly expression: Expression; readonly source: SourceSpan } | { readonly kind: 'binary'; readonly operator: BinaryOperator; readonly left: Expression; readonly right: Expression; readonly source: SourceSpan }
  | { readonly kind: 'unary'; readonly operator: UnaryOperator; readonly operand: Expression; readonly source: SourceSpan } | { readonly kind: 'conditional'; readonly condition: Expression; readonly branches: ConditionalExpressionBranches; readonly source: SourceSpan }
  | { readonly kind: 'short_conditional'; readonly condition: Expression; readonly whenFalse: Expression; readonly source: SourceSpan }
  | { readonly kind: 'coalesce'; readonly left: Expression; readonly right: Expression; readonly source: SourceSpan } | { readonly kind: 'nullsafe_property'; readonly receiver: Expression; readonly property: PropertyName; readonly path: PropertyPath; readonly source: SourceSpan }
  | { readonly kind: 'nullsafe_method'; readonly receiver: Expression; readonly operation: MethodOperation; readonly arguments: ExpressionArguments; readonly path: PropertyPath; readonly source: SourceSpan } | { readonly kind: 'index'; readonly receiver: Expression; readonly key: Expression; readonly source: SourceSpan }
  | { readonly kind: 'interpolated_string'; readonly parts: InterpolatedStringParts; readonly source: SourceSpan }
  | { readonly kind: 'array'; readonly entries: Sequence<ArrayEntry>; readonly source: SourceSpan } | { readonly kind: 'object'; readonly properties: ObjectProperties; readonly source: SourceSpan } | { readonly kind: 'match'; readonly subject: Expression; readonly arms: MatchArms; readonly source: SourceSpan }
  | { readonly kind: 'model_reference'; readonly model: ModelName; readonly cardinality: ReferenceCardinality; readonly source: SourceSpan } | { readonly kind: 'resource_reference'; readonly resource: ResourceName; readonly cardinality: ReferenceCardinality; readonly argument: Expression; readonly source: SourceSpan }
  | { readonly kind: 'magic_constant'; readonly value: MagicConstant; readonly source: SourceSpan }
  | { readonly kind: 'constant_reference'; readonly reference: ConstantReference; readonly source: SourceSpan }
  | { readonly kind: 'closure'; readonly value: Closure; readonly source: SourceSpan } | { readonly kind: 'arrow_function'; readonly parameters: ClosureParameters; readonly body: Expression; readonly source: SourceSpan } | { readonly kind: 'class_reference'; readonly className: ClassName; readonly source: SourceSpan } | { readonly kind: 'class_constant'; readonly reference: ClassConstantReference; readonly source: SourceSpan } | { readonly kind: 'construct'; readonly className: ClassName; readonly arguments: ExpressionArguments; readonly source: SourceSpan } | { readonly kind: 'dynamic_construct'; readonly classExpression: Expression; readonly arguments: ExpressionArguments; readonly source: SourceSpan }
  | { readonly kind: 'instance_of'; readonly expression: Expression; readonly className: ClassName; readonly source: SourceSpan }
  | { readonly kind: 'anonymous_class'; readonly value: AnonymousClass; readonly arguments: ExpressionArguments; readonly source: SourceSpan }
  | { readonly kind: 'assignment_expression'; readonly value: Assignment; readonly source: SourceSpan };
export type ObjectProperty = { readonly kind: 'object_property'; readonly name: PropertyName; readonly value: Expression; readonly source: SourceSpan };
export type MatchArm =
  | { readonly kind: 'conditional'; readonly conditions: Expressions; readonly result: Expression; readonly source: SourceSpan }
  | { readonly kind: 'default'; readonly result: Expression; readonly source: SourceSpan };
export type ResolvedExpression = { readonly kind: 'resolved_expression'; readonly expression: Expression; readonly result: SemanticValue };
export type ClosureCapture = { readonly kind: 'by_value'; readonly variable: VariableName } | { readonly kind: 'by_reference'; readonly variable: VariableName };
export type ClosureReturnType =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: TypeExpression };
export type Closure = { readonly kind: 'closure'; readonly parameters: ClosureParameters; readonly captures: ClosureCaptures; readonly returnType: ClosureReturnType; readonly body: ClosureBody; readonly source: SourceSpan };
export type ClosureBody = { readonly kind: 'expression_body'; readonly expression: Expression } | { readonly kind: 'statement_body'; readonly statements: Sequence<ClosureStatement> };
export type ClosureForeachTarget = { readonly kind: 'value'; readonly variable: VariableName } | { readonly kind: 'key_value'; readonly key: VariableName; readonly value: VariableName };
export type ClosureForClause =
  | { readonly kind: 'empty' }
  | { readonly kind: 'expression'; readonly value: Expression }
  | { readonly kind: 'assignment'; readonly value: Assignment };
export type ClosureCatchClause = { readonly exceptionType: ClassName; readonly variable: VariableName; readonly body: Sequence<ClosureStatement> };
export type ClosureIfAlternative =
  | { readonly kind: 'none' }
  | { readonly kind: 'else_block'; readonly block: Sequence<ClosureStatement> }
  | { readonly kind: 'else_if'; readonly statement: Extract<ClosureStatement, { readonly kind: 'if' }> };
export type ClosureFinallyClause = { readonly kind: 'absent' } | { readonly kind: 'present'; readonly block: Sequence<ClosureStatement> };
export type ClosureStatement =
  | { readonly kind: 'expression'; readonly expression: Expression }
  | { readonly kind: 'return_value'; readonly expression: Expression }
  | { readonly kind: 'return_void' }
  | { readonly kind: 'assignment'; readonly value: Assignment }
  | { readonly kind: 'if'; readonly condition: Expression; readonly thenBlock: Sequence<ClosureStatement>; readonly alternative: ClosureIfAlternative }
  | { readonly kind: 'foreach'; readonly iterable: Expression; readonly target: ClosureForeachTarget; readonly body: Sequence<ClosureStatement> }
  | { readonly kind: 'for'; readonly initializer: ClosureForClause; readonly condition: ClosureForClause; readonly update: ClosureForClause; readonly body: Sequence<ClosureStatement> }
  | { readonly kind: 'try'; readonly body: Sequence<ClosureStatement>; readonly catches: Sequence<ClosureCatchClause>; readonly finallyBlock: ClosureFinallyClause }
  | { readonly kind: 'throw'; readonly expression: Expression };
export type PropertyAccess = { readonly kind: 'property_access'; readonly path: PropertyPath; readonly source: SourceSpan };
