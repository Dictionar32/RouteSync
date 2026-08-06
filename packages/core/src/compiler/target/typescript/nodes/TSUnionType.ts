/**
 * @file TSUnionType.ts
 * @description TypeScript union type node (A | B | C)
 * 
 * Represents union types dalam TypeScript AST.
 * Example: string | number, User | null, Response<T> | Error
 * 
 * SKELETON ONLY - NO IMPLEMENTATION LOGIC YET
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Union type node
 * 
 * @example
 * ```typescript
 * // string | number
 * new TSUnionType([
 *   TSTypeReference.string(),
 *   TSTypeReference.number()
 * ])
 * 
 * // User | null
 * new TSUnionType([
 *   new TSTypeReference('User'),
 *   TSTypeReference.null()
 * ])
 * 
 * // Response<T> | Error
 * new TSUnionType([
 *   new TSTypeReference('Response', [new TSTypeReference('T')]),
 *   new TSTypeReference('Error')
 * ])
 * ```
 */
export class TSUnionType implements TSNode, TSTypeNode {
    public readonly kind: TSNodeKind = 'union-type' as const;

    /**
     * Creates a union type
     * 
     * @param types - Array of type nodes yang akan di-union
     * @param span - Optional source location
     * 
     * @throws {Error} If types array is empty
     * @throws {Error} If types array has only one element (use that type directly)
     */
    constructor(
        public readonly types: readonly TSTypeNode[],
        public readonly span?: SourceSpan
    ) {
        // Validation akan di-implement nanti
        // For now: skeleton only
        Object.freeze(this);
    }

    /**
     * Add another type to union
     * Returns new TSUnionType instance (immutable)
     * 
     * @example
     * ```typescript
     * // string | number
     * const union = new TSUnionType([TSTypeReference.string()]);
     * 
     * // string | number | boolean
     * const extended = union.addType(TSTypeReference.number());
     * ```
     */
    public addType(type: TSTypeNode): TSUnionType {
        return new TSUnionType(
            [...this.types, type],
            this.span
        );
    }

    /**
     * Flatten nested unions
     * 
     * @example
     * ```typescript
     * // (A | B) | C → A | B | C
     * const nested = new TSUnionType([
     *   new TSUnionType([typeA, typeB]),
     *   typeC
     * ]);
     * 
     * const flattened = nested.flatten();
     * // Returns: TSUnionType([typeA, typeB, typeC])
     * ```
     */
    public flatten(): TSUnionType {
        // Implementation nanti
        // For now: return this
        return this;
    }

    /**
     * Check if union includes specific type
     * 
     * @param typeName - Type name to check
     * @returns true if union includes the type
     */
    public includes(typeName: string): boolean {
        // Implementation nanti
        return false;
    }

    /**
     * Factory: Create optional type (T | null | undefined)
     */
    public static optional(type: TSTypeNode): TSUnionType {
        // Implementation nanti
        // Should create: T | null | undefined
        return new TSUnionType([type]);
    }

    /**
     * Factory: Create nullable type (T | null)
     */
    public static nullable(type: TSTypeNode): TSUnionType {
        // Implementation nanti
        // Should create: T | null
        return new TSUnionType([type]);
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitUnionType(this);
    }
}
