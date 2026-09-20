/**
 * TypeIR: closed projection of an already-resolved semantic type.
 * Optional semantic facts are represented as explicit ADT states.
 */

import type { PropertyName, TypeExpression } from './nominalVocabulary';
import type { PrimitiveKind } from '../../compiler/types/SemanticType';
import type { Option } from '../upstream/collections';
import type { LiteralValue } from '../upstream/primitiveVocabulary';
import type { CodeExpression } from './nominalVocabulary';

export interface PrimitiveTypeIR {
    readonly kind: 'primitive';
    readonly type: PrimitiveKind;
    readonly format: PrimitiveFormatIR;
}

export type PrimitiveFormatIR =
    | { readonly kind: 'none' }
    | { readonly kind: 'type_expression'; readonly value: TypeExpression };

export interface ReferenceTypeIR {
    readonly kind: 'reference';
    readonly target: CodeExpression;
    readonly module: Option<CodeExpression>;
    readonly role: 'plain' | 'resource' | 'model' | 'response';
}


export interface JsonTypeIR {
    readonly kind: 'json';
}

export interface NeverTypeIR {
    readonly kind: 'never';
}

export interface ErrorTypeIR {
    readonly kind: 'error';
    readonly diagnostic: string;
}

export interface IntersectionTypeIR {
    readonly kind: 'intersection';
    readonly types: readonly TypeIR[];
}

export interface CollectionTypeIR {
    readonly kind: 'collection';
    readonly element: TypeIR;
}

export interface GenericTypeIR {
    readonly kind: 'generic';
    readonly base: ReferenceTypeIR;
    readonly parameters: readonly GenericParameterIR[];
}

export interface GenericParameterIR {
    readonly name: string;
    readonly variance: 'covariant' | 'contravariant' | 'invariant';
    readonly type: TypeIR;
}

export interface ArrayTypeIR {
    readonly kind: 'array';
    readonly items: TypeIR;
}

export interface InlineObjectTypeIR {
    readonly kind: 'inline_object';
    readonly properties: readonly TypePropertyIR[];
    readonly additionalProperties: ObjectAdditionalPropertiesIR;
}

export type TypePropertyIR = {
    readonly name: PropertyName;
    readonly type: TypeIR;
};

export type ObjectAdditionalPropertiesIR =
    | { readonly kind: 'forbidden' }
    | { readonly kind: 'allowed' };

export interface NullableTypeIR {
    readonly kind: 'nullable';
    readonly inner: TypeIR;
}

export interface OptionalTypeIR {
    readonly kind: 'optional';
    readonly inner: TypeIR;
}

export interface UnionTypeIR {
    readonly kind: 'union';
    readonly types: readonly TypeIR[];
}

export interface LiteralTypeIR {
    readonly kind: 'literal';
    readonly value: LiteralValue;
}

export type TypeIR =
    | PrimitiveTypeIR
    | ReferenceTypeIR
    | ArrayTypeIR
    | JsonTypeIR
    | NeverTypeIR
    | ErrorTypeIR
    | IntersectionTypeIR
    | CollectionTypeIR
    | GenericTypeIR
    | InlineObjectTypeIR
    | NullableTypeIR
    | OptionalTypeIR
    | UnionTypeIR
    | LiteralTypeIR;

export interface TypeProjections {
    readonly contract: TypeIR;
    readonly read: TypeIR;
    readonly form: TypeIR;
    readonly field: TypeIR;
    readonly mapper: TypeIR;
    readonly schema: TypeIR;
}
