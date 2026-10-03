import { projectRelation } from '@routesync/core';
import type { FieldNode, FieldArgument, FieldStatement, FoldedPhpArgument } from '@routesync/core';
import type {
  PropertyLookupAstNode, NullsafePropertyLookupAstNode, OffsetLookupAstNode,
  StaticPropertyLookupAstNode, FunctionCallAstNode, MethodCallAstNode,
  NullsafeMethodCallAstNode, StaticMethodCallAstNode, VariableCallAstNode,
  NewInstanceAstNode, ClosureAstNode, ArrowFuncAstNode,
} from '@routesync/core';

const foldArguments = (args: readonly FoldedPhpArgument<FieldNode>[]): readonly FieldArgument[] => projectRelation(args, argument => {
  const readers: Readonly<Record<string, () => FieldArgument>> = Object.freeze({
    positional: () => ({ kind: 'positional', value: argument.value }),
    named: () => ({ kind: 'named', name: argument.name, value: argument.value }),
    unpacked: () => ({ kind: 'unpacked', value: argument.value }),
  });
  return (readers[argument.kind] ?? (() => { throw new Error(`Unknown PHP argument kind: ${argument.kind}`); }))();
});

export const MEMBER_ALGEBRA_SLICE = Object.freeze({
  propertyLookup: (node: PropertyLookupAstNode, target: FieldNode): FieldNode => Object.freeze({ kind: 'property_access', originalCode: node.originalCode, source: node.source, target, property: node.property, accessKind: 'property_access' as const }),
  nullsafePropertyLookup: (node: NullsafePropertyLookupAstNode, target: FieldNode): FieldNode => Object.freeze({ kind: 'nullsafe_property_access', originalCode: node.originalCode, source: node.source, target, property: node.property }),
  offsetLookup: (node: OffsetLookupAstNode, target: FieldNode, offset: FieldNode): FieldNode => Object.freeze({ kind: 'array_access', originalCode: node.originalCode, source: node.source, target, offset }),
  staticPropertyLookup: (node: StaticPropertyLookupAstNode): FieldNode => Object.freeze({ kind: 'static_property_access', originalCode: node.originalCode, source: node.source, className: node.className, property: node.property }),
  functionCall: (node: FunctionCallAstNode, args: readonly FoldedPhpArgument<FieldNode>[]): FieldNode => Object.freeze({ kind: 'function_call', originalCode: node.originalCode, source: node.source, name: node.name, args: foldArguments(args) }),
  methodCall: (node: MethodCallAstNode, target: FieldNode, args: readonly FoldedPhpArgument<FieldNode>[]): FieldNode => Object.freeze({ kind: 'method_call', originalCode: node.originalCode, source: node.source, target, name: node.name, args: foldArguments(args) }),
  nullsafeMethodCall: (node: NullsafeMethodCallAstNode, target: FieldNode, args: readonly FoldedPhpArgument<FieldNode>[]): FieldNode => Object.freeze({ kind: 'nullsafe_method_call', originalCode: node.originalCode, source: node.source, target, name: node.name, args: foldArguments(args) }),
  staticMethodCall: (node: StaticMethodCallAstNode, args: readonly FoldedPhpArgument<FieldNode>[]): FieldNode => Object.freeze({ kind: 'static_method_call', originalCode: node.originalCode, source: node.source, className: node.className, name: node.name, args: foldArguments(args) }),
  variableCall: (node: VariableCallAstNode, args: readonly FoldedPhpArgument<FieldNode>[]): FieldNode => Object.freeze({ kind: 'variable_call', originalCode: node.originalCode, source: node.source, name: node.name, args: foldArguments(args) }),
  newInstance: (node: NewInstanceAstNode, args: readonly FoldedPhpArgument<FieldNode>[]): FieldNode => Object.freeze({ kind: 'new_instance', originalCode: node.originalCode, source: node.source, className: node.className, args: foldArguments(args) }),
  closure: (node: ClosureAstNode, body: readonly FieldStatement[]): FieldNode => Object.freeze({ kind: 'closure', originalCode: node.originalCode, source: node.source, parameters: node.parameters, captures: node.captures, body }),
  arrowFunc: (node: ArrowFuncAstNode, body: FieldNode): FieldNode => Object.freeze({ kind: 'arrow_func', originalCode: node.originalCode, source: node.source, parameters: node.parameters, body }),
});
