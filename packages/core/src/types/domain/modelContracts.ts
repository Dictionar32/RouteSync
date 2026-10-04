/** High-model Laravel/Eloquent domain contracts. No flat nullable identity fields. */

export type ModelKeyType = 'int' | 'bigint' | 'string' | 'uuid' | 'ulid';

export type ModelKeySemanticType =
  | { readonly kind: 'number' }
  | { readonly kind: 'string' };

export type Nullability = import('../upstream/primitiveVocabulary').Nullability;

import type { ModelName } from './semanticValues';

export type ModelBinding =
  | { readonly kind: 'model'; readonly modelName: ModelName }
  | { readonly kind: 'unbound' };
