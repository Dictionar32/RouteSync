/**
 * nodes.ts
 *
 * Computation, Container, Literal AST Variants and Union.
 *
 * @module core/types/domain/phpAst
 */

import type { BasePhpAstNode, PropertyLookupAstNode, NullsafePropertyLookupAstNode, OffsetLookupAstNode, StaticPropertyLookupAstNode, FunctionCallAstNode, MethodCallAstNode, NullsafeMethodCallAstNode, StaticMethodCallAstNode, VariableCallAstNode, NewInstanceAstNode, ClosureAstNode, ArrowFuncAstNode } from './astMemberNodes';
import type { BoundLiteralValue } from '../semanticValues';
import type { ArrayKey, PhpArgument, PhpBlock, PhpStatement, PhpBinaryOperator, PhpCastType, PhpClassName, PhpConstantName, PhpUnaryOperator, PhpVariableName } from './astValues';

export type { PhpArgument, PhpBlock, PhpStatement, BasePhpAstNode, PropertyLookupAstNode, NullsafePropertyLookupAstNode, OffsetLookupAstNode, StaticPropertyLookupAstNode, FunctionCallAstNode, MethodCallAstNode, NullsafeMethodCallAstNode, StaticMethodCallAstNode, VariableCallAstNode, NewInstanceAstNode, ClosureAstNode, ArrowFuncAstNode };

// Computations
export interface BinaryAstNode extends BasePhpAstNode<'binary'> {
    readonly operator: PhpBinaryOperator;
    readonly left: PhpAstNode;
    readonly right: PhpAstNode;
}
export interface UnaryAstNode extends BasePhpAstNode<'unary'> {
    readonly operator: PhpUnaryOperator;
    readonly what: PhpAstNode;
}
export interface TypeCastAstNode extends BasePhpAstNode<'type_cast'> {
    readonly castType: PhpCastType;
    readonly expr: PhpAstNode;
}
export interface TernaryAstNode extends BasePhpAstNode<'ternary'> {
    readonly condition: PhpAstNode;
    readonly truthy: PhpAstNode;
    readonly falsy: PhpAstNode;
}

// Containers & Literals

export interface ArrayEntryAstNode {
    readonly key: ArrayKey;
    readonly value: PhpAstNode;
}
export interface ArrayAstNode extends BasePhpAstNode<'array'> {
    readonly items: readonly ArrayEntryAstNode[];
}
export interface LiteralAstNode extends BasePhpAstNode<'literal'> {
    readonly value: BoundLiteralValue;
}
export interface StaticConstantAstNode extends BasePhpAstNode<'static_constant'> {
    readonly className: PhpClassName;
    readonly constantName: PhpConstantName;
}
export interface VariableAstNode extends BasePhpAstNode<'variable'> {
    readonly name: PhpVariableName;
}
export type UnsupportedAstReason =
    | { readonly kind: 'parser_gap' }
    | { readonly kind: 'unsupported_syntax' }
    | { readonly kind: 'invalid_boundary_input' }
    | { readonly kind: 'missing_expression' };

export interface UnsupportedAstNode extends BasePhpAstNode<'unsupported'> {
    readonly reason: UnsupportedAstReason;
}

export type PhpAstNode =
    | PropertyLookupAstNode | NullsafePropertyLookupAstNode | OffsetLookupAstNode | StaticPropertyLookupAstNode
    | FunctionCallAstNode | MethodCallAstNode | NullsafeMethodCallAstNode | StaticMethodCallAstNode
    | VariableCallAstNode | NewInstanceAstNode | ClosureAstNode | ArrowFuncAstNode
    | BinaryAstNode | UnaryAstNode | TypeCastAstNode | TernaryAstNode
    | ArrayAstNode | LiteralAstNode | StaticConstantAstNode | VariableAstNode | UnsupportedAstNode;
