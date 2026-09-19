import type { ClassName, DomainTypeName, VariableName, PropertyName } from './names';
import type { PrimitiveVocabulary, Nullability } from './primitiveVocabulary';
import type { SourceSpan } from './provenance';
import type { StringValue } from './valueObjects';
import type { Sequence } from './collections';

export type TypeReference =
  | { readonly kind: 'class'; readonly name: ClassName }
  | { readonly kind: 'domain'; readonly name: DomainTypeName };

export type TypeExpression =
  | { readonly kind: 'primitive'; readonly value: PrimitiveVocabulary }
  | { readonly kind: 'reference'; readonly value: TypeReference }
  | { readonly kind: 'array'; readonly element: TypeExpression }
  | { readonly kind: 'mixed' }
  | { readonly kind: 'union'; readonly members: TypeExpressions }
  | { readonly kind: 'intersection'; readonly members: TypeExpressions }
  | { readonly kind: 'nullable'; readonly value: TypeExpression }
  | { readonly kind: 'callable'; readonly parameters: TypeParameters; readonly result: TypeExpression }
  | { readonly kind: 'optional'; readonly value: TypeExpression }
  | { readonly kind: 'never' }
  | { readonly kind: 'error'; readonly diagnostic: StringValue }
  | { readonly kind: 'object'; readonly properties: TypeProperties }
  | { readonly kind: 'generic'; readonly base: TypeReference; readonly parameters: TypeParameters };

export type TypeProperty = { readonly kind: 'type_property'; readonly name: PropertyName; readonly type: TypeExpression; readonly source: SourceSpan };
export type TypeProperties = { readonly kind: 'type_properties'; readonly items: Sequence<TypeProperty> };

export type TypeParameter = {
  readonly kind: 'type_parameter';
  readonly name: VariableName;
  readonly type: TypeExpression;
  readonly source: SourceSpan;
};

export type TypeParameters = {
  readonly kind: 'type_parameters';
  readonly items: Sequence<TypeParameter>;
};

export type TypeExpressions = {
  readonly kind: 'type_expressions';
  readonly items: Sequence<TypeExpression>;
};

export type DeclaredType = {
  readonly kind: 'declared_type';
  readonly value: TypeExpression;
  readonly nullability: Nullability;
};
