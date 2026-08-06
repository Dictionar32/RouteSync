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
 * Mendukung readonly distinction:
 * - readonly=true → readonly T[] atau ReadonlyArray<T>
 * - readonly=false → T[] atau Array<T>
 * 
 * @example
 * ```typescript
 * // string[] (mutable)
 * new TSArrayType(TSTypeReference.string(), false)
 * 
 * // readonly User[] (immutable)
 * new TSArrayType(new TSTypeReference('User'), true)
 * 
 * // ReadonlyArray<number>
 * new TSArrayType(TSTypeReference.number(), true)
 * ```
 */
export class TSArrayType implements TSNode, TSTypeNode {
    public readonly kind = 'array-type' as const;

    constructor(
        public readonly elementType: TSTypeNode,
        public readonly readonly: boolean = false,
        public readonly span?: SourceSpan
    ) {
        Object.freeze(this);
    }

    /**
     * Create array of arrays (2D array)
     * Preserves readonly modifier pada outer array.
     * 
     * @example
     * ```typescript
     * // readonly string[][]
     * new TSArrayType(TSTypeReference.string(), true).toArray()
     * 
     * // string[][] (mutable)
     * new TSArrayType(TSTypeReference.string(), false).toArray()
     * ```
     */
    public toArray(): TSArrayType {
        return new TSArrayType(this, this.readonly, this.span);
    }

    /**
     * Create readonly variant dari array ini
     * 
     * @example
     * ```typescript
     * // Convert mutable to readonly
     * const mutable = new TSArrayType(TSTypeReference.string(), false);
     * const readonly = mutable.toReadonly(); // readonly string[]
     * ```
     */
    public toReadonly(): TSArrayType {
        return new TSArrayType(this.elementType, true, this.span);
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitArrayType(this);
    }
}

