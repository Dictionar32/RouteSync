import type { Expression } from './expression';
import type { ColumnName, PropertyName, RequestName, TableName, FormTypeName } from './names';
import type { NumberValue, StringValue, StringValues } from './valueObjects';
import type { PropertyPath, PropertyPaths, RequestFields, ValidationRules } from './collections';
import type { SourceSpan } from './provenance';
import type { Presence } from './primitiveVocabulary';
import type { TypeExpression } from './typeVocabulary';
import type { PropertyReference } from './semanticReferences';

export type ValidationRuleName = { readonly kind: 'validation_rule_name'; readonly value: StringValue };
export type DateFormat = { readonly kind: 'date_format'; readonly value: StringValue };
export type ValidationParameter = { readonly kind: 'validation_parameter'; readonly value: StringValue };
export type ValidationConstraintValue = { readonly kind: 'validation_constraint_value'; readonly value: NumberValue };

export type FileValidationConstraint =
  | { readonly kind: 'image' }
  | { readonly kind: 'extensions'; readonly values: StringValues }
  | { readonly kind: 'mime_types'; readonly values: StringValues }
  | { readonly kind: 'max_bytes'; readonly value: NumberValue };
export type FileValidationConstraints = { readonly kind: 'file_validation_constraints'; readonly items: import('./collections').Sequence<FileValidationConstraint> };

export type ValidationDatabaseColumn =
  | { readonly kind: 'default_column' }
  | { readonly kind: 'explicit_column'; readonly column: ColumnName };

export type ValidationRule =
  | { readonly kind: 'required' } | { readonly kind: 'nullable' } | { readonly kind: 'optional' }
  | { readonly kind: 'sometimes_required' } | { readonly kind: 'required_with'; readonly fields: PropertyPaths }
  | { readonly kind: 'string' } | { readonly kind: 'integer' } | { readonly kind: 'numeric' }
  | { readonly kind: 'boolean' } | { readonly kind: 'array'; readonly element: TypeExpression | { readonly kind: 'unspecified' } } | { readonly kind: 'email' } | { readonly kind: 'url' } | { readonly kind: 'uuid' } | { readonly kind: 'date'; readonly format: DateFormat | { readonly kind: 'unspecified' } }
  | { readonly kind: 'confirmed' } | { readonly kind: 'min'; readonly value: NumberValue }
  | { readonly kind: 'max'; readonly value: NumberValue } | { readonly kind: 'between'; readonly min: ValidationConstraintValue; readonly max: ValidationConstraintValue } | { readonly kind: 'in'; readonly values: StringValues }
  | { readonly kind: 'exists'; readonly table: TableName; readonly column: ValidationDatabaseColumn }
  | { readonly kind: 'unique'; readonly table: TableName; readonly column: ValidationDatabaseColumn; readonly target: UniqueTarget }
  | { readonly kind: 'file' } | { readonly kind: 'image' }
  | { readonly kind: 'custom'; readonly rule: ValidationRuleName; readonly parameters: import('./collections').Sequence<ValidationParameter> };

export type UniqueTarget = { readonly kind: 'all' } | { readonly kind: 'ignore'; readonly value: Expression };
export type RequestDefault = { readonly kind: 'none' } | { readonly kind: 'expression'; readonly expression: Expression };
export type RequestAuthorization = { readonly kind: 'authorized' } | { readonly kind: 'denied' };
export type RequestFieldTarget =
  | { readonly kind: 'input_property'; readonly property: PropertyReference }
  | { readonly kind: 'input_collection'; readonly property: PropertyReference; readonly element: PropertyReference };

export type RequestField = { readonly kind: 'request_field'; readonly name: PropertyPath; readonly target: RequestFieldTarget; readonly type: TypeExpression; readonly presence: Presence; readonly rules: ValidationRules; readonly fileConstraints: FileValidationConstraints; readonly default: RequestDefault; readonly source: SourceSpan };
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
