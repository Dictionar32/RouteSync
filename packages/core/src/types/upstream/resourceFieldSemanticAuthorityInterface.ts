import type { Expression } from './expression';
import type { ResourceFieldMeaning } from './resource';
import type { StringValue } from './valueObjects';
import type { TypeExpression } from './typeVocabulary';

export type ResourceFieldOutputShapeJudgment =
  | { readonly kind: 'scalar_or_expression' }
  | { readonly kind: 'nested_object' }
  | { readonly kind: 'resource'; readonly resourceName: StringValue }
  | { readonly kind: 'resource_collection'; readonly resourceName: StringValue };

/** Closed semantic result of resolving a Resource field against model semantics. */
export interface ResourceFieldSemanticJudgment {
  readonly kind: 'resource_field_semantic_judgment';
  readonly meaning: ResourceFieldMeaning;
  readonly type: TypeExpression;
  readonly outputShape: ResourceFieldOutputShapeJudgment;
}

/** Upstream operation contract for field meaning/type; AST projection remains a separate operation. */
export interface ResourceFieldSemanticAuthorityInput<Value extends object, Model extends object> {
  readonly value: Value;
  readonly expression: Expression;
  readonly model: Model;
}

export interface ResourceFieldSemanticAuthorityInterface<Value extends object, Model extends object> {
  readonly kind: 'resource_field_semantic_authority';
  readonly contractVersion: 1;
  readonly judge: (input: ResourceFieldSemanticAuthorityInput<Value, Model>) => ResourceFieldSemanticJudgment;
}
