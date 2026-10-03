/** Declarative callee relation dispatcher at the parser boundary. */
import type { PhpAstNode, PhpFunctionName, PhpMethodName, PhpClassName, PhpVariableName, PhpArgument } from '@routesync/core';
import type { PhpGrammarNode, GrammarIdentifier, GrammarName, GrammarPropertyLookup, GrammarNullsafeLookup, GrammarStaticLookup, GrammarVariable, GrammarUnknown } from './grammar';

const functionName = (value: string): PhpFunctionName => ({ kind: 'function_name', value });
const methodName = (value: string): PhpMethodName => ({ kind: 'method_name', value });
const className = (value: string): PhpClassName => ({ kind: 'class_name', value });
const variableName = (value: string): PhpVariableName => ({ kind: 'variable_name', value });
const memberReaders = Object.freeze({
  identifier: (node: GrammarIdentifier) => node.name,
  name: (node: GrammarName) => node.name,
});
const invalidMember = (node: never, label: string): never => {
  throw new Error(`PHP AST boundary: invalid ${label} node ${(node as PhpGrammarNode).kind}`);
};
const memberName = (node: GrammarPropertyLookup['offset'], label: string): string =>
  (memberReaders[node.kind as 'identifier' | 'name'] ?? ((value: never) => invalidMember(value, label)))(node as never);

const classReaders = Object.freeze({
  name: (node: Extract<PhpGrammarNode, { kind: 'name' }>) => node.name,
  selfreference: (node: Extract<PhpGrammarNode, { kind: 'selfreference' }>) => node.raw,
  staticreference: (node: Extract<PhpGrammarNode, { kind: 'staticreference' }>) => node.raw,
});
const classReference = (node: PhpGrammarNode): string =>
  (classReaders[node.kind as keyof typeof classReaders] ?? ((value: never) => invalidMember(value, 'class reference')))(node as never);

export type UnsupportedCallee = Exclude<PhpGrammarNode, GrammarIdentifier | GrammarName | GrammarPropertyLookup | GrammarNullsafeLookup | GrammarStaticLookup | GrammarVariable>;

export interface CalleeVisitor<R> {
  readonly identifier: (callee: GrammarIdentifier, args: readonly PhpArgument[], code: string) => R;
  readonly name: (callee: GrammarName, args: readonly PhpArgument[], code: string) => R;
  readonly propertylookup: (callee: GrammarPropertyLookup, args: readonly PhpArgument[], code: string) => R;
  readonly nullsafepropertylookup: (callee: GrammarNullsafeLookup, args: readonly PhpArgument[], code: string) => R;
  readonly staticlookup: (callee: GrammarStaticLookup, args: readonly PhpArgument[], code: string) => R;
  readonly variable: (callee: GrammarVariable, args: readonly PhpArgument[], code: string) => R;
  readonly unknown: (callee: UnsupportedCallee, args: readonly PhpArgument[], code: string) => R;
}

export function createCalleeAstVisitor(adaptNode: (node: PhpGrammarNode) => PhpAstNode): CalleeVisitor<PhpAstNode> {
  return Object.freeze({
    identifier: (callee, args, code) => ({ kind: 'function_call', originalCode: code, source: { kind: 'absent' }, name: functionName(callee.name), args }),
    name: (callee, args, code) => ({ kind: 'function_call', originalCode: code, source: { kind: 'absent' }, name: functionName(lastName(callee.name)), args }),
    propertylookup: (callee, args, code) => ({ kind: 'method_call', originalCode: code, source: { kind: 'absent' }, target: adaptNode(callee.what), name: methodName(memberName(callee.offset, 'method')), args }),
    nullsafepropertylookup: (callee, args, code) => ({ kind: 'nullsafe_method_call', originalCode: code, source: { kind: 'absent' }, target: adaptNode(callee.what), name: methodName(memberName(callee.offset, 'method')), args }),
    staticlookup: (callee, args, code) => ({ kind: 'static_method_call', originalCode: code, source: { kind: 'absent' }, className: className(classReference(callee.what)), name: methodName(memberName(callee.offset, 'method')), args }),
    variable: (callee, args, code) => ({ kind: 'variable_call', originalCode: code, source: { kind: 'absent' }, name: variableName(callee.name), args }),
    unknown: (_callee, _args, code) => ({ kind: 'unsupported', originalCode: code, source: { kind: 'absent' }, reason: { kind: 'unsupported_syntax' } }),
  });
}

const unknownCallee = <R>(callee: PhpGrammarNode, args: readonly PhpArgument[], code: string, visitor: CalleeVisitor<R>): R =>
  visitor.unknown(callee as UnsupportedCallee, args, code);

export function matchCallee<R>(callee: PhpGrammarNode, args: readonly PhpArgument[], code: string, visitor: CalleeVisitor<R>): R {
  const handlers: Readonly<Record<string, (node: PhpGrammarNode) => R>> = Object.freeze({
    identifier: node => visitor.identifier(node as GrammarIdentifier, args, code),
    name: node => visitor.name(node as GrammarName, args, code),
    propertylookup: node => visitor.propertylookup(node as GrammarPropertyLookup, args, code),
    nullsafepropertylookup: node => visitor.nullsafepropertylookup(node as GrammarNullsafeLookup, args, code),
    staticlookup: node => visitor.staticlookup(node as GrammarStaticLookup, args, code),
    variable: node => visitor.variable(node as GrammarVariable, args, code),
  });
  return (handlers[callee.kind] ?? (() => unknownCallee(callee, args, code, visitor)))(callee);
}

const lastName = (name: string): string => name.split('\\').slice(-1)[0] ?? name;
