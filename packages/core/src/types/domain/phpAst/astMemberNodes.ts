/**
 * astMemberNodes.ts
 *
 * Member Access and Invocation AST Variants.
 *
 * @module core/types/domain/phpAst
 */

import type { SourceRef } from '../../../types/semantic';
import type { PhpAstKind } from './kinds';
import type { PhpAstNode } from './nodes';

export interface BasePhpAstNode<K extends PhpAstKind = PhpAstKind> {
    readonly kind: K;
    readonly originalCode: string;
    readonly source?: SourceRef;
}

export interface PropertyLookupAstNode extends BasePhpAstNode<'property_lookup'> {
    readonly target: PhpAstNode;
    readonly property: string;
}
export interface NullsafePropertyLookupAstNode extends BasePhpAstNode<'nullsafe_property_lookup'> {
    readonly target: PhpAstNode;
    readonly property: string;
}
export interface OffsetLookupAstNode extends BasePhpAstNode<'offset_lookup'> {
    readonly target: PhpAstNode;
    readonly property: string;
}
export interface StaticLookupAstNode extends BasePhpAstNode<'static_lookup'> {
    readonly className: string;
    readonly property: string;
}
export interface FunctionCallAstNode extends BasePhpAstNode<'function_call'> {
    readonly name: string;
    readonly args: readonly PhpAstNode[];
}
export interface MethodCallAstNode extends BasePhpAstNode<'method_call'> {
    readonly target: PhpAstNode;
    readonly name: string;
    readonly args: readonly PhpAstNode[];
}
export interface NullsafeMethodCallAstNode extends BasePhpAstNode<'nullsafe_method_call'> {
    readonly target: PhpAstNode;
    readonly name: string;
    readonly args: readonly PhpAstNode[];
}
export interface StaticMethodCallAstNode extends BasePhpAstNode<'static_method_call'> {
    readonly className: string;
    readonly name: string;
    readonly args: readonly PhpAstNode[];
}
export interface VariableCallAstNode extends BasePhpAstNode<'variable_call'> {
    readonly name: string;
    readonly args: readonly PhpAstNode[];
}
export interface NewInstanceAstNode extends BasePhpAstNode<'new_instance'> {
    readonly className: string;
    readonly args: readonly PhpAstNode[];
}
export interface ClosureAstNode extends BasePhpAstNode<'closure'> {
    readonly body: PhpAstNode;
}
export interface ArrowFuncAstNode extends BasePhpAstNode<'arrow_func'> {
    readonly body: PhpAstNode;
}
