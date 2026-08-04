/**
 * @file TSArrayType.ts
 * @description TypeScript array type node
 * 
 * Represents array types dalam TypeScript AST.
 * Example: string[], User[], Array<T>
 */

import type { TSNode, SourceSpan } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Array type node
 * 
 * @example
 * ```typescript
 * // string[]
 * new TSArrayType(TSTypeReference.string())
 * 
 * // User[]
 * new TSArrayType(new TSTypeReference('User'))
 * 
 * // Array<number>
 * new TSArrayType(TSTypeReference.number())
 * ```
 */
export class TSArrayType implements TSNode, TSTypeNode {
    public readonly kind = 'array-type' as const;

    constructor(
        public readonly elementType: TSTypeNode,
        public readonly span?: SourceSpan
    ) {
        Object.freeze(this);
    }

    /**
     * Create array of arrays (2D array)
     * 
     * @example
     * ```typescript
     * // string[][]
     * TSArrayType.string().toArray()
     * ```
     */
    public toArray(): TSArrayType {
        return new TSArrayType(this, this.span);
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitArrayType(this);
    }
}

