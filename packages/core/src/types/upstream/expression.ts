import type { ClassName, ControllerName, MethodName, ModelName, PropertyName, RelationName, ResourceName, VariableName } from './names';
import type { ResourceOperation } from './resourceVocabulary';
import type { SourceSpan } from './provenance';
import type { LiteralValue, SemanticValue } from './primitiveVocabulary';
import type { Expressions, MatchArms, ObjectProperties, RelationPaths, PropertyPath, VariableNames, SqlExpressions, ClosureCaptures, PropertyPaths } from './collections';
import type { NumberValue } from './valueObjects';
export type ConditionalExpressionBranches = { readonly kind: 'then_only'; readonly whenTrue: Expression } | { readonly kind: 'then_else'; readonly whenTrue: Expression; readonly whenFalse: Expression };
export type ComparisonOperator = { readonly kind: 'equal' } | { readonly kind: 'not_equal' } | { readonly kind: 'greater' } | { readonly kind: 'greater_equal' } | { readonly kind: 'less' } | { readonly kind: 'less_equal' };
export type CollectionOperation = { readonly kind: 'is_empty' } | { readonly kind: 'to_array' };
export type RequestArgument = { readonly kind: 'field'; readonly path: PropertyPath } | { readonly kind: 'default'; readonly value: Expression } | { readonly kind: 'fields'; readonly paths: PropertyPaths };
export type RequestOperation =
  | { readonly kind: 'all' } | { readonly kind: 'boolean'; readonly argument: RequestArgument }
  | { readonly kind: 'filled'; readonly argument: RequestArgument } | { readonly kind: 'get'; readonly argument: RequestArgument }
  | { readonly kind: 'input'; readonly argument: RequestArgument } | { readonly kind: 'integer'; readonly argument: RequestArgument }
  | { readonly kind: 'only'; readonly argument: RequestArgument } | { readonly kind: 'query'; readonly argument: RequestArgument }
  | { readonly kind: 'safe'; readonly argument: RequestArgument } | { readonly kind: 'string'; readonly argument: RequestArgument }
  | { readonly kind: 'token' } | { readonly kind: 'user' } | { readonly kind: 'validate' } | { readonly kind: 'validated' };
export type QueryOperation =
  | { readonly kind: 'where'; readonly field: PropertyName; readonly operator: ComparisonOperator; readonly value: Expression }
  | { readonly kind: 'where_has'; readonly relation: RelationName; readonly constraint: Expression } | { readonly kind: 'where_key'; readonly value: Expression }
  | { readonly kind: 'where_column'; readonly left: PropertyName; readonly right: PropertyName } | { readonly kind: 'with'; readonly relations: RelationPaths }
  | { readonly kind: 'latest' } | { readonly kind: 'order_by'; readonly field: PropertyName; readonly direction: OrderDirection }
  | { readonly kind: 'first' } | { readonly kind: 'first_or_fail' } | { readonly kind: 'get' } | { readonly kind: 'find_or_fail'; readonly key: Expression }
  | { readonly kind: 'paginate'; readonly perPage: Expression } | { readonly kind: 'simple_paginate'; readonly perPage: Expression } | { readonly kind: 'cursor_paginate'; readonly perPage: Expression }
  | { readonly kind: 'sum'; readonly value: AggregateOperand } | { readonly kind: 'avg'; readonly value: AggregateOperand } | { readonly kind: 'min'; readonly value: AggregateOperand } | { readonly kind: 'max'; readonly value: AggregateOperand }
  | { readonly kind: 'count' } | { readonly kind: 'group_by'; readonly field: PropertyName } | { readonly kind: 'map'; readonly callback: Expression } | { readonly kind: 'filter'; readonly callback: Expression }
  | { readonly kind: 'values' } | { readonly kind: 'pluck'; readonly field: PropertyName } | { readonly kind: 'value'; readonly field: PropertyName } | { readonly kind: 'exists' } | { readonly kind: 'select_raw'; readonly expressions: SqlExpressions }
  | { readonly kind: 'delete' } | { readonly kind: 'create'; readonly values: Expression } | { readonly kind: 'update'; readonly values: Expression } | { readonly kind: 'update_or_create'; readonly lookup: Expression; readonly values: Expression }
  | { readonly kind: 'first_or_create'; readonly attributes: Expression; readonly values: Expression } | { readonly kind: 'update_or_insert'; readonly values: Expression }
  | { readonly kind: 'increment'; readonly field: PropertyName; readonly amount: Expression } | { readonly kind: 'decrement'; readonly field: PropertyName; readonly amount: Expression } | { readonly kind: 'save' }
  | { readonly kind: 'load'; readonly relations: RelationPaths } | { readonly kind: 'lock_for_update' } | { readonly kind: 'with_headers'; readonly headers: Expression };
