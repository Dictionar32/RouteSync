/**
 * @module compiler/types/TypeHasher
 * @description Type hashing with cycle detection for semantic types
 * 
 * Provides deterministic hash computation for semantic types, handling:
 * - Recursive types (via cycle detection)
 * - Structural equality
 * - Canonical ordering for sets/unions
 */

import { SemanticType, PrimitiveKind } from './SemanticType';

/**
 * Hash context for tracking visited types during hash computation.
 * Prevents infinite recursion in cyclic type structures.
 */
export interface HashContext {
    readonly activeStack: SemanticType[];
    readonly finalized: WeakMap<SemanticType, string>;
}

/**
 * Type hasher with cycle detection.
 * Computes stable, deterministic hashes for semantic types.
 * 
 * @example
 * ```typescript
 * const ctx: HashContext = { 
 *   activeStack: [], 
 *   finalized: new WeakMap() 
 * };
 * const hash = TypeHasher.hash(myType, ctx);
 * ```
 */
export class TypeHasher {
    /**
     * Compute hash for a semantic type with cycle detection.
     * 
     * Uses cycle detection to handle recursive type references:
     * - Maintains an active stack of types being hashed
     * - When a cycle is detected, generates a backreference marker
     * - Caches finalized hashes in WeakMap
     * 
     * @param type - Type to hash
     * @param context - Hash context with cycle tracking
     * @returns Deterministic hash string
     */
    public static hash(type: SemanticType, context: HashContext): string {
        // Check if already finalized
        const final = context.finalized.get(type);
        if (final) return final;

        // Cycle detection - check if type is in active stack
        const index = context.activeStack.indexOf(type);
        if (index !== -1) {
            const distance = context.activeStack.length - index;
            return `ref^${distance}`; // Backreference marker
        }

        // Push to stack, compute hash, then pop
        context.activeStack.push(type);
        const baseHash = this.computeHash(type, context);
        context.activeStack.pop();

        // Cache the result
        context.finalized.set(type, baseHash);
        return baseHash;
    }

    /**
     * Internal hash computation without cycle check.
     * Called after cycle detection passes.
     */
    private static computeHash(type: SemanticType, context: HashContext): string {
        switch (type.kind) {
            case 'primitive':
                return `primitive:${type.type}`;

            case 'never':
                return 'never';

            case 'error':
                return `error:${type.diagnosticMessage}`;

            case 'reference':
                return `reference:${type.namespace}\\${type.name}`;

            case 'readonly_collection':
                return `readonly_collection:${type.collectionKind}<${this.hash(type.elementType, context)}>`;

            case 'mutable_collection':
                return `mutable_collection:${type.collectionKind}<${this.hash(type.elementType, context)}>`;

            case 'generic': {
                const paramHashes = type.parameters.map(
                    p => `${p.name}[${p.variance}]:${this.hash(p.type, context)}`
                );
                return `generic:${this.hash(type.base, context)}<${paramHashes.join(',')}>`;
            }

            case 'union': {
                // Sort for canonical ordering
                const hashes = Array.from(type.members.values())
                    .map(m => this.hash(m, context))
                    .sort();
                return `union[${hashes.join(',')}]`;
            }

            case 'intersection': {
                // Sort for canonical ordering
                const interHashes = Array.from(type.members.values())
                    .map(m => this.hash(m, context))
                    .sort();
                return `intersection[${interHashes.join(',')}]`;
            }

            case 'object': {
                // Hash all object components
                const propHashes = Array.from(type.properties.entries())
                    .map(([k, v]) => `${k}:${this.hash(v, context)}`)
                    .sort();

                const baseHash = type.baseObject
                    ? this.hash(type.baseObject, context)
                    : 'none';

                const interfaceHash = type.interfaces
                    ? type.interfaces.map(i => this.hash(i, context)).sort().join(',')
                    : 'none';

                const requiredHash = Array.from(type.requiredProperties.values())
                    .sort()
                    .join(',');

                const annoHash = type.annotations
                    ? Array.from(type.annotations.entries())
                        .map(([k, v]) => `${k}=${v}`)
                        .sort()
                        .join(',')
                    : 'none';

                return `object{props:${propHashes.join(',')};req:${requiredHash};base:${baseHash};iface:${interfaceHash};ann:${annoHash}}`;
            }
        }
    }
}
