/**
 * @module compiler/types/TypeSystem
 * @description Core type system operations (join, meet, subtyping, assignability)
 * 
 * Implements the semantic type system with:
 * - Type lattice operations (join/meet)
 * - Subtyping with variance
 * - Assignability checking
 * - Structural type compatibility
 */

import {
    SemanticType,
    PrimitiveKind,
    UnionType,
    NeverType
} from './SemanticType';
import { TypeHasher, HashContext } from './TypeHasher';
import { TypeHierarchy } from './TypeHierarchy';

/**
 * Type system with lattice operations and subtyping.
 * 
 * Provides core type-theoretic operations:
 * - join: Least upper bound (union type)
 * - meet: Greatest lower bound (intersection, or never)
 * - isSubtype: Subtyping relation with variance
 * - isAssignable: Assignability (subtype or union member)
 * 
 * @example
 * ```typescript
 * const typeSystem = new TypeSystem(modelHierarchy);
 * 
 * const stringType = new PrimitiveType(PrimitiveKind.STRING);
 * const numberType = new PrimitiveType(PrimitiveKind.NUMBER);
 * 
 * // Join creates union type
 * const unionType = typeSystem.join(stringType, numberType);
 * // unionType: string | number
 * 
 * // Subtyping check
 * const isSubtype = typeSystem.isSubtype(adminType, userType);
 * ```
 */
export class TypeSystem {
    constructor(private readonly hierarchy: TypeHierarchy) { }

    /**
     * Compute the join (least upper bound) of two types.
     * 
     * The join is the smallest type that is a supertype of both inputs.
     * For most type pairs, this produces a union type.
     * 
     * Special cases:
     * - join(T, T) = T (idempotent)
     * - join(never, T) = T (never is bottom)
     * - join(T, U) = T | U (general case)
     * 
     * @param a - First type
     * @param b - Second type
     * @returns Least upper bound type
     */
    public join(a: SemanticType, b: SemanticType): SemanticType {
        const ctx: HashContext = {
             activeStack: [],
             finalized: new WeakMap()
        };

        // Structural equality
        if (TypeHasher.hash(a, ctx) === TypeHasher.hash(b, ctx)) {
            return a;
        }

        // never is bottom type
        if (a.kind === 'never') return b;
        if (b.kind === 'never') return a;

        // General case: create union
        return UnionType.of(a, b);
    }

    /**
     * Compute the meet (greatest lower bound) of two types.
     * 
     * The meet is the largest type that is a subtype of both inputs.
     * For most type pairs, this is never (empty intersection).
     * 
     * Special cases:
     * - meet(T, T) = T (idempotent)
     * - meet(T, U) = never (if not compatible)
     * 
     * @param a - First type
     * @param b - Second type
     * @returns Greatest lower bound type
     */
    public meet(a: SemanticType, b: SemanticType): SemanticType {
        const ctx: HashContext = {
             activeStack: [],
             finalized: new WeakMap()
        };

        // Structural equality
        if (TypeHasher.hash(a, ctx) === TypeHasher.hash(b, ctx)) {
            return a;
        }

        // Most type pairs have empty meet
        return new NeverType();
    }

    /**
     * Check if source is a subtype of target.
     * 
     * Implements the subtyping relation with variance support:
     * - Primitives: exact match required
     * - References: follows hierarchy chain
     * - Collections: covariant (readonly) or invariant (mutable)
     * - Generics: respects variance annotations
     * - Unions: distributive (all members must be subtypes)
     * 
     * @param source - Source type
     * @param target - Target type
     * @returns true if source <: target
     */
    public isSubtype(source: SemanticType, target: SemanticType): boolean {
        const ctx: HashContext = {
             activeStack: [],
             finalized: new WeakMap()
        };

        // unknown is top type - everything is subtype of unknown
        if (target.kind === 'primitive' && target.type === PrimitiveKind.UNKNOWN) {
            return true;
        }

        // Union source: all members must be subtypes
        if (source.kind === 'union') {
            return Array.from(
                source.members.values()).every(
                member => this.isAssignable(member, target)
            );
        }

        // Primitive subtyping
        if (source.kind === 'primitive' && target.kind === 'primitive') {
            return source.type === target.type;
        }

        // Reference subtyping via hierarchy
        if (source.kind === 'reference' && target.kind === 'reference') {
            const visited = new Set<string>();
            let current: SemanticType | undefined = source;

            while (current) {
                const id = current.kind === 'reference'
                    ? `${current.namespace}\\${current.name}`
                    : '';

                // Cycle detection
                if (visited.has(id)) {
                    return false;
                }
                visited.add(id);

                // Check for match
                if (current.kind === 'reference' &&
                    current.name === target.name &&
                    current.namespace === target.namespace) {
                    return true;
                }

                // Walk up hierarchy
                current = this.hierarchy.getParent(current);
            }

            return false;
        }

        // Readonly collection subtyping (covariant)
        if (source.kind === 'readonly_collection' && target.kind === 'readonly_collection') {
            return this.isSubtype(source.elementType, target.elementType);
        }

        // Mutable collection subtyping (invariant)
        if (source.kind === 'mutable_collection' && target.kind === 'mutable_collection') {
            return TypeHasher.hash(source.elementType, ctx) ===
                TypeHasher.hash(target.elementType, ctx);
        }

        // Generic subtyping with variance
        if (source.kind === 'generic' && target.kind === 'generic') {
            // Base types must match
            if (!this.isSubtype(source.base, target.base)) {
                return false;
            }

            // Check each parameter with variance
            for (let i = 0; i < source.parameters.length; i++) {
                const s = source.parameters[i]!;
                const t = target.parameters[i]!;

                if (s.variance === 'covariant') {
                    // Producer: subtyping preserved
                    if (!this.isSubtype(s.type, t.type)) return false;
                } else if (s.variance === 'contravariant') {
                    // Consumer: subtyping reversed
                    if (!this.isSubtype(t.type, s.type)) return false;
                } else if (s.variance === 'invariant') {
                    // Exact match required
                    if (TypeHasher.hash(s.type, ctx) !== TypeHasher.hash(t.type, ctx)) {
                        return false;
                    }
                }
            }

            return true;
        }

        return false;
    }

    /**
     * Check if source is assignable to target.
     * 
     * Assignability is more lenient than subtyping:
     * - Includes all subtyping relationships
     * - Additionally allows assignment to union member types
     * 
     * @param source - Source type
     * @param target - Target type
     * @returns true if source can be assigned to target
     */
    public isAssignable(source: SemanticType, target: SemanticType): boolean {
        // Subtyping implies assignability
        if (this.isSubtype(source, target)) {
            return true;
        }

        // Union target: check if assignable to any member
        if (target.kind === 'union') {
            return Array.from(
                target.members.values()).some(
                member => this.isAssignable(source, member)
            );
        }

        return false;
    }
}