export type AggregateOperand = { readonly kind: 'property'; readonly name: PropertyName } | { readonly kind: 'sql'; readonly expression: SqlExpression };
export type OrderDirection = { readonly kind: 'ascending' } | { readonly kind: 'descending' };
export type ModelStaticOperation =
  | { readonly kind: 'all' } | { readonly kind: 'query' } | { readonly kind: 'where'; readonly field: PropertyName; readonly operator: ComparisonOperator; readonly value: Expression }
  | { readonly kind: 'where_key'; readonly value: Expression } | { readonly kind: 'with'; readonly relations: RelationPaths } | { readonly kind: 'find_or_fail'; readonly key: Expression }
  | { readonly kind: 'create'; readonly values: Expression } | { readonly kind: 'update_or_create'; readonly lookup: Expression; readonly values: Expression }
  | { readonly kind: 'first_or_create'; readonly attributes: Expression; readonly values: Expression };
export type MethodOperation = { readonly kind: 'query'; readonly operation: QueryOperation } | { readonly kind: 'collection'; readonly operation: CollectionOperation } | { readonly kind: 'request'; readonly operation: RequestOperation } | { readonly kind: 'resource'; readonly operation: ResourceOperation } | { readonly kind: 'domain'; readonly name: MethodName };
export type FrameworkStaticReceiver =
  | { readonly kind: 'database'; readonly name: ClassName } | { readonly kind: 'validation'; readonly name: ClassName } | { readonly kind: 'hash'; readonly name: ClassName }
  | { readonly kind: 'http'; readonly name: ClassName } | { readonly kind: 'pdf'; readonly name: ClassName } | { readonly kind: 'socialite'; readonly name: ClassName } | { readonly kind: 'string'; readonly name: ClassName }
  | { readonly kind: 'schema'; readonly name: ClassName } | { readonly kind: 'event'; readonly name: ClassName } | { readonly kind: 'date_time'; readonly name: ClassName };
export type StaticReceiver = { readonly kind: 'controller'; readonly name: ControllerName } | { readonly kind: 'model'; readonly name: ModelName } | { readonly kind: 'framework'; readonly receiver: FrameworkStaticReceiver } | { readonly kind: 'class'; readonly name: ClassName };
export type StaticMethodAction =
  | { readonly kind: 'model'; readonly operation: ModelStaticOperation }
  | { readonly kind: 'database_raw' } | { readonly kind: 'database_table' } | { readonly kind: 'database_transaction' } | { readonly kind: 'validation_unique' } | { readonly kind: 'hash_check' } | { readonly kind: 'hash_make' }
  | { readonly kind: 'http_with_basic_auth' } | { readonly kind: 'pdf_load_view' } | { readonly kind: 'socialite_driver' } | { readonly kind: 'string_uuid' } | { readonly kind: 'string_random' } | { readonly kind: 'string_before' }
  | { readonly kind: 'schema_create' } | { readonly kind: 'schema_table' } | { readonly kind: 'schema_drop_if_exists' } | { readonly kind: 'event_listen' } | { readonly kind: 'date_parse' } | { readonly kind: 'domain'; readonly name: MethodName };
export type BinaryOperator = { readonly kind: 'concat' } | { readonly kind: 'add' } | { readonly kind: 'subtract' } | { readonly kind: 'multiply' } | { readonly kind: 'divide' } | ComparisonOperator | { readonly kind: 'and' } | { readonly kind: 'or' };
export type UnaryOperator = { readonly kind: 'negate' } | { readonly kind: 'not' } | { readonly kind: 'cast'; readonly target: SemanticValue };
export type BuiltinFunction = { readonly kind: 'method_exists' } | { readonly kind: 'is_object' } | { readonly kind: 'call_user_func' } | { readonly kind: 'random' } | { readonly kind: 'copy' } | { readonly kind: 'collect' } | { readonly kind: 'array_sum' } | { readonly kind: 'array_column' } | { readonly kind: 'is_array' } | { readonly kind: 'in_array' } | { readonly kind: 'empty' } | { readonly kind: 'trim' } | { readonly kind: 'explode' } | { readonly kind: 'strtoupper' } | { readonly kind: 'config' } | { readonly kind: 'now' } | { readonly kind: 'response' } | { readonly kind: 'redirect' } | { readonly kind: 'abort' } | { readonly kind: 'asset' } | { readonly kind: 'ltrim' } | { readonly kind: 'round' } | { readonly kind: 'array_filter' } | { readonly kind: 'hash' } | { readonly kind: 'rtrim' } | { readonly kind: 'str_pad' } | { readonly kind: 'str_starts_with' } | { readonly kind: 'strtolower' };
export type CastType = { readonly kind: 'string' } | { readonly kind: 'integer' } | { readonly kind: 'float' } | { readonly kind: 'boolean' } | { readonly kind: 'date_time' } | { readonly kind: 'array' } | { readonly kind: 'json' };
export type SqlAggregate = { readonly kind: 'sum' } | { readonly kind: 'avg' } | { readonly kind: 'count' };
export type SqlExpression = { readonly kind: 'column'; readonly name: PropertyName } | { readonly kind: 'number'; readonly value: NumberValue } | { readonly kind: 'binary'; readonly operator: SqlBinaryOperator; readonly left: SqlExpression; readonly right: SqlExpression } | { readonly kind: 'aggregate'; readonly function: SqlAggregate; readonly expression: SqlExpression } | { readonly kind: 'coalesce'; readonly value: SqlExpression; readonly fallback: SqlExpression } | { readonly kind: 'round'; readonly value: SqlExpression; readonly precision: NumberValue } | { readonly kind: 'alias'; readonly value: SqlExpression; readonly name: PropertyName };
export type SqlBinaryOperator = { readonly kind: 'multiply' } | { readonly kind: 'add' } | { readonly kind: 'subtract' } | { readonly kind: 'divide' };
export type UnsupportedExpressionReason =
  | { readonly kind: 'unsupported_syntax' }
  | { readonly kind: 'missing_return_expression' };
