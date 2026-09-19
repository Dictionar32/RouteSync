import type { Expression } from './expression';
import type { ColumnName, PropertyName, RequestName, TableName } from './names';
import type { NumberValue, StringValues } from './valueObjects';
import type { PropertyPath, PropertyPaths, RequestFields, ValidationRules } from './collections';
import type { SourceSpan } from './provenance';

export type ValidationRule =
  | { readonly kind: 'required' } | { readonly kind: 'nullable' } | { readonly kind: 'optional' }
  | { readonly kind: 'sometimes_required' } | { readonly kind: 'required_with'; readonly fields: PropertyPaths }
  | { readonly kind: 'string' } | { readonly kind: 'integer' } | { readonly kind: 'numeric' }
  | { readonly kind: 'boolean' } | { readonly kind: 'array' } | { readonly kind: 'email' } | { readonly kind: 'url' }
  | { readonly kind: 'confirmed' } | { readonly kind: 'min'; readonly value: NumberValue }
  | { readonly kind: 'max'; readonly value: NumberValue } | { readonly kind: 'in'; readonly values: StringValues }
  | { readonly kind: 'exists'; readonly table: TableName; readonly column: ColumnName }
  | { readonly kind: 'unique'; readonly table: TableName; readonly column: ColumnName; readonly target: UniqueTarget };

export type UniqueTarget = { readonly kind: 'all' } | { readonly kind: 'ignore'; readonly value: Expression };
export type RequestDefault = { readonly kind: 'none' } | { readonly kind: 'expression'; readonly expression: Expression };
export type RequestAuthorization = { readonly kind: 'authorized' } | { readonly kind: 'denied' };
export type RequestField = { readonly kind: 'request_field'; readonly name: PropertyPath; readonly rules: ValidationRules; readonly default: RequestDefault; readonly source: SourceSpan };
export type RequestDefinition = { readonly kind: 'request'; readonly name: RequestName; readonly authorization: RequestAuthorization; readonly fields: RequestFields; readonly source: SourceSpan };
