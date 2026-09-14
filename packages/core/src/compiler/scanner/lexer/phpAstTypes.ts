/**
 * phpAstTypes.ts
 *
 * Micro-AST shapes, token types, and branded nominal atoms for PHP source code.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/compiler/scanner/lexer/phpAstTypes
 */

export type SourceOffset = number & { readonly __brand: unique symbol };
export type SourceLineNumber = number & { readonly __brand: unique symbol };
export type AstIdentifier = string & { readonly __brand: unique symbol };

export const createSourceOffset = (offset: number): SourceOffset => Math.max(0, offset) as SourceOffset;
export const createSourceLineNumber = (line: number): SourceLineNumber => Math.max(1, line) as SourceLineNumber;
export const createAstIdentifier = (id: string): AstIdentifier => id as AstIdentifier;

export type TokenType =
    | 'STRING'
    | 'NUMBER'
    | 'TRUE'
    | 'FALSE'
    | 'NULL'
    | 'IDENTIFIER'
    | 'VARIABLE'
    | 'ARROW'
    | 'DOUBLE_COLON'
    | 'OBJECT_OPERATOR'
    | 'NULLSAFE_OPERATOR'
    | 'PUNCTUATION'
    | 'EOF';

export interface TokenDescriptor {
    readonly type: TokenType;
    readonly value: string;
    readonly line: number;
    readonly startOffset: number;
    readonly endOffset: number;
}

export type PhpLiteralValue =
    | { readonly kind: 'literal'; readonly literalType: 'string'; readonly value: string }
    | { readonly kind: 'literal'; readonly literalType: 'number'; readonly value: number }
    | { readonly kind: 'literal'; readonly literalType: 'boolean'; readonly value: boolean }
    | { readonly kind: 'literal'; readonly literalType: 'null'; readonly value: null };

export type PhpAstValue =
    | PhpLiteralValue
    | { readonly kind: 'resource_single'; readonly resourceName: string; readonly argument: string }
    | { readonly kind: 'resource_collection'; readonly resourceName: string; readonly argument: string }
    | { readonly kind: 'method_chain'; readonly target: string; readonly property: string; readonly nullsafe: boolean }
    | { readonly kind: 'property_access'; readonly target: string; readonly property: string; readonly nullsafe: boolean }
    | { readonly kind: 'variable_reference'; readonly name: string }
    | { readonly kind: 'ternary_expression'; readonly condition: string; readonly trueBranch: PhpAstValue; readonly falseBranch: PhpAstValue }
    | { readonly kind: 'nested_array'; readonly entries: readonly PhpArrayEntry[] }
    | { readonly kind: 'raw_expression'; readonly raw: string };

export interface PhpArrayEntry {
    readonly key: string;
    readonly value: PhpAstValue;
    readonly rawExpression: string;
}

export interface ParsedPhpArrayResult {
    readonly entries: readonly PhpArrayEntry[];
    readonly endIndex: number;
}
