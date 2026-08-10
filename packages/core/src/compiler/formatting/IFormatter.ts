/**
 * @file IFormatter.ts
 * @description Interface contracts untuk Formatter layer
 * 
 * Formatter layer bertanggung jawab optimize dan reorganize Target AST structure.
 * Formatter bekerja pada AST (BUKAN strings), dan return AST baru yang telah dioptimize.
 */

import type { ITargetNode } from '../target/ITargetNode';

/**
 * Base interface untuk formatters yang work pada AST
 * 
 * Generic parameter T adalah type dari AST node yang akan diformat.
 * 
 * CRITICAL: Formatter MUST:
 * - Work on AST (not strings)
 * - Return new AST (immutable transformation)
 * - Be pure functions (no side effects)
 * - Preserve semantics (tidak mengubah meaning)
 * 
 * @example
 * ```typescript
 * class TypeScriptFormatter implements IFormatter<TSFile> {
 *   format(node: TSFile): TSFile {
 *     // Sort imports, reorder declarations
 *     return new TSFile(sortedImports, reorderedDeclarations, node.exports);
 *   }
 * }
 * ```
 */
export interface IFormatter<T extends ITargetNode> {
    /**
     * Format AST node, return new formatted AST
     * 
     * REQUIREMENTS:
     * - Input node TIDAK dimodify (immutable)
     * - Return new node dengan formatting applied
     * - Preserve semantic meaning
     * - Type-safe (no any types)
     * 
     * @param node - AST node to format
     * @returns New formatted AST node (Promise untuk async compatibility)
     * @throws FormatterError jika formatting fails
     */
    format(node: T): T | Promise<T>;
}

/**
 * Formatter configuration options
 */
export interface FormatterConfig {
    /** Enable/disable specific formatting rules */
    readonly rules?: Readonly<{
        readonly sortImports?: boolean;
        readonly groupImports?: boolean;
        readonly reorderDeclarations?: boolean;
        readonly removeUnusedImports?: boolean;
    }>;

    /** Import sorting strategy */
    readonly importSorting?: 'alphabetical' | 'grouped' | 'none';

    /** Declaration ordering strategy */
    readonly declarationOrdering?: 'type-first' | 'alphabetical' | 'none';
}

/**
 * Formatter error untuk type-safe error handling
 */
export class FormatterError extends Error {
    constructor(
        message: string,
        public readonly cause?: Error,
        public readonly context?: Readonly<Record<string, unknown>>
    ) {
        super(message);
        this.name = 'FormatterError';
        Object.freeze(this);
    }
}

/**
 * Result type untuk formatting operations
 */
export interface FormattingResult<T extends ITargetNode> {
    /** Formatted AST node */
    readonly node: T;

    /** Changes applied during formatting */
    readonly changes: readonly FormattingChange[];

    /** Metadata about formatting process */
    readonly metadata: Readonly<Record<string, unknown>>;
}

/**
 * Individual formatting change (untuk reporting)
 */
export interface FormattingChange {
    readonly type: 'import-sorted' | 'declaration-reordered' | 'import-grouped' | 'import-removed';
    readonly description: string;
    readonly location?: Readonly<{
        readonly line: number;
        readonly column: number;
    }>;
}

/**
 * Composable formatter untuk chaining multiple formatters
 */
export interface IComposableFormatter<T extends ITargetNode> extends IFormatter<T> {
    /**
     * Compose dengan formatter lain
     * 
     * @param next - Next formatter dalam chain
     * @returns New formatter yang apply both transformations
     */
    compose(next: IFormatter<T>): IComposableFormatter<T>;
}

