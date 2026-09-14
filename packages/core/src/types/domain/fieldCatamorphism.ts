/**
 * fieldCatamorphism.ts
 *
 * Catamorphism Pattern Matcher and Normalization for FieldNode.
 * 0 if, 0 switch, exhaustive variant dispatch.
 *
 * @module core/types/domain
 */

import type {
    FieldNode,
    PrimitiveField,
    ModelField,
    ObjectField,
    UnknownField,
    RawCodeField,
    LiteralField,
    VariableField,
    PropertyAccessField,
    MethodCallField,
    StaticMethodCallField,
    BinaryExpressionField,
    TypeCastField,
    TernaryField,
    NullsafeChainField,
    NullsafePropertyAccessField,
    NewInstanceField,
    ArrayField
} from '../field';

export interface FieldNodeVisitor<R> {
    readonly primitive: (node: PrimitiveField) => R;
    readonly model: (node: ModelField) => R;
    readonly object: (node: ObjectField) => R;
    readonly array: (node: ArrayField) => R;
    readonly unknown: (node: UnknownField) => R;
    readonly raw_code: (node: RawCodeField) => R;
    readonly literal: (node: LiteralField) => R;
    readonly variable: (node: VariableField) => R;
    readonly property_access: (node: PropertyAccessField) => R;
    readonly method_call: (node: MethodCallField) => R;
    readonly static_method_call: (node: StaticMethodCallField) => R;
    readonly binary_expression: (node: BinaryExpressionField) => R;
    readonly type_cast: (node: TypeCastField) => R;
    readonly ternary: (node: TernaryField) => R;
    readonly nullsafe_chain: (node: NullsafeChainField) => R;
    readonly nullsafe_property_access: (node: NullsafePropertyAccessField) => R;
    readonly new_instance: (node: NewInstanceField) => R;
}

export function matchFieldNode<R>(node: FieldNode, visitor: FieldNodeVisitor<R>): R {
    const handler = visitor[node.kind];
    return handler ? handler(node as any) : visitor.unknown(node as any);
}

export function normalizeCastType(rawType: string): 'int' | 'float' | 'string' | 'bool' {
    const clean = (rawType || '').toLowerCase().trim();
    const CAST_MAP: { [k: string]: 'int' | 'float' | 'string' | 'bool' } = {
        int: 'int',
        integer: 'int',
        float: 'float',
        double: 'float',
        real: 'float',
        bool: 'bool',
        boolean: 'bool',
        string: 'string'
    };
    return CAST_MAP[clean] ?? 'string';
}
