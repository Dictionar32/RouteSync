/**
 * memberAlgebra.ts
 *
 * Member Access and Invocation F-Algebra Slices.
 *
 * @module cli/parsers/php/algebra
 */

import type { FieldNode } from '@routesync/core';
import type { PropertyLookupAstNode, NullsafePropertyLookupAstNode, OffsetLookupAstNode, StaticLookupAstNode, FunctionCallAstNode, MethodCallAstNode, NullsafeMethodCallAstNode, StaticMethodCallAstNode, VariableCallAstNode, NewInstanceAstNode, ClosureAstNode, ArrowFuncAstNode } from '@routesync/core';

export const MEMBER_ALGEBRA_SLICE = Object.freeze({
    propertyLookup: (node: PropertyLookupAstNode, foldedTarget: FieldNode): FieldNode => Object.freeze({
        kind: 'property_access', originalCode: node.originalCode, target: foldedTarget, property: node.property, accessKind: 'property_access'
    }),
    nullsafePropertyLookup: (node: NullsafePropertyLookupAstNode, foldedTarget: FieldNode): FieldNode => Object.freeze({
        kind: 'nullsafe_property_access', originalCode: node.originalCode, target: foldedTarget, property: node.property
    }),
    offsetLookup: (node: OffsetLookupAstNode, foldedTarget: FieldNode): FieldNode => Object.freeze({
        kind: 'property_access', originalCode: node.originalCode, target: foldedTarget, property: node.property, accessKind: 'array_access'
    }),
    staticLookup: (node: StaticLookupAstNode): FieldNode => Object.freeze({
        kind: 'static_method_call', originalCode: node.originalCode, className: node.className, name: node.property, args: []
    }),
    functionCall: (node: FunctionCallAstNode, foldedArgs: readonly FieldNode[]): FieldNode => Object.freeze({
        kind: 'method_call', originalCode: node.originalCode, target: null, name: node.name, args: foldedArgs as FieldNode[]
    }),
    methodCall: (node: MethodCallAstNode, foldedTarget: FieldNode, foldedArgs: readonly FieldNode[]): FieldNode => Object.freeze({
        kind: 'method_call', originalCode: node.originalCode, target: foldedTarget, name: node.name, args: foldedArgs as FieldNode[]
    }),
    nullsafeMethodCall: (node: NullsafeMethodCallAstNode, foldedTarget: FieldNode, foldedArgs: readonly FieldNode[]): FieldNode => Object.freeze({
        kind: 'method_call', originalCode: node.originalCode, target: foldedTarget, name: node.name, args: foldedArgs as FieldNode[]
    }),
    staticMethodCall: (node: StaticMethodCallAstNode, foldedArgs: readonly FieldNode[]): FieldNode => Object.freeze({
        kind: 'static_method_call', originalCode: node.originalCode, className: node.className, name: node.name, args: foldedArgs as FieldNode[]
    }),
    variableCall: (node: VariableCallAstNode, foldedArgs: readonly FieldNode[]): FieldNode => Object.freeze({
        kind: 'method_call', originalCode: node.originalCode, target: null, name: node.name, args: foldedArgs as FieldNode[]
    }),
    newInstance: (node: NewInstanceAstNode, foldedArgs: readonly FieldNode[]): FieldNode => Object.freeze({
        kind: 'new_instance', originalCode: node.originalCode, className: node.className, args: foldedArgs as FieldNode[]
    }),
    closure: (_node: ClosureAstNode, foldedBody: FieldNode): FieldNode => foldedBody,
    arrowFunc: (_node: ArrowFuncAstNode, foldedBody: FieldNode): FieldNode => foldedBody
});
