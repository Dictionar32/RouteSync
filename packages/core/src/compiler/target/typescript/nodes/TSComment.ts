/**
 * @file TSComment.ts
 * @description TypeScript comment node (JSDoc, single-line, multi-line)
 * 
 * Represents comments dalam TypeScript AST.
 * Example: single-line, multi-line, JSDoc comments
 * 
 * SKELETON ONLY - NO IMPLEMENTATION LOGIC YET
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Comment style/type
 */
export type CommentStyle =
    | 'single-line'    // single-line comment
    | 'multi-line'     // multi-line comment
    | 'jsdoc';         // JSDoc comment

/**
 * Comment node
 * 
 * Represents comments yang bisa attached ke declarations atau standalone.
 * 
 * @example
 * ```typescript
 * // Single-line comment
 * new TSComment('This is a single-line comment', 'single-line')
 * 
 * // Multi-line comment
 * new TSComment(
 *   'This is a\nmulti-line\ncomment',
 *   'multi-line'
 * )
 * 
 * // JSDoc comment
 * new TSComment(
 *   '@param name - The user name\n@returns void',
 *   'jsdoc'
 * )
 * ```
 */
export class TSComment implements TSNode {
    public readonly kind: TSNodeKind = 'comment' as const;

    /**
     * Creates a comment node
     * 
     * @param text - Comment text (without delimiters)
     * @param style - Comment style (single-line, multi-line, jsdoc)
     * @param span - Optional source location
     */
    constructor(
        public readonly text: string,
        public readonly style: CommentStyle = 'single-line',
        public readonly span?: SourceSpan
    ) {
        Object.freeze(this);
    }

    /**
     * Check if comment is JSDoc
     */
    public get isJSDoc(): boolean {
        return this.style === 'jsdoc';
    }

    /**
     * Check if comment is single-line
     */
    public get isSingleLine(): boolean {
        return this.style === 'single-line';
    }

    /**
     * Check if comment is multi-line
     */
    public get isMultiLine(): boolean {
        return this.style === 'multi-line';
    }

    /**
     * Get comment lines
     */
    public get lines(): readonly string[] {
        return this.text.split('\n');
    }

    /**
     * Factory: Create single-line comment
     * 
     * @example
     * ```typescript
     * TSComment.singleLine('This is a comment')
     * ```
     */
    public static singleLine(text: string): TSComment {
        return new TSComment(text, 'single-line');
    }

    /**
     * Factory: Create multi-line comment
     * 
     * @example
     * ```typescript
     * TSComment.multiLine('This is a\nmulti-line comment')
     * ```
     */
    public static multiLine(text: string): TSComment {
        return new TSComment(text, 'multi-line');
    }

    /**
     * Factory: Create JSDoc comment
     * 
     * @example
     * ```typescript
     * TSComment.jsdoc('Get user by ID\n@param id - User ID\n@returns User object')
     * ```
     */
    public static jsdoc(text: string): TSComment {
        return new TSComment(text, 'jsdoc');
    }

    /**
     * Factory: Create JSDoc from structured data
     * 
     * @example
     * ```typescript
     * TSComment.jsdocFromParts(
     *   'Get user by ID',
     *   [
     *     { tag: 'param', name: 'id', description: 'User ID' },
     *     { tag: 'returns', description: 'User object' }
     *   ]
     * )
     * ```
     */
    public static jsdocFromParts(
        description: string,
        tags: readonly JSDocTag[] = []
    ): TSComment {
        const lines: string[] = [description];

        for (const tag of tags) {
            if (tag.name) {
                lines.push(`@${tag.tag} ${tag.name} - ${tag.description}`);
            } else {
                lines.push(`@${tag.tag} ${tag.description}`);
            }
        }

        return new TSComment(lines.join('\n'), 'jsdoc');
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitComment(this);
    }
}

/**
 * JSDoc tag representation
 */
export interface JSDocTag {
    readonly tag: string;           // e.g., 'param', 'returns', 'example'
    readonly name?: string;         // Optional name (for @param name - desc)
    readonly description: string;   // Tag description
}

/**
 * Helper: Create @param JSDoc tag
 */
export function paramTag(name: string, description: string): JSDocTag {
    return { tag: 'param', name, description };
}

/**
 * Helper: Create @returns JSDoc tag
 */
export function returnsTag(description: string): JSDocTag {
    return { tag: 'returns', description };
}

/**
 * Helper: Create @example JSDoc tag
 */
export function exampleTag(code: string): JSDocTag {
    return { tag: 'example', description: code };
}

/**
 * Helper: Create @deprecated JSDoc tag
 */
export function deprecatedTag(message: string): JSDocTag {
    return { tag: 'deprecated', description: message };
}
