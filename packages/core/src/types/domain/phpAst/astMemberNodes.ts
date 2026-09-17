/**
 * astMemberNodes.ts
 *
 * Member Access and Invocation AST Variants.
 *
 * @module core/types/domain/phpAst
 */

import type { PhpAstKind } from './kinds';
import type { PhpAstNode } from './nodes';
import type { PhpClassName, PhpMethodName, PhpPropertyName, PhpFunctionName, PhpVariableName, PhpParameter, PhpClosureCapture, PhpArgument, PhpBlock } from './astValues';

export interface BasePhpAstNode<K extends PhpAstKind = PhpAstKind> {
    readonly kind: K;
    readonly originalCode: string;
    readonly source: import('./astValues').PhpAstSource;
}

export interface PropertyLookupAstNode extends BasePhpAstNode<'property_lookup'> {
    readonly target: PhpAstNode;
    readonly property: PhpPropertyName;
}
export interface NullsafePropertyLookupAstNode extends BasePhpAstNode<'nullsafe_property_lookup'> {
    readonly target: PhpAstNode;
    readonly property: PhpPropertyName;
}
export interface OffsetLookupAstNode extends BasePhpAstNode<'offset_lookup'> {
    readonly target: PhpAstNode;
    readonly offset: PhpAstNode;
}
export interface StaticPropertyLookupAstNode extends BasePhpAstNode<'static_property_lookup'> {
    readonly className: PhpClassName;
    readonly property: PhpPropertyName;
}
export interface FunctionCallAstNode extends BasePhpAstNode<'function_call'> {
    readonly name: PhpFunctionName;
    readonly args: readonly PhpArgument[];
}
export interface MethodCallAstNode extends BasePhpAstNode<'method_call'> {
    readonly target: PhpAstNode;
    readonly name: PhpMethodName;
    readonly args: readonly PhpArgument[];
}
export interface NullsafeMethodCallAstNode extends BasePhpAstNode<'nullsafe_method_call'> {
    readonly target: PhpAstNode;
    readonly name: PhpMethodName;
    readonly args: readonly PhpArgument[];
}
export interface StaticMethodCallAstNode extends BasePhpAstNode<'static_method_call'> {
    readonly className: PhpClassName;
    readonly name: PhpMethodName;
    readonly args: readonly PhpArgument[];
}
export interface VariableCallAstNode extends BasePhpAstNode<'variable_call'> {
    readonly name: PhpVariableName;
    readonly args: readonly PhpArgument[];
}
export interface NewInstanceAstNode extends BasePhpAstNode<'new_instance'> {
    readonly className: PhpClassName;
    readonly args: readonly PhpArgument[];
}
export interface ClosureAstNode extends BasePhpAstNode<'closure'> {
    readonly parameters: readonly PhpParameter[];
    readonly captures: readonly PhpClosureCapture[];
    readonly body: PhpBlock;
}
export interface ArrowFuncAstNode extends BasePhpAstNode<'arrow_func'> {
    readonly parameters: readonly PhpParameter[];
    readonly body: PhpAstNode;
}
