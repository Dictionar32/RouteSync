/**
 * symbolTypes.ts
 *
 * Domain types for program symbol analysis.
 *
 * @module compiler/analysis/symbol
 */

export interface SymbolNode {
    /** Unique symbol identifier */
    readonly id: string;

    /** Symbol kind */
    readonly kind: 'class' | 'method' | 'property';

    /** Symbol name */
    readonly name: string;

    /** Namespace atau package name */
    readonly namespace: string;

    /** Parent symbol ID (untuk nested symbols) */
    readonly parentId?: string;

    /** Extended class symbol ID */
    readonly extendsId?: string;

    /** Implemented interface symbol IDs */
    readonly implementsIds: readonly string[];
}

export interface SymbolStats {
    readonly totalSymbols: number;
    readonly classes: number;
    readonly methods: number;
    readonly properties: number;
    readonly totalReferences: number;
}
