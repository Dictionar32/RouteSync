/**
 * algebra.ts
 *
 * Recursive Tree Fold (F-Algebra) and 1-Level Catamorphism for PhpAstNode.
 * Pure functional bottom-up reduction, 0 if, 0 switch.
 *
 * @module core/types/domain/phpAst
 */

import type { PhpAstNode, ArrayEntryAstNode } from './nodes';
import type { PhpArgument, PhpPropertyName, PhpBlock, PhpStatement, PhpReturnExpression, ArrayKey } from './astValues';
import type { PropertyLookupAstNode, NullsafePropertyLookupAstNode, OffsetLookupAstNode, StaticPropertyLookupAstNode, FunctionCallAstNode, MethodCallAstNode, NullsafeMethodCallAstNode, StaticMethodCallAstNode, VariableCallAstNode, NewInstanceAstNode, ClosureAstNode, ArrowFuncAstNode, BinaryAstNode, UnaryAstNode, TypeCastAstNode, TernaryAstNode, ArrayAstNode, LiteralAstNode, StaticConstantAstNode, VariableAstNode, UnsupportedAstNode } from './nodes';

export interface PhpAstVisitor<R> {
    readonly property_lookup: (node: PropertyLookupAstNode) => R;
    readonly nullsafe_property_lookup: (node: NullsafePropertyLookupAstNode) => R;
    readonly offset_lookup: (node: OffsetLookupAstNode) => R;
    readonly static_property_lookup: (node: StaticPropertyLookupAstNode) => R;
    readonly function_call: (node: FunctionCallAstNode) => R;
    readonly method_call: (node: MethodCallAstNode) => R;
    readonly nullsafe_method_call: (node: NullsafeMethodCallAstNode) => R;
    readonly static_method_call: (node: StaticMethodCallAstNode) => R;
    readonly variable_call: (node: VariableCallAstNode) => R;
    readonly new_instance: (node: NewInstanceAstNode) => R;
    readonly closure: (node: ClosureAstNode) => R;
    readonly arrow_func: (node: ArrowFuncAstNode) => R;
    readonly binary: (node: BinaryAstNode) => R;
    readonly unary: (node: UnaryAstNode) => R;
    readonly type_cast: (node: TypeCastAstNode) => R;
    readonly ternary: (node: TernaryAstNode) => R;
    readonly array: (node: ArrayAstNode) => R;
    readonly literal: (node: LiteralAstNode) => R;
    readonly static_constant: (node: StaticConstantAstNode) => R;
    readonly variable: (node: VariableAstNode) => R;
    readonly unsupported: (node: UnsupportedAstNode) => R;
}

export function matchPhpAstNode<R>(node: PhpAstNode, visitor: PhpAstVisitor<R>): R {
    const handler = visitor[node.kind];
    return handler(node as never);
}

export type FoldedPhpArgument<R> =
    | { readonly kind: 'positional'; readonly value: R }
    | { readonly kind: 'named'; readonly name: PhpPropertyName; readonly value: R }
    | { readonly kind: 'unpacked'; readonly value: R };

export interface PhpAstFolder<R> {
    readonly propertyLookup: (node: PropertyLookupAstNode, foldedTarget: R) => R;
    readonly nullsafePropertyLookup: (node: NullsafePropertyLookupAstNode, foldedTarget: R) => R;
    readonly offsetLookup: (node: OffsetLookupAstNode, foldedTarget: R, foldedOffset: R) => R;
    readonly staticPropertyLookup: (node: StaticPropertyLookupAstNode) => R;
    readonly functionCall: (node: FunctionCallAstNode, foldedArgs: readonly FoldedPhpArgument<R>[]) => R;
    readonly methodCall: (node: MethodCallAstNode, foldedTarget: R, foldedArgs: readonly FoldedPhpArgument<R>[]) => R;
    readonly nullsafeMethodCall: (node: NullsafeMethodCallAstNode, foldedTarget: R, foldedArgs: readonly FoldedPhpArgument<R>[]) => R;
    readonly staticMethodCall: (node: StaticMethodCallAstNode, foldedArgs: readonly FoldedPhpArgument<R>[]) => R;
    readonly variableCall: (node: VariableCallAstNode, foldedArgs: readonly FoldedPhpArgument<R>[]) => R;
    readonly newInstance: (node: NewInstanceAstNode, foldedArgs: readonly FoldedPhpArgument<R>[]) => R;
    readonly closure: (node: ClosureAstNode, foldedBody: readonly FoldedPhpStatement<R>[]) => R;
    readonly arrowFunc: (node: ArrowFuncAstNode, foldedBody: R) => R;
    readonly binary: (node: BinaryAstNode, foldedLeft: R, foldedRight: R) => R;
    readonly unary: (node: UnaryAstNode, foldedWhat: R) => R;
    readonly typeCast: (node: TypeCastAstNode, foldedExpr: R) => R;
    readonly ternary: (node: TernaryAstNode, foldedCond: R, foldedTruthy: R, foldedFalsy: R) => R;
    readonly array: (node: ArrayAstNode, foldedItems: readonly { readonly key: FoldedArrayKey<R>; readonly value: R }[]) => R;
    readonly literal: (node: LiteralAstNode) => R;
    readonly staticConstant: (node: StaticConstantAstNode) => R;
    readonly variable: (node: VariableAstNode) => R;
    readonly unsupported: (node: UnsupportedAstNode) => R;
}

