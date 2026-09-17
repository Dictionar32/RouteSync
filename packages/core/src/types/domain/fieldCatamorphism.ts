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
    UnknownField,
    LiteralField,
    VariableField,
    PropertyAccessField,
    ArrayAccessField,
    FunctionCallField,
    NullsafeMethodCallField,
    VariableCallField,
    MethodCallField,
    StaticMethodCallField,
    StaticPropertyAccessField,
    StaticConstantField,
    UnaryExpressionField,
    BinaryExpressionField,
    TypeCastField,
    TernaryField,
    NullsafePropertyAccessField,
    NewInstanceField,
    ClosureField,
    ArrowFunctionField,
    ArrayField
} from '../field';

export interface FieldNodeVisitor<R> {
    readonly array: (node: ArrayField) => R;
    readonly unknown: (node: UnknownField) => R;
    readonly literal: (node: LiteralField) => R;
    readonly variable: (node: VariableField) => R;
    readonly property_access: (node: PropertyAccessField) => R;
    readonly array_access: (node: ArrayAccessField) => R;
    readonly function_call: (node: FunctionCallField) => R;
    readonly method_call: (node: MethodCallField) => R;
    readonly nullsafe_method_call: (node: NullsafeMethodCallField) => R;
    readonly variable_call: (node: VariableCallField) => R;
    readonly static_method_call: (node: StaticMethodCallField) => R;
    readonly static_property_access: (node: StaticPropertyAccessField) => R;
    readonly static_constant: (node: StaticConstantField) => R;
    readonly unary_expression: (node: UnaryExpressionField) => R;
    readonly binary_expression: (node: BinaryExpressionField) => R;
    readonly type_cast: (node: TypeCastField) => R;
    readonly ternary: (node: TernaryField) => R;
    readonly nullsafe_property_access: (node: NullsafePropertyAccessField) => R;
    readonly new_instance: (node: NewInstanceField) => R;
    readonly closure: (node: ClosureField) => R;
    readonly arrow_func: (node: ArrowFunctionField) => R;
}

export function matchFieldNode<R>(node: FieldNode, visitor: FieldNodeVisitor<R>): R {
    switch (node.kind) {
        case 'array': return visitor.array(node);
        case 'unknown': return visitor.unknown(node);
        case 'literal': return visitor.literal(node);
        case 'variable': return visitor.variable(node);
        case 'property_access': return visitor.property_access(node);
        case 'array_access': return visitor.array_access(node);
        case 'function_call': return visitor.function_call(node);
        case 'method_call': return visitor.method_call(node);
        case 'nullsafe_method_call': return visitor.nullsafe_method_call(node);
        case 'variable_call': return visitor.variable_call(node);
        case 'static_method_call': return visitor.static_method_call(node);
        case 'static_property_access': return visitor.static_property_access(node);
        case 'static_constant': return visitor.static_constant(node);
        case 'unary_expression': return visitor.unary_expression(node);
        case 'binary_expression': return visitor.binary_expression(node);
        case 'type_cast': return visitor.type_cast(node);
        case 'ternary': return visitor.ternary(node);
        case 'nullsafe_property_access': return visitor.nullsafe_property_access(node);
        case 'new_instance': return visitor.new_instance(node);
        case 'closure': return visitor.closure(node);
        case 'arrow_func': return visitor.arrow_func(node);
    }
}
