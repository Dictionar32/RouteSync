/**
 * @file TSIntersectionType.ts
 * @description TypeScript intersection type node (A & B & C)
 * 
 * Represents intersection types dalam TypeScript AST.
 * Example: User & Timestamps, Base & Extended, Readonly<T> & Required<U>
 * 
 * SKELETON ONLY - NO IMPLEMENTATION LOGIC YET
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Intersection type node
 * 
 * Intersection type menggabungkan multiple types menjadi satu type
 * yang memiliki semua properties dari semua types.
 * 
 * @example
 * ```typescript
 * // User & Timestamps
 * new TSIntersectionType([
 *   new TSTypeReference('User'),
 *   new TSTypeReference('Timestamps')
 * ])
 * 
 * // Base & { id: number }
 * new TSIntersectionType([
 *   new TSTypeReference('Base'),
 *   new TSTypeLiteral([
 *     new TSPropertySignature('id', TSTypeReference.number())
 *   ])
 * ])
 * ```
 */
export class TSIntersectionType implements TSNode, TSTypeNode {
    public readonly kind: TSNodeKind = 'intersection-type' as const;

    /**
     * Creates an intersection type
     * 
     * @param types - Array of type nodes yang akan di-intersect
     * @param span - Optional source location
     * 
     * @throws {Error} If types array is empty
     * @throws {Error} If types array has only one element
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
     * Add another type to intersection
     * Returns new TSIntersectionType instance (immutable)
     * 
     * @example
     * ```typescript
     * // User & Timestamps
     * const intersection = new TSIntersectionType([
     *   new TSTypeReference('User')
     * ]);
     * 
     * // User & Timestamps & Auditable
     * const extended = intersection.addType(
     *   new TSTypeReference('Timestamps')
     * );
     * ```
     */
    public addType(type: TSTypeNode): TSIntersectionType {
        return new TSIntersectionType(
            [...this.types, type],
            this.span
        );
    }

    /**
     * Flatten nested intersections
     * 
     * @example
     * ```typescript
     * // (A & B) & C → A & B & C
     * const nested = new TSIntersectionType([
     *   new TSIntersectionType([typeA, typeB]),
     *   typeC
     * ]);
     * 
     * const flattened = nested.flatten();
     * // Returns: TSIntersectionType([typeA, typeB, typeC])
     * ```
     */
    public flatten(): TSIntersectionType {
        // Implementation nanti
        // For now: return this
        return this;
    }

    /**
     * Check if intersection includes specific type
     * 
     * @param typeName - Type name to check
     * @returns true if intersection includes the type
     */
    public includes(typeName: string): boolean {
        // Implementation nanti
        return false;
    }

    /**
     * Factory: Create readonly intersection (Readonly<T> & U)
     */
    public static readonly(baseType: TSTypeNode): TSIntersectionType {
        // Implementation nanti
        // Should wrap baseType dengan Readonly<>
        return new TSIntersectionType([baseType]);
    }

    /**
     * Factory: Create required intersection (Required<T> & U)
     */
    public static required(baseType: TSTypeNode): TSIntersectionType {
        // Implementation nanti
        // Should wrap baseType dengan Required<>
        return new TSIntersectionType([baseType]);
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitIntersectionType(this);
    }
}
