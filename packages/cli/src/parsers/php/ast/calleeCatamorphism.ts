/**
 * Typed callee classifier at the parser boundary.
 * It only identifies the syntactic callee form. Semantic meaning is downstream.
 */

import type { PhpAstNode, PhpFunctionName, PhpMethodName, PhpClassName, PhpVariableName, PhpArgument } from '@routesync/core';
import type { PhpGrammarNode, GrammarIdentifier, GrammarName, GrammarPropertyLookup, GrammarNullsafeLookup, GrammarStaticLookup, GrammarVariable, GrammarUnknown } from './grammar';

const functionName = (value: string): PhpFunctionName => ({ kind: 'function_name', value });
const methodName = (value: string): PhpMethodName => ({ kind: 'method_name', value });
const className = (value: string): PhpClassName => ({ kind: 'class_name', value });
const variableName = (value: string): PhpVariableName => ({ kind: 'variable_name', value });
function memberName(node: GrammarPropertyLookup['offset'], label: string): string {
    if (node.kind === 'identifier' || node.kind === 'name') return node.name;
    throw new Error(`PHP AST boundary: invalid ${label} node ${node.kind}`);
}

function classReference(node: PhpGrammarNode): string {
    if (node.kind === 'name') return node.name;
    if (node.kind === 'selfreference' || node.kind === 'staticreference') return node.raw;
    throw new Error(`PHP AST boundary: invalid class reference node ${node.kind}`);
}

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
        unknown: (_callee, _args, code) => ({ kind: 'unsupported', originalCode: code, source: { kind: 'absent' }, reason: { kind: 'unsupported_syntax' } })
    });
}

export function matchCallee<R>(callee: PhpGrammarNode, args: readonly PhpArgument[], code: string, visitor: CalleeVisitor<R>): R {
    switch (callee.kind) {
        case 'identifier': return visitor.identifier(callee, args, code);
        case 'name': return visitor.name(callee, args, code);
        case 'propertylookup': return visitor.propertylookup(callee, args, code);
        case 'nullsafepropertylookup': return visitor.nullsafepropertylookup(callee, args, code);
        case 'staticlookup': return visitor.staticlookup(callee, args, code);
        case 'variable': return visitor.variable(callee, args, code);
        default: return visitor.unknown(callee, args, code);
    }
}
