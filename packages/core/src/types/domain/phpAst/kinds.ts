/**
 * kinds.ts
 *
 * Canonical Domain Vocabulary for PHP AST Node Kinds.
 * Single Source of Truth (SSOT) ADT Registry #32.
 *
 * @module core/types/domain/phpAst
 */

export const PhpAstKind = Object.freeze({
    // Member Access
    PropertyLookup: 'property_lookup',
    NullsafePropertyLookup: 'nullsafe_property_lookup',
    OffsetLookup: 'offset_lookup',
    StaticPropertyLookup: 'static_property_lookup',

    // Invocations
    FunctionCall: 'function_call',
    MethodCall: 'method_call',
    NullsafeMethodCall: 'nullsafe_method_call',
    StaticMethodCall: 'static_method_call',
    VariableCall: 'variable_call',
    NewInstance: 'new_instance',
    Closure: 'closure',
    ArrowFunc: 'arrow_func',

    // Computations
    Binary: 'binary',
    Unary: 'unary',
    TypeCast: 'type_cast',
    Ternary: 'ternary',

    // Containers & Literals
    Array: 'array',
    Literal: 'literal',
    StaticConstant: 'static_constant',
    Variable: 'variable',
    Unsupported: 'unsupported'
} as const);

export type PhpAstKind = typeof PhpAstKind[keyof typeof PhpAstKind];

export type PhpAstCategory =
    | 'access'
    | 'invocation'
    | 'computation'
    | 'container'
    | 'literal'
    | 'variable'
    | 'fallback';

export interface PhpAstKindSpecification<K extends PhpAstKind = PhpAstKind> {
    readonly kind: K;
    readonly category: PhpAstCategory;
    readonly isTerminal: boolean;
    readonly description: string;
}

export type PhpAstKindRegistry = {
    readonly [K in PhpAstKind]: PhpAstKindSpecification<K>;
};

export const PHP_AST_KIND_REGISTRY: PhpAstKindRegistry = Object.freeze({
    [PhpAstKind.PropertyLookup]: { kind: PhpAstKind.PropertyLookup, category: 'access', isTerminal: false, description: 'Object property access ($obj->prop)' },
    [PhpAstKind.NullsafePropertyLookup]: { kind: PhpAstKind.NullsafePropertyLookup, category: 'access', isTerminal: false, description: 'Nullsafe object property access ($obj?->prop)' },
    [PhpAstKind.OffsetLookup]: { kind: PhpAstKind.OffsetLookup, category: 'access', isTerminal: false, description: 'Array offset access ($arr["key"])' },
    [PhpAstKind.StaticPropertyLookup]: { kind: PhpAstKind.StaticPropertyLookup, category: 'access', isTerminal: true, description: 'Static class property lookup (Class::$property)' },
    [PhpAstKind.FunctionCall]: { kind: PhpAstKind.FunctionCall, category: 'invocation', isTerminal: false, description: 'Global function invocation (auth(), now())' },
    [PhpAstKind.MethodCall]: { kind: PhpAstKind.MethodCall, category: 'invocation', isTerminal: false, description: 'Instance method call ($obj->method())' },
    [PhpAstKind.NullsafeMethodCall]: { kind: PhpAstKind.NullsafeMethodCall, category: 'invocation', isTerminal: false, description: 'Nullsafe method call ($obj?->method())' },
    [PhpAstKind.StaticMethodCall]: { kind: PhpAstKind.StaticMethodCall, category: 'invocation', isTerminal: false, description: 'Static class method call (User::find())' },
    [PhpAstKind.VariableCall]: { kind: PhpAstKind.VariableCall, category: 'invocation', isTerminal: false, description: 'Variable closure call ($fn())' },
    [PhpAstKind.NewInstance]: { kind: PhpAstKind.NewInstance, category: 'invocation', isTerminal: false, description: 'Class instantiation (new Resource())' },
    [PhpAstKind.Closure]: { kind: PhpAstKind.Closure, category: 'invocation', isTerminal: false, description: 'Anonymous closure function' },
    [PhpAstKind.ArrowFunc]: { kind: PhpAstKind.ArrowFunc, category: 'invocation', isTerminal: false, description: 'Short arrow function (fn() => ...)' },
    [PhpAstKind.Binary]: { kind: PhpAstKind.Binary, category: 'computation', isTerminal: false, description: 'Binary operation ($a + $b, $a ?? $b)' },
    [PhpAstKind.Unary]: { kind: PhpAstKind.Unary, category: 'computation', isTerminal: false, description: 'Unary operation (!$flag, -$num)' },
    [PhpAstKind.TypeCast]: { kind: PhpAstKind.TypeCast, category: 'computation', isTerminal: false, description: 'Type cast ((int) $val)' },
    [PhpAstKind.Ternary]: { kind: PhpAstKind.Ternary, category: 'computation', isTerminal: false, description: 'Ternary condition ($a ? $b : $c)' },
    [PhpAstKind.Array]: { kind: PhpAstKind.Array, category: 'container', isTerminal: false, description: 'Array literal (["a" => 1])' },
    [PhpAstKind.Literal]: { kind: PhpAstKind.Literal, category: 'literal', isTerminal: true, description: 'Scalar literal (string, number, boolean, null)' },
    [PhpAstKind.StaticConstant]: { kind: PhpAstKind.StaticConstant, category: 'literal', isTerminal: true, description: 'Class constant reference (Role::ADMIN, self::STATUS)' },
    [PhpAstKind.Variable]: { kind: PhpAstKind.Variable, category: 'variable', isTerminal: true, description: 'PHP variable reference ($var)' },
    [PhpAstKind.Unsupported]: { kind: PhpAstKind.Unsupported, category: 'fallback', isTerminal: true, description: 'Structured unsupported expression' }
});

export type PhpAstKindVisitor<R> = {
    readonly [K in PhpAstKind]: (spec: PhpAstKindSpecification<K>) => R;
};

export function matchPhpAstKind<R>(kind: PhpAstKind, visitor: PhpAstKindVisitor<R>): R {
    return visitor[kind](PHP_AST_KIND_REGISTRY[kind]);
}
