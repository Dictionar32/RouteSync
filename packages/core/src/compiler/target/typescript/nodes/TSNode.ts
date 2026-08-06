// target/typescript/nodes/TSNode.ts

/**
 * Base node for all TypeScript AST nodes
 */
export interface TSNode {
    readonly kind: TSNodeKind;
    readonly span?: SourceSpan;
}

export type TSNodeKind =
    | 'file'
    | 'import-declaration'
    | 'interface-declaration'
    | 'type-alias'
    | 'type-parameter'
    | 'property-signature'
    | 'type-reference'
    | 'array-type'
    | 'union-type'
    | 'intersection-type'
    | 'method-signature'
    | 'function-declaration'
    | 'comment'
    | 'export-declaration';

/**
 * Source location information
 */
export interface SourceSpan {
    readonly start: number;
    readonly end: number;
}
