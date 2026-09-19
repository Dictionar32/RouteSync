/** Closed semantic ADT. Meaning is carried by typed variants, never by null/fallback flags. */
import type { SemanticType, PrimitiveKind } from '../../compiler/types/SemanticType';
import type { ModelName, ResourceName, PropertyName, TypeExpression } from './nominalVocabulary';

export type SemanticBinding =
  | { readonly kind: 'bound'; readonly type: SemanticType; readonly model: ModelName }
  | { readonly kind: 'unbound' };

export type SemanticPropertyPresence = 'required' | 'optional';
export type SemanticFormat =
  | { readonly kind: 'none' }
  | { readonly kind: 'type_expression'; readonly value: TypeExpression };

export interface PrimitiveSemanticTypeIR {
  readonly kind: 'primitive';
  readonly type: PrimitiveKind;
  readonly format: SemanticFormat;
  readonly binding: SemanticBinding;
}

export interface ResourceSemanticTypeIR {
  readonly kind: 'resource';
  readonly resource: ResourceName;
  readonly cardinality: 'single' | 'collection';
  readonly binding: SemanticBinding;
}

export interface ModelSemanticTypeIR {
  readonly kind: 'model';
  readonly model: ModelName;
  readonly binding: SemanticBinding;
}

export interface ObjectSemanticProperty {
  readonly name: PropertyName;
  readonly type: ResolvedSemanticType;
  readonly presence: SemanticPropertyPresence;
}

export interface ObjectSemanticTypeIR {
  readonly kind: 'object';
  readonly properties: readonly ObjectSemanticProperty[];
  readonly binding: SemanticBinding;
}

export type ObjectSemanticTypeIRContract = ObjectSemanticTypeIR;

export interface NullableSemanticTypeIR {
  readonly kind: 'nullable';
  readonly innerType: ResolvedSemanticType;
  readonly binding: SemanticBinding;
}

export interface ArraySemanticTypeIR {
  readonly kind: 'array';
  readonly items: ResolvedSemanticType;
  readonly binding: SemanticBinding;
}

export interface UnionSemanticTypeIR {
  readonly kind: 'union';
  readonly types: readonly ResolvedSemanticType[];
  readonly binding: SemanticBinding;
}

export type LiteralValue = string | number | boolean;

export interface LiteralSemanticTypeIR {
  readonly kind: 'literal';
  readonly value: LiteralValue;
  readonly binding: SemanticBinding;
}

export type ResolvedSemanticType =
  | PrimitiveSemanticTypeIR
  | ResourceSemanticTypeIR
  | ModelSemanticTypeIR
  | ObjectSemanticTypeIR
  | ArraySemanticTypeIR
  | UnionSemanticTypeIR
  | NullableSemanticTypeIR
  | LiteralSemanticTypeIR;