export type FoldedArrayKey<R> =
    | { readonly kind: 'implicit' }
    | { readonly kind: 'explicit'; readonly expression: R };

function foldPhpArrayKey<R>(key: ArrayKey, folder: PhpAstFolder<R>): FoldedArrayKey<R> {
    if (key.kind === 'implicit') return { kind: 'implicit' };
    return { kind: 'explicit', expression: foldPhpAstNode(key.expression, folder) };
}

function foldPhpAstArgument<R>(argument: PhpArgument, folder: PhpAstFolder<R>): FoldedPhpArgument<R> {
    if (argument.kind === 'positional') {
        return { kind: 'positional', value: foldPhpAstNode(argument.value, folder) };
    }
    if (argument.kind === 'named') {
        return { kind: 'named', name: argument.name, value: foldPhpAstNode(argument.value, folder) };
    }
    return { kind: 'unpacked', value: foldPhpAstNode(argument.value, folder) };
}

export type FoldedPhpReturnExpression<R> =
    | { readonly kind: 'value'; readonly value: R }
    | { readonly kind: 'void' };

export type FoldedPhpStatement<R> =
    | { readonly kind: 'expression_statement'; readonly expression: R }
    | { readonly kind: 'return_statement'; readonly expression: FoldedPhpReturnExpression<R> };

function foldPhpReturnExpression<R>(expression: PhpReturnExpression, folder: PhpAstFolder<R>): FoldedPhpReturnExpression<R> {
    if (expression.kind === 'void') return { kind: 'void' };
    return { kind: 'value', value: foldPhpAstNode(expression.value, folder) };
}

function foldPhpStatement<R>(statement: PhpStatement, folder: PhpAstFolder<R>): FoldedPhpStatement<R> {
    if (statement.kind === 'expression_statement') {
        return { kind: 'expression_statement', expression: foldPhpAstNode(statement.expression, folder) };
    }
    return { kind: 'return_statement', expression: foldPhpReturnExpression(statement.expression, folder) };
}

function foldPhpBlock<R>(block: PhpBlock, folder: PhpAstFolder<R>): readonly FoldedPhpStatement<R>[] {
    return block.statements.map(statement => foldPhpStatement(statement, folder));
}

export function foldPhpAstNode<R>(node: PhpAstNode, folder: PhpAstFolder<R>): R {
    const FOLD_DISPATCH: PhpAstVisitor<R> = {
        property_lookup: (n) => folder.propertyLookup(n, foldPhpAstNode(n.target, folder)),
        nullsafe_property_lookup: (n) => folder.nullsafePropertyLookup(n, foldPhpAstNode(n.target, folder)),
        offset_lookup: (n) => folder.offsetLookup(n, foldPhpAstNode(n.target, folder), foldPhpAstNode(n.offset, folder)),
        static_property_lookup: (n) => folder.staticPropertyLookup(n),
        function_call: (n) => folder.functionCall(n, n.args.map(a => foldPhpAstArgument(a, folder))),
        method_call: (n) => folder.methodCall(n, foldPhpAstNode(n.target, folder), n.args.map(a => foldPhpAstArgument(a, folder))),
        nullsafe_method_call: (n) => folder.nullsafeMethodCall(n, foldPhpAstNode(n.target, folder), n.args.map(a => foldPhpAstArgument(a, folder))),
        static_method_call: (n) => folder.staticMethodCall(n, n.args.map(a => foldPhpAstArgument(a, folder))),
        variable_call: (n) => folder.variableCall(n, n.args.map(a => foldPhpAstArgument(a, folder))),
        new_instance: (n) => folder.newInstance(n, n.args.map(a => foldPhpAstArgument(a, folder))),
        closure: (n) => folder.closure(n, foldPhpBlock(n.body, folder)),
        arrow_func: (n) => folder.arrowFunc(n, foldPhpAstNode(n.body, folder)),
        binary: (n) => folder.binary(n, foldPhpAstNode(n.left, folder), foldPhpAstNode(n.right, folder)),
        unary: (n) => folder.unary(n, foldPhpAstNode(n.what, folder)),
        type_cast: (n) => folder.typeCast(n, foldPhpAstNode(n.expr, folder)),
        ternary: (n) => folder.ternary(n, foldPhpAstNode(n.condition, folder), foldPhpAstNode(n.truthy, folder), foldPhpAstNode(n.falsy, folder)),
        array: (n) => folder.array(n, n.items.map(item => ({ key: foldPhpArrayKey(item.key, folder), value: foldPhpAstNode(item.value, folder) }))),
        literal: (n) => folder.literal(n),
        static_constant: (n) => folder.staticConstant(n),
        variable: (n) => folder.variable(n),
        unsupported: (n) => folder.unsupported(n)
    };
    const handler = FOLD_DISPATCH[node.kind];
    return handler(node as never);
}
