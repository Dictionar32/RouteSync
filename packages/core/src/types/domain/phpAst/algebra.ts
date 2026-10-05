/**
 * algebra.ts
 *
 * Recursive Tree Fold (F-Algebra) and 1-Level Catamorphism for PhpAstNode.
 * Pure functional bottom-up reduction, 0 if, 0 switch.
 *
 * @module core/types/domain/phpAst
 */

import type { PhpAstNode, ArrayEntryAstNode } from './nodes';
import { relationProject, relationOptionFold, relationRefine } from '../../../semantic/foundation/relationalSequence';
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

const dispatchPhpAstKind = <K extends PhpAstNode['kind'], R>(
    node: PhpAstNode,
    kind: K,
    handler: (value: Extract<PhpAstNode, { readonly kind: K }>) => R,
    fallback: () => R,
): R => relationOptionFold(
    relationRefine(node, (candidate): candidate is Extract<PhpAstNode, { readonly kind: K }> => candidate.kind === kind),
    fallback,
    handler,
);

export function matchPhpAstNode<R>(node: PhpAstNode, visitor: PhpAstVisitor<R>): R {
    return dispatchPhpAstKind(node, 'property_lookup', visitor.property_lookup, () =>
        dispatchPhpAstKind(node, 'nullsafe_property_lookup', visitor.nullsafe_property_lookup, () =>
            dispatchPhpAstKind(node, 'offset_lookup', visitor.offset_lookup, () =>
                dispatchPhpAstKind(node, 'static_property_lookup', visitor.static_property_lookup, () =>
                    dispatchPhpAstKind(node, 'function_call', visitor.function_call, () =>
                        dispatchPhpAstKind(node, 'method_call', visitor.method_call, () =>
                            dispatchPhpAstKind(node, 'nullsafe_method_call', visitor.nullsafe_method_call, () =>
                                dispatchPhpAstKind(node, 'static_method_call', visitor.static_method_call, () =>
                                    dispatchPhpAstKind(node, 'variable_call', visitor.variable_call, () =>
                                        dispatchPhpAstKind(node, 'new_instance', visitor.new_instance, () =>
                                            dispatchPhpAstKind(node, 'closure', visitor.closure, () =>
                                                dispatchPhpAstKind(node, 'arrow_func', visitor.arrow_func, () =>
                                                    dispatchPhpAstKind(node, 'binary', visitor.binary, () =>
                                                        dispatchPhpAstKind(node, 'unary', visitor.unary, () =>
                                                            dispatchPhpAstKind(node, 'type_cast', visitor.type_cast, () =>
                                                                dispatchPhpAstKind(node, 'ternary', visitor.ternary, () =>
                                                                    dispatchPhpAstKind(node, 'array', visitor.array, () =>
                                                                        dispatchPhpAstKind(node, 'literal', visitor.literal, () =>
                                                                            dispatchPhpAstKind(node, 'static_constant', visitor.static_constant, () =>
                                                                                dispatchPhpAstKind(node, 'variable', visitor.variable, () =>
                                                                                    dispatchPhpAstKind(node, 'unsupported', visitor.unsupported, () => {
                                                                                        throw Error('Unreachable PhpAstNode kind');
                                                                                    })
                                                                                )
                                                                            )
                                                                        )
                                                                    )
                                                                )
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
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

const foldPhpArrayKey = <R>(key: ArrayKey, folder: PhpAstFolder<R>): FoldedArrayKey<R> =>
    relationOptionFold(
        relationRefine(key, (candidate): candidate is Extract<ArrayKey, { readonly kind: 'explicit' }> => candidate.kind === 'explicit'),
        () => ({ kind: 'implicit' }),
        explicit => ({ kind: 'explicit', expression: foldPhpAstNode(explicit.expression, folder) }),
    );

const foldPhpArgumentValue = <R>(argument: PhpArgument, folder: PhpAstFolder<R>): R =>
    foldPhpAstNode(argument.value, folder);

const foldPhpAstArgument = <R>(argument: PhpArgument, folder: PhpAstFolder<R>): FoldedPhpArgument<R> =>
    relationOptionFold(
        relationRefine(argument, (candidate): candidate is Extract<PhpArgument, { readonly kind: 'positional' }> => candidate.kind === 'positional'),
        () => relationOptionFold(
            relationRefine(argument, (candidate): candidate is Extract<PhpArgument, { readonly kind: 'named' }> => candidate.kind === 'named'),
            () => relationOptionFold(
                relationRefine(argument, (candidate): candidate is Extract<PhpArgument, { readonly kind: 'unpacked' }> => candidate.kind === 'unpacked'),
                () => ({ kind: 'unpacked', value: foldPhpArgumentValue(argument, folder) }),
                unpacked => ({ kind: 'unpacked', value: foldPhpArgumentValue(unpacked, folder) }),
            ),
            named => ({ kind: 'named', name: named.name, value: foldPhpArgumentValue(named, folder) }),
        ),
        positional => ({ kind: 'positional', value: foldPhpArgumentValue(positional, folder) }),
    );

export type FoldedPhpReturnExpression<R> =
    | { readonly kind: 'value'; readonly value: R }
    | { readonly kind: 'void' };

export type FoldedPhpStatement<R> =
    | { readonly kind: 'expression_statement'; readonly expression: R }
    | { readonly kind: 'return_statement'; readonly expression: FoldedPhpReturnExpression<R> };

const foldPhpReturnExpression = <R>(expression: PhpReturnExpression, folder: PhpAstFolder<R>): FoldedPhpReturnExpression<R> =>
    relationOptionFold(
        relationRefine(expression, (candidate): candidate is Extract<PhpReturnExpression, { readonly kind: 'value' }> => candidate.kind === 'value'),
        () => ({ kind: 'void' }),
        value => ({ kind: 'value', value: foldPhpAstNode(value.value, folder) }),
    );

const foldPhpStatement = <R>(statement: PhpStatement, folder: PhpAstFolder<R>): FoldedPhpStatement<R> =>
    relationOptionFold(
        relationRefine(statement, (candidate): candidate is Extract<PhpStatement, { readonly kind: 'expression_statement' }> => candidate.kind === 'expression_statement'),
        () => relationOptionFold(
            relationRefine(statement, (candidate): candidate is Extract<PhpStatement, { readonly kind: 'return_statement' }> => candidate.kind === 'return_statement'),
            () => { throw Error('Unreachable PhpStatement kind'); },
            returned => ({ kind: 'return_statement', expression: foldPhpReturnExpression(returned.expression, folder) }),
        ),
        expression => ({ kind: 'expression_statement', expression: foldPhpAstNode(expression.expression, folder) }),
    );

function foldPhpBlock<R>(block: PhpBlock, folder: PhpAstFolder<R>): readonly FoldedPhpStatement<R>[] {
    return relationProject(block.statements, statement => foldPhpStatement(statement, folder));
}

export function foldPhpAstNode<R>(node: PhpAstNode, folder: PhpAstFolder<R>): R {
    const FOLD_DISPATCH: PhpAstVisitor<R> = {
        property_lookup: (n) => folder.propertyLookup(n, foldPhpAstNode(n.target, folder)),
        nullsafe_property_lookup: (n) => folder.nullsafePropertyLookup(n, foldPhpAstNode(n.target, folder)),
        offset_lookup: (n) => folder.offsetLookup(n, foldPhpAstNode(n.target, folder), foldPhpAstNode(n.offset, folder)),
        static_property_lookup: (n) => folder.staticPropertyLookup(n),
        function_call: (n) => folder.functionCall(n, relationProject(n.args, a => foldPhpAstArgument(a, folder))),
        method_call: (n) => folder.methodCall(n, foldPhpAstNode(n.target, folder), relationProject(n.args, a => foldPhpAstArgument(a, folder))),
        nullsafe_method_call: (n) => folder.nullsafeMethodCall(n, foldPhpAstNode(n.target, folder), relationProject(n.args, a => foldPhpAstArgument(a, folder))),
        static_method_call: (n) => folder.staticMethodCall(n, relationProject(n.args, a => foldPhpAstArgument(a, folder))),
        variable_call: (n) => folder.variableCall(n, relationProject(n.args, a => foldPhpAstArgument(a, folder))),
        new_instance: (n) => folder.newInstance(n, relationProject(n.args, a => foldPhpAstArgument(a, folder))),
        closure: (n) => folder.closure(n, foldPhpBlock(n.body, folder)),
        arrow_func: (n) => folder.arrowFunc(n, foldPhpAstNode(n.body, folder)),
        binary: (n) => folder.binary(n, foldPhpAstNode(n.left, folder), foldPhpAstNode(n.right, folder)),
        unary: (n) => folder.unary(n, foldPhpAstNode(n.what, folder)),
        type_cast: (n) => folder.typeCast(n, foldPhpAstNode(n.expr, folder)),
        ternary: (n) => folder.ternary(n, foldPhpAstNode(n.condition, folder), foldPhpAstNode(n.truthy, folder), foldPhpAstNode(n.falsy, folder)),
        array: (n) => folder.array(n, relationProject(n.items, item => ({ key: foldPhpArrayKey(item.key, folder), value: foldPhpAstNode(item.value, folder) }))),
        literal: (n) => folder.literal(n),
        static_constant: (n) => folder.staticConstant(n),
        variable: (n) => folder.variable(n),
        unsupported: (n) => folder.unsupported(n)
    };
    return matchPhpAstNode(node, FOLD_DISPATCH);
}
