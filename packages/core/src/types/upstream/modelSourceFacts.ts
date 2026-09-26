

import type { CastType } from './expression';
import type { TypeExpression } from './typeVocabulary';
import type { ModelAccessorResult, ModelAccessorVisibility } from './modelVocabulary';
import type { PropertyName, ColumnName, MethodName } from './names';
import type { SourceSpan } from './provenance';
import type { Presence, Nullability } from './primitiveVocabulary';

import type { DatabaseType } from './databaseVocabulary';






export type ModelColumnType =
  | { readonly kind: 'native'; readonly value: TypeExpression }
  | { readonly kind: 'casted'; readonly value: TypeExpression; readonly cast: import('./expression').CastType; readonly source: SourceSpan };

export type ModelColumnFact = { readonly kind: 'model_column'; readonly property: PropertyName; readonly column: ColumnName; readonly databaseType: DatabaseType; readonly type: ModelColumnType; readonly presence: Presence; readonly nullability: Nullability; readonly source: SourceSpan };
export type ModelAccessorFact = { readonly kind: 'model_accessor'; readonly property: PropertyName; readonly method: MethodName; readonly visibility: ModelAccessorVisibility; readonly computation: import('./modelVocabulary').ModelAccessorComputation; readonly result: ModelAccessorResult; readonly source: SourceSpan };
export type ModelCastFact = { readonly kind: 'model_cast'; readonly property: PropertyName; readonly target: CastType; readonly source: SourceSpan };
