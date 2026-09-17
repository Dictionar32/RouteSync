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
    switch (node.kind) {
        case 'propertylookup': return visitor.propertylookup(node);
        case 'nullsafepropertylookup': return visitor.nullsafepropertylookup(node);
        case 'offsetlookup': return visitor.offsetlookup(node);
        case 'staticlookup': return visitor.staticlookup(node);
        case 'call': return visitor.call(node);
        case 'new': return visitor.new(node);
        case 'closure': return visitor.closure(node);
        case 'arrowfunc': return visitor.arrowfunc(node);
        case 'bin': return visitor.bin(node);
        case 'unary': return visitor.unary(node);
        case 'cast': return visitor.cast(node);
        case 'retif': return visitor.retif(node);
        case 'array': return visitor.array(node);
        case 'string': return visitor.string(node);
        case 'number': return visitor.number(node);
        case 'boolean': return visitor.boolean(node);
        case 'nullkeyword': return visitor.nullkeyword(node);
        case 'encapsed': return visitor.encapsed(node);
        case 'variable': return visitor.variable(node);
        case 'unknown': return visitor.unknown(node);
        case 'identifier':
        case 'name':
        case 'selfreference':
        case 'staticreference':
        case 'entry':
            throw new Error(`PHP AST grammar matcher: ${node.kind} is not an expression node`);
    }
}
