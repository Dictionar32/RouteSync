import type { DomainTypeName } from './names';
import type { Properties } from './collections';
import type { ModelSemanticProperty } from './model';
import type { NumberValue, StringValue, TruthValue } from './valueObjects';
import type { FunctionName, PropertyName } from './names';
import type { MethodOperation, StaticMethodAction, StaticReceiver } from './expression';
import type { Expressions, SemanticValues } from './collections';
export type PrimitiveVocabulary = { readonly kind: 'string' } | { readonly kind: 'number' } | { readonly kind: 'boolean' } | { readonly kind: 'date_time' } | { readonly kind: 'file' } | { readonly kind: 'json' } | { readonly kind: 'unspecified' };
export type Presence = { readonly kind: 'required' } | { readonly kind: 'optional' } | { readonly kind: 'unspecified' };
export type Nullability = { readonly kind: 'non_nullable' } | { readonly kind: 'nullable' };
export type Cardinality = { readonly kind: 'one' } | { readonly kind: 'many' };
export type LiteralValue = { readonly kind: 'string_literal'; readonly value: StringValue } | { readonly kind: 'number_literal'; readonly value: NumberValue } | { readonly kind: 'boolean_literal'; readonly value: TruthValue } | { readonly kind: 'null_literal' };
export type SemanticScalar = { readonly kind: 'scalar'; readonly primitive: PrimitiveVocabulary; readonly presence: Presence; readonly nullability: Nullability };
export type SemanticCall =
  | { readonly kind: 'method_call'; readonly receiver: SemanticValue; readonly operation: MethodOperation; readonly arguments: Expressions; readonly result: SemanticValue }
  | { readonly kind: 'static_call'; readonly receiver: StaticReceiver; readonly action: StaticMethodAction; readonly arguments: Expressions; readonly result: SemanticValue }
  | { readonly kind: 'function_call'; readonly function: FunctionName; readonly arguments: Expressions; readonly result: SemanticValue };

export type SemanticValue = { readonly kind: 'unresolved'; readonly reason: 'external' | 'unsupported' | 'missing_local_method' | 'missing_local_variable' } | { readonly kind: 'typed'; readonly type: import('./typeVocabulary').TypeExpression } | SemanticScalar | { readonly kind: 'literal'; readonly value: LiteralValue } | { readonly kind: 'reference'; readonly name: DomainTypeName; readonly cardinality: Cardinality; readonly nullability: Nullability } | { readonly kind: 'property_access'; readonly receiver: SemanticValue; readonly property: import('./names').PropertyName; readonly nullability: Nullability } | { readonly kind: 'resolved_property_access'; readonly receiver: SemanticValue; readonly model: import('./names').ModelName; readonly property: ModelSemanticProperty; readonly nullability: Nullability } | { readonly kind: 'relation_access'; readonly receiver: SemanticValue; readonly relation: import('./names').RelationName; readonly nullability: Nullability } | { readonly kind: 'collection'; readonly element: SemanticValue; readonly cardinality: Cardinality; readonly nullability: Nullability } | { readonly kind: 'object'; readonly properties: Properties; readonly nullability: Nullability } | SemanticCall | { readonly kind: 'union'; readonly members: SemanticValues } | { readonly kind: 'intersection'; readonly members: SemanticValues };
export type SemanticFlag = TruthValue;
