/**
 * algebra.ts
 *
 * Recursive Tree Fold (F-Algebra) and 1-Level Catamorphism for PhpAstNode.
 * Pure functional bottom-up reduction, 0 if, 0 switch.
 *
 * @module core/types/domain/phpAst
 */

import type { PhpAstNode, ArrayEntryAstNode } from './nodes';
import type { PropertyLookupAstNode, NullsafePropertyLookupAstNode, OffsetLookupAstNode, StaticLookupAstNode, FunctionCallAstNode, MethodCallAstNode, NullsafeMethodCallAstNode, StaticMethodCallAstNode, VariableCallAstNode, NewInstanceAstNode, ClosureAstNode, ArrowFuncAstNode, BinaryAstNode, UnaryAstNode, TypeCastAstNode, TernaryAstNode, ArrayAstNode, LiteralAstNode, StaticConstantAstNode, VariableAstNode, UnknownAstNode } from './nodes';

export interface PhpAstVisitor<R> {
    readonly property_lookup: (node: PropertyLookupAstNode) => R;
    readonly nullsafe_property_lookup: (node: NullsafePropertyLookupAstNode) => R;
    readonly offset_lookup: (node: OffsetLookupAstNode) => R;
    readonly static_lookup: (node: StaticLookupAstNode) => R;
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
    readonly unknown: (node: UnknownAstNode) => R;
}

export function matchPhpAstNode<R>(node: PhpAstNode, visitor: PhpAstVisitor<R>): R {
    return visitor[node.kind](node as any);
}

export interface PhpAstFolder<R> {
    readonly propertyLookup: (node: PropertyLookupAstNode, foldedTarget: R) => R;
    readonly nullsafePropertyLookup: (node: NullsafePropertyLookupAstNode, foldedTarget: R) => R;
    readonly offsetLookup: (node: OffsetLookupAstNode, foldedTarget: R) => R;
    readonly staticLookup: (node: StaticLookupAstNode) => R;
    readonly functionCall: (node: FunctionCallAstNode, foldedArgs: readonly R[]) => R;
    readonly methodCall: (node: MethodCallAstNode, foldedTarget: R, foldedArgs: readonly R[]) => R;
    readonly nullsafeMethodCall: (node: NullsafeMethodCallAstNode, foldedTarget: R, foldedArgs: readonly R[]) => R;
    readonly staticMethodCall: (node: StaticMethodCallAstNode, foldedArgs: readonly R[]) => R;
    readonly variableCall: (node: VariableCallAstNode, foldedArgs: readonly R[]) => R;
    readonly newInstance: (node: NewInstanceAstNode, foldedArgs: readonly R[]) => R;
    readonly closure: (node: ClosureAstNode, foldedBody: R) => R;
    readonly arrowFunc: (node: ArrowFuncAstNode, foldedBody: R) => R;
    readonly binary: (node: BinaryAstNode, foldedLeft: R, foldedRight: R) => R;
    readonly unary: (node: UnaryAstNode, foldedWhat: R) => R;
    readonly typeCast: (node: TypeCastAstNode, foldedExpr: R) => R;
    readonly ternary: (node: TernaryAstNode, foldedCond: R, foldedTruthy: R, foldedFalsy: R) => R;
    readonly array: (node: ArrayAstNode, foldedItems: readonly { readonly key: string | null; readonly value: R }[]) => R;
    readonly literal: (node: LiteralAstNode) => R;
    readonly staticConstant: (node: StaticConstantAstNode) => R;
    readonly variable: (node: VariableAstNode) => R;
    readonly unknown: (node: UnknownAstNode) => R;
}

export function foldPhpAstNode<R>(node: PhpAstNode, folder: PhpAstFolder<R>): R {
    const FOLD_DISPATCH: PhpAstVisitor<R> = {
        property_lookup: (n) => folder.propertyLookup(n, foldPhpAstNode(n.target, folder)),
        nullsafe_property_lookup: (n) => folder.nullsafePropertyLookup(n, foldPhpAstNode(n.target, folder)),
        offset_lookup: (n) => folder.offsetLookup(n, foldPhpAstNode(n.target, folder)),
        static_lookup: (n) => folder.staticLookup(n),
        function_call: (n) => folder.functionCall(n, n.args.map(a => foldPhpAstNode(a, folder))),
        method_call: (n) => folder.methodCall(n, foldPhpAstNode(n.target, folder), n.args.map(a => foldPhpAstNode(a, folder))),
        nullsafe_method_call: (n) => folder.nullsafeMethodCall(n, foldPhpAstNode(n.target, folder), n.args.map(a => foldPhpAstNode(a, folder))),
        static_method_call: (n) => folder.staticMethodCall(n, n.args.map(a => foldPhpAstNode(a, folder))),
        variable_call: (n) => folder.variableCall(n, n.args.map(a => foldPhpAstNode(a, folder))),
        new_instance: (n) => folder.newInstance(n, n.args.map(a => foldPhpAstNode(a, folder))),
        closure: (n) => folder.closure(n, foldPhpAstNode(n.body, folder)),
        arrow_func: (n) => folder.arrowFunc(n, foldPhpAstNode(n.body, folder)),
        binary: (n) => folder.binary(n, foldPhpAstNode(n.left, folder), foldPhpAstNode(n.right, folder)),
        unary: (n) => folder.unary(n, foldPhpAstNode(n.what, folder)),
        type_cast: (n) => folder.typeCast(n, foldPhpAstNode(n.expr, folder)),
        ternary: (n) => folder.ternary(n, foldPhpAstNode(n.condition, folder), foldPhpAstNode(n.truthy, folder), foldPhpAstNode(n.falsy, folder)),
        array: (n) => folder.array(n, n.items.map(item => ({ key: item.key, value: foldPhpAstNode(item.value, folder) }))),
        literal: (n) => folder.literal(n),
        static_constant: (n) => folder.staticConstant(n),
        variable: (n) => folder.variable(n),
        unknown: (n) => folder.unknown(n)
    };
    return FOLD_DISPATCH[node.kind](node as any);
}