export type Expression =
  | { readonly kind: 'literal'; readonly value: LiteralValue; readonly source: SourceSpan }
  | { readonly kind: 'unsupported_expression'; readonly reason: UnsupportedExpressionReason; readonly source: SourceSpan } | { readonly kind: 'variable'; readonly name: VariableName; readonly source: SourceSpan }
  | { readonly kind: 'property'; readonly receiver: Expression; readonly property: PropertyName; readonly source: SourceSpan } | { readonly kind: 'relation'; readonly receiver: Expression; readonly relation: RelationName; readonly source: SourceSpan }
  | { readonly kind: 'method'; readonly receiver: Expression; readonly operation: MethodOperation; readonly arguments: Expressions; readonly source: SourceSpan }
  | { readonly kind: 'static_method'; readonly receiver: StaticReceiver; readonly action: StaticMethodAction; readonly arguments: Expressions; readonly source: SourceSpan } | { readonly kind: 'sql'; readonly expression: SqlExpression; readonly source: SourceSpan }
  | { readonly kind: 'builtin'; readonly function: BuiltinFunction; readonly arguments: Expressions; readonly source: SourceSpan } | { readonly kind: 'call'; readonly function: MethodName; readonly arguments: Expressions; readonly source: SourceSpan }
  | { readonly kind: 'cast'; readonly target: CastType; readonly expression: Expression; readonly source: SourceSpan } | { readonly kind: 'binary'; readonly operator: BinaryOperator; readonly left: Expression; readonly right: Expression; readonly source: SourceSpan }
  | { readonly kind: 'unary'; readonly operator: UnaryOperator; readonly operand: Expression; readonly source: SourceSpan } | { readonly kind: 'conditional'; readonly condition: Expression; readonly branches: ConditionalExpressionBranches; readonly source: SourceSpan }
  | { readonly kind: 'coalesce'; readonly left: Expression; readonly right: Expression; readonly source: SourceSpan } | { readonly kind: 'nullsafe_property'; readonly receiver: Expression; readonly property: PropertyName; readonly source: SourceSpan }
  | { readonly kind: 'nullsafe_method'; readonly receiver: Expression; readonly operation: MethodOperation; readonly arguments: Expressions; readonly source: SourceSpan } | { readonly kind: 'index'; readonly receiver: Expression; readonly key: Expression; readonly source: SourceSpan }
  | { readonly kind: 'array'; readonly items: Expressions; readonly source: SourceSpan } | { readonly kind: 'object'; readonly properties: ObjectProperties; readonly source: SourceSpan } | { readonly kind: 'match'; readonly subject: Expression; readonly arms: MatchArms; readonly source: SourceSpan }
  | { readonly kind: 'model_reference'; readonly model: ModelName; readonly source: SourceSpan } | { readonly kind: 'resource_reference'; readonly resource: ResourceName; readonly source: SourceSpan }
  | { readonly kind: 'closure'; readonly value: Closure; readonly source: SourceSpan } | { readonly kind: 'construct'; readonly className: ClassName; readonly arguments: Expressions; readonly source: SourceSpan }
  | { readonly kind: 'instance_of'; readonly expression: Expression; readonly className: ClassName; readonly source: SourceSpan };
export type ObjectProperty = { readonly kind: 'object_property'; readonly name: PropertyName; readonly value: Expression; readonly source: SourceSpan };
export type MatchArm = { readonly kind: 'match_arm'; readonly conditions: Expressions; readonly result: Expression; readonly source: SourceSpan };
export type ResolvedExpression = { readonly kind: 'resolved_expression'; readonly expression: Expression; readonly result: SemanticValue };
export type ClosureCapture = { readonly kind: 'by_value'; readonly variable: VariableName } | { readonly kind: 'by_reference'; readonly variable: VariableName };
export type Closure = { readonly kind: 'closure'; readonly parameters: VariableNames; readonly captures: ClosureCaptures; readonly body: Expression; readonly source: SourceSpan };
export type PropertyAccess = { readonly kind: 'property_access'; readonly path: PropertyPath; readonly source: SourceSpan };
