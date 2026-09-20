import type { Expression } from './expression';
import type { ColumnName, PropertyName, RequestName, TableName, FormTypeName } from './names';
import type { NumberValue, StringValues } from './valueObjects';
import type { PropertyPath, PropertyPaths, RequestFields, ValidationRules } from './collections';
import type { SourceSpan } from './provenance';
import type { Presence } from './primitiveVocabulary';
import type { TypeExpression } from './typeVocabulary';
import type { PropertyReference } from './semanticReferences';

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
export type RequestFieldTarget =
  | { readonly kind: 'input_property'; readonly property: PropertyReference }
  | { readonly kind: 'input_collection'; readonly property: PropertyReference; readonly element: PropertyReference };

export type RequestField = { readonly kind: 'request_field'; readonly name: PropertyPath; readonly target: RequestFieldTarget; readonly type: TypeExpression; readonly presence: Presence; readonly rules: ValidationRules; readonly default: RequestDefault; readonly source: SourceSpan };
export type RequestSourceIdentity = {
  readonly kind: 'request_identity';
  readonly request: RequestName;
  readonly formType: FormTypeName;
};

export type RequestSchema = {
  readonly kind: 'request_schema';
  readonly fields: RequestFields;
};

export type RequestFacts = {
  readonly kind: 'request_facts';
  readonly identity: RequestSourceIdentity;
  readonly authorization: RequestAuthorization;
  readonly schema: RequestSchema;
  readonly source: SourceSpan;
};

/**
 * High-level request model. Naming, authorization and schema are semantic
 * concepts; consumers do not reconstruct them from PHP class conventions.
 */
export type RequestDefinition = {
  readonly kind: 'request';
  readonly identity: RequestSourceIdentity;
  readonly authorization: RequestAuthorization;
  readonly schema: RequestSchema;
  readonly source: SourceSpan;
};
