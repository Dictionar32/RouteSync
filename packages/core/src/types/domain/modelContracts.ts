/** High-model Laravel/Eloquent domain contracts. No flat nullable identity fields. */

export type ModelKeyType = 'int' | 'bigint' | 'string' | 'uuid' | 'ulid';

export type ModelKeySemanticType =
  | { readonly kind: 'number' }
  | { readonly kind: 'string' };

export type Nullability =
  | { readonly kind: 'non_nullable' }
  | { readonly kind: 'nullable' };

import type { ModelName } from './semanticValues';

export type ModelBinding =
  | { readonly kind: 'model'; readonly modelName: ModelName }
  | { readonly kind: 'unbound' };

export type DatabaseColumnType =
  | { readonly kind: 'bigint' }
  | { readonly kind: 'integer' }
  | { readonly kind: 'smallint' }
  | { readonly kind: 'tinyint' }
  | { readonly kind: 'float' }
  | { readonly kind: 'double' }
  | { readonly kind: 'decimal' }
  | { readonly kind: 'boolean' }
  | { readonly kind: 'string' }
  | { readonly kind: 'text' }
  | { readonly kind: 'mediumtext' }
  | { readonly kind: 'longtext' }
  | { readonly kind: 'date' }
  | { readonly kind: 'datetime' }
  | { readonly kind: 'timestamp' }
  | { readonly kind: 'time' }
  | { readonly kind: 'json' }
  | { readonly kind: 'enum'; readonly values: readonly string[] }
  | { readonly kind: 'binary' }
  | { readonly kind: 'uuid' }
  | { readonly kind: 'ulid' }
  | { readonly kind: 'unsupported'; readonly reason: DatabaseColumnUnsupportedReason };

export type DatabaseColumnUnsupportedReason =
  | 'parser_gap'
  | 'unsupported_sql_type'
  | 'invalid_boundary_input';
