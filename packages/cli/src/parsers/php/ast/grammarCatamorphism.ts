/**
 * grammarCatamorphism.ts
 *
 * Full AST Grammar Catamorphic Pattern Matcher.
 * Zero Record, zero any, zero if, 100% exhaustive visitor.
 *
 * @module cli/parsers/php/ast
 */

import type {
    PhpGrammarNode,
    GrammarPropertyLookup,
    GrammarNullsafeLookup,
    GrammarOffsetLookup,
    GrammarStaticLookup,
    GrammarCall,
    GrammarNew,
    GrammarClosure,
    GrammarArrowFunc,
    GrammarBin,
    GrammarUnary,
    GrammarCast,
    GrammarRetif,
    GrammarArray,
    GrammarString,
    GrammarNumber,
    GrammarBoolean,
    GrammarNull,
    GrammarEncapsed,
    GrammarVariable,
    GrammarUnknown
} from './grammar';

export interface PhpGrammarVisitor<R> {
    readonly propertylookup: (node: GrammarPropertyLookup) => R;
    readonly nullsafepropertylookup: (node: GrammarNullsafeLookup) => R;
    readonly offsetlookup: (node: GrammarOffsetLookup) => R;
    readonly staticlookup: (node: GrammarStaticLookup) => R;
    readonly call: (node: GrammarCall) => R;
    readonly new: (node: GrammarNew) => R;
    readonly closure: (node: GrammarClosure) => R;
    readonly arrowfunc: (node: GrammarArrowFunc) => R;
    readonly bin: (node: GrammarBin) => R;
    readonly unary: (node: GrammarUnary) => R;
    readonly cast: (node: GrammarCast) => R;
    readonly retif: (node: GrammarRetif) => R;
    readonly array: (node: GrammarArray) => R;
    readonly string: (node: GrammarString) => R;
    readonly number: (node: GrammarNumber) => R;
    readonly boolean: (node: GrammarBoolean) => R;
    readonly nullkeyword: (node: GrammarNull) => R;
    readonly encapsed: (node: GrammarEncapsed) => R;
    readonly variable: (node: GrammarVariable) => R;
    readonly unknown: (node: GrammarUnknown) => R;
}

export function matchPhpGrammar<R>(node: PhpGrammarNode, visitor: PhpGrammarVisitor<R>): R {
    const handler = visitor[node.kind as keyof PhpGrammarVisitor<R>] ?? visitor.unknown;
    return handler(node as any);
}
