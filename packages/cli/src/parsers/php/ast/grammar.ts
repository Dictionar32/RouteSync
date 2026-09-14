/**
 * grammar.ts
 *
 * Strongly-typed AST Grammar Definitions for php-parser output nodes.
 * Zero `any`, zero naked `Record`.
 *
 * @module cli/parsers/php/ast
 */

export interface GrammarPosition { readonly line: number; readonly column: number; readonly offset: number; }
export interface GrammarLocation { readonly source: string | null; readonly start: GrammarPosition; readonly end: GrammarPosition; }
export interface BaseGrammarNode<K extends string = string> { readonly kind: K; readonly loc?: GrammarLocation; }

// Identifier & Literal Grammar Nodes
export interface GrammarIdentifier extends BaseGrammarNode<'identifier'> { readonly name: string; }
export interface GrammarName extends BaseGrammarNode<'name'> { readonly name: string; }
export interface GrammarVariable extends BaseGrammarNode<'variable'> { readonly name: string; }
export interface GrammarString extends BaseGrammarNode<'string'> { readonly value: string; }
export interface GrammarNumber extends BaseGrammarNode<'number'> { readonly value: string | number; }
export interface GrammarBoolean extends BaseGrammarNode<'boolean'> { readonly value: boolean; }
export interface GrammarNull extends BaseGrammarNode<'nullkeyword'> {}
export interface GrammarEncapsed extends BaseGrammarNode<'encapsed'> {}
export interface GrammarSelfRef extends BaseGrammarNode<'selfreference'> { readonly raw: string; }
export interface GrammarStaticRef extends BaseGrammarNode<'staticreference'> { readonly raw: string; }

// Access Grammar Nodes
export interface GrammarPropertyLookup extends BaseGrammarNode<'propertylookup'> { readonly what: PhpGrammarNode; readonly offset?: PhpGrammarNode; }
export interface GrammarNullsafeLookup extends BaseGrammarNode<'nullsafepropertylookup'> { readonly what: PhpGrammarNode; readonly offset?: PhpGrammarNode; }
export interface GrammarOffsetLookup extends BaseGrammarNode<'offsetlookup'> { readonly what: PhpGrammarNode; readonly offset?: PhpGrammarNode; }
export interface GrammarStaticLookup extends BaseGrammarNode<'staticlookup'> { readonly what: PhpGrammarNode; readonly offset?: PhpGrammarNode; }

// Invocations & Containers
export interface GrammarCall extends BaseGrammarNode<'call'> { readonly what: PhpGrammarNode; readonly arguments?: readonly PhpGrammarNode[]; }
export interface GrammarNew extends BaseGrammarNode<'new'> { readonly what: PhpGrammarNode; readonly arguments?: readonly PhpGrammarNode[]; }
export interface GrammarClosure extends BaseGrammarNode<'closure'> { readonly body?: { readonly children?: readonly PhpGrammarNode[] }; }
export interface GrammarArrowFunc extends BaseGrammarNode<'arrowfunc'> { readonly body: PhpGrammarNode; }
export interface GrammarArrayEntry extends BaseGrammarNode<'entry'> { readonly key: PhpGrammarNode | null; readonly value: PhpGrammarNode; }
export interface GrammarArray extends BaseGrammarNode<'array'> { readonly items?: readonly GrammarArrayEntry[]; }

// Computations
export interface GrammarBin extends BaseGrammarNode<'bin'> { readonly type: string; readonly left: PhpGrammarNode; readonly right: PhpGrammarNode; }
export interface GrammarUnary extends BaseGrammarNode<'unary'> { readonly type: string; readonly what: PhpGrammarNode; }
export interface GrammarCast extends BaseGrammarNode<'cast'> { readonly type: string; readonly expr: PhpGrammarNode; }
export interface GrammarRetif extends BaseGrammarNode<'retif'> { readonly test: PhpGrammarNode; readonly trueExpr: PhpGrammarNode; readonly falseExpr: PhpGrammarNode; }
export interface GrammarUnknown extends BaseGrammarNode<'unknown'> {}

export type PhpGrammarNode =
    | GrammarIdentifier | GrammarName | GrammarVariable | GrammarString | GrammarNumber
    | GrammarBoolean | GrammarNull | GrammarEncapsed | GrammarSelfRef | GrammarStaticRef
    | GrammarPropertyLookup | GrammarNullsafeLookup | GrammarOffsetLookup | GrammarStaticLookup
    | GrammarCall | GrammarNew | GrammarClosure | GrammarArrowFunc | GrammarArray | GrammarArrayEntry
    | GrammarBin | GrammarUnary | GrammarCast | GrammarRetif | GrammarUnknown;
