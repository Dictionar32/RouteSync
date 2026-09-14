/**
 * nodes.ts
 *
 * Computation, Container, Literal AST Variants and Union.
 *
 * @module core/types/domain/phpAst
 */

import type { BasePhpAstNode, PropertyLookupAstNode, NullsafePropertyLookupAstNode, OffsetLookupAstNode, StaticLookupAstNode, FunctionCallAstNode, MethodCallAstNode, NullsafeMethodCallAstNode, StaticMethodCallAstNode, VariableCallAstNode, NewInstanceAstNode, ClosureAstNode, ArrowFuncAstNode } from './astMemberNodes';

export type { BasePhpAstNode, PropertyLookupAstNode, NullsafePropertyLookupAstNode, OffsetLookupAstNode, StaticLookupAstNode, FunctionCallAstNode, MethodCallAstNode, NullsafeMethodCallAstNode, StaticMethodCallAstNode, VariableCallAstNode, NewInstanceAstNode, ClosureAstNode, ArrowFuncAstNode };

// Computations
export interface BinaryAstNode extends BasePhpAstNode<'binary'> {
    readonly operator: string;
    readonly left: PhpAstNode;
    readonly right: PhpAstNode;
}
export interface UnaryAstNode extends BasePhpAstNode<'unary'> {
    readonly operator: string;
    readonly what: PhpAstNode;
}
export interface TypeCastAstNode extends BasePhpAstNode<'type_cast'> {
    readonly castType: 'int' | 'float' | 'string' | 'bool';
    readonly expr: PhpAstNode;
}
export interface TernaryAstNode extends BasePhpAstNode<'ternary'> {
    readonly condition: PhpAstNode;
    readonly truthy: PhpAstNode;
    readonly falsy: PhpAstNode;
}

// Containers & Literals
export interface ArrayEntryAstNode {
    readonly key: string | null;
    readonly value: PhpAstNode;
}
export interface ArrayAstNode extends BasePhpAstNode<'array'> {
    readonly items: readonly ArrayEntryAstNode[];
}
export interface LiteralAstNode extends BasePhpAstNode<'literal'> {
    readonly value: string | number | boolean | null;
}
export interface StaticConstantAstNode extends BasePhpAstNode<'static_constant'> {
    readonly className: string;
    readonly constantName: string;
}
export interface VariableAstNode extends BasePhpAstNode<'variable'> {
    readonly name: string;
}
export interface UnknownAstNode extends BasePhpAstNode<'unknown'> {
    readonly code: string;
}

export type PhpAstNode =
    | PropertyLookupAstNode | NullsafePropertyLookupAstNode | OffsetLookupAstNode | StaticLookupAstNode
    | FunctionCallAstNode | MethodCallAstNode | NullsafeMethodCallAstNode | StaticMethodCallAstNode
    | VariableCallAstNode | NewInstanceAstNode | ClosureAstNode | ArrowFuncAstNode
    | BinaryAstNode | UnaryAstNode | TypeCastAstNode | TernaryAstNode
    | ArrayAstNode | LiteralAstNode | StaticConstantAstNode | VariableAstNode | UnknownAstNode;
