/** Closed lexical vocabulary for the Laravel scanner. */
export type SourceOffset = number & { readonly __brand: unique symbol };
export type SourceLineNumber = number & { readonly __brand: unique symbol };
export type AstIdentifier = string & { readonly __brand: unique symbol };
export type SourceRange = { readonly startOffset: SourceOffset; readonly endOffset: SourceOffset };

export const createSourceOffset = (value: number): SourceOffset => Math.max(0, value) as SourceOffset;
export const createSourceLineNumber = (value: number): SourceLineNumber => Math.max(1, value) as SourceLineNumber;
export const createAstIdentifier = (value: string): AstIdentifier => {
    if (!value) throw new Error('AST identifier cannot be empty');
    return value as AstIdentifier;
};

export type TokenType =
    | 'STRING' | 'NUMBER' | 'TRUE' | 'FALSE' | 'NULL' | 'IDENTIFIER' | 'VARIABLE'
    | 'ARROW' | 'DOUBLE_COLON' | 'OBJECT_OPERATOR' | 'NULLSAFE_OPERATOR'
    | 'QUESTION' | 'COLON' | 'ASSIGN' | 'EQUAL' | 'IDENTICAL' | 'NOT_EQUAL' | 'NOT_IDENTICAL'
    | 'NULL_COALESCE' | 'SHORT_TERNARY' | 'NULL_COALESCE_ASSIGN'
    | 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_OR_EQUAL' | 'LESS_OR_EQUAL'
    | 'PLUS' | 'MINUS' | 'MULTIPLY' | 'DIVIDE' | 'MODULO' | 'LOGICAL_AND' | 'LOGICAL_OR'
    | 'NOT' | 'BITWISE_NOT' | 'CONCAT' | 'ELLIPSIS' | 'PUNCTUATION' | 'EOF';

export interface TokenDescriptor {
    readonly type: TokenType;
    readonly value: string;
    readonly line: SourceLineNumber;
    readonly startOffset: SourceOffset;
    readonly endOffset: SourceOffset;
}
