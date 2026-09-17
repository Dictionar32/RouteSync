/** Syntax-level PHP AST vocabulary used by the Laravel scanner. */
export type SourceOffset = number & { readonly __brand: unique symbol };
export type SourceLineNumber = number & { readonly __brand: unique symbol };
export type AstIdentifier = string & { readonly __brand: unique symbol };

export const createSourceOffset = (offset: number): SourceOffset => Math.max(0, offset) as SourceOffset;
export const createSourceLineNumber = (line: number): SourceLineNumber => Math.max(1, line) as SourceLineNumber;
export const createAstIdentifier = (id: string): AstIdentifier => {
    if (id.length === 0) throw new Error('AST identifier cannot be empty');
    return id as AstIdentifier;
};

export type TokenType =
    | 'STRING' | 'NUMBER' | 'TRUE' | 'FALSE' | 'NULL' | 'IDENTIFIER' | 'VARIABLE'
    | 'ARROW' | 'DOUBLE_COLON' | 'OBJECT_OPERATOR' | 'NULLSAFE_OPERATOR' | 'PUNCTUATION' | 'EOF';

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

export interface PhpPropertyPath {
    readonly root: AstIdentifier;
    readonly steps: readonly AstIdentifier[];
}

export type PhpArgument =
    | { readonly kind: 'positional'; readonly value: PhpAstValue }
    | { readonly kind: 'named'; readonly name: AstIdentifier; readonly value: PhpAstValue }
    | { readonly kind: 'unpacked'; readonly value: PhpAstValue };

export interface PhpParameter { readonly variable: AstIdentifier; }
export type PhpClosureCapture =
    | { readonly kind: 'by_value'; readonly variable: AstIdentifier }
    | { readonly kind: 'by_reference'; readonly variable: AstIdentifier };

export interface PhpStatement {
    readonly kind: 'expression_statement' | 'return_statement';
    readonly expression?: PhpAstValue;
}
export interface PhpBlock {
    readonly kind: 'block';
    readonly statements: readonly PhpStatement[];
}

export type PhpAstValue =
    | PhpLiteralValue
    | { readonly kind: 'resource_single'; readonly resourceName: AstIdentifier; readonly argument: PhpAstValue }
    | { readonly kind: 'resource_collection'; readonly resourceName: AstIdentifier; readonly argument: PhpAstValue }
    | { readonly kind: 'method_chain'; readonly target: PhpPropertyPath; readonly receiver: PhpAstValue; readonly property: AstIdentifier; readonly arguments: readonly PhpAstValue[]; readonly argumentDescriptors: readonly PhpArgument[]; readonly nullsafe: boolean }
    | { readonly kind: 'property_access'; readonly target: PhpPropertyPath; readonly receiver: PhpAstValue; readonly property: AstIdentifier; readonly nullsafe: boolean }
    | { readonly kind: 'variable_reference'; readonly name: AstIdentifier }
    | { readonly kind: 'ternary_expression'; readonly condition: PhpAstValue; readonly trueBranch: PhpAstValue; readonly falseBranch: PhpAstValue }
    | { readonly kind: 'nested_array'; readonly entries: readonly PhpArrayEntry[] }
    | { readonly kind: 'static_call'; readonly className: AstIdentifier; readonly method: AstIdentifier; readonly arguments: readonly PhpAstValue[]; readonly argumentDescriptors: readonly PhpArgument[] }
    | { readonly kind: 'class_reference'; readonly className: AstIdentifier }
    | { readonly kind: 'closure'; readonly parameters: readonly PhpParameter[]; readonly captures: readonly PhpClosureCapture[]; readonly body: PhpBlock }
    | { readonly kind: 'arrow_function'; readonly parameters: readonly PhpParameter[]; readonly body: PhpAstValue }
    | { readonly kind: 'unsupported'; readonly reason: 'unclassified_expression'; readonly tokens: readonly TokenDescriptor[] };

export interface PhpArrayEntry { readonly key: AstIdentifier; readonly value: PhpAstValue; readonly keyExpression?: PhpAstValue; }
export interface ParsedPhpArrayResult { readonly entries: readonly PhpArrayEntry[]; readonly endIndex: number; }
