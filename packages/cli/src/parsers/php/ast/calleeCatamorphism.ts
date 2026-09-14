/**
 * calleeCatamorphism.ts
 *
 * Catamorphic Double-Dispatch for PHP Invocation Callees.
 * Zero Record, zero if, eliminates 7 latent call branches.
 *
 * @module cli/parsers/php/ast
 */

import type { PhpAstNode } from '@routesync/core';
import type { PhpGrammarNode, GrammarIdentifier, GrammarName, GrammarPropertyLookup, GrammarNullsafeLookup, GrammarStaticLookup, GrammarVariable, GrammarUnknown } from './grammar';
import { extractOffsetString } from './offsetCatamorphism';

export interface CalleeVisitor<R> {
    readonly identifier: (callee: GrammarIdentifier, args: readonly PhpAstNode[], code: string) => R;
    readonly name: (callee: GrammarName, args: readonly PhpAstNode[], code: string) => R;
    readonly propertylookup: (callee: GrammarPropertyLookup, args: readonly PhpAstNode[], code: string) => R;
    readonly nullsafepropertylookup: (callee: GrammarNullsafeLookup, args: readonly PhpAstNode[], code: string) => R;
    readonly staticlookup: (callee: GrammarStaticLookup, args: readonly PhpAstNode[], code: string) => R;
    readonly variable: (callee: GrammarVariable, args: readonly PhpAstNode[], code: string) => R;
    readonly unknown: (callee: GrammarUnknown, args: readonly PhpAstNode[], code: string) => R;
}

export function createCalleeAstVisitor(adaptNode: (n: PhpGrammarNode) => PhpAstNode): CalleeVisitor<PhpAstNode> {
    return Object.freeze({
        identifier: (c, args, code) => Object.freeze({ kind: 'function_call', originalCode: code, name: c.name, args }),
        name: (c, args, code) => Object.freeze({ kind: 'function_call', originalCode: code, name: (c.name || '').split('\\').pop() || '', args }),
        propertylookup: (c, args, code) => Object.freeze({ kind: 'method_call', originalCode: code, target: adaptNode(c.what), name: extractOffsetString(c.offset), args }),
        nullsafepropertylookup: (c, args, code) => Object.freeze({ kind: 'nullsafe_method_call', originalCode: code, target: adaptNode(c.what), name: extractOffsetString(c.offset), args }),
        staticlookup: (c, args, code) => Object.freeze({ kind: 'static_method_call', originalCode: code, className: ((c.what as any)?.name || '').split('\\').pop() || '', name: extractOffsetString(c.offset), args }),
        variable: (c, args, code) => Object.freeze({ kind: 'variable_call', originalCode: code, name: c.name, args }),
        unknown: (c, args, code) => Object.freeze({ kind: 'method_call', originalCode: code, target: adaptNode(c as any), name: '', args })
    });
}

export function matchCallee<R>(callee: PhpGrammarNode | undefined, args: readonly PhpAstNode[], code: string, visitor: CalleeVisitor<R>): R {
    const k = callee ? (callee.kind as keyof CalleeVisitor<R>) : 'unknown';
    const handler = visitor[k] ?? visitor.unknown;
    return handler(callee as any, args, code);
}
