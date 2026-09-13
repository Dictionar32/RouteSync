/**
 * subtypingChecker.ts
 *
 * Implements subtyping relation with variance, references, collections, and generics.
 *
 * @module compiler/types/system
 */

import {
    SemanticType,
    PrimitiveKind
} from '../SemanticType';
import { TypeHasher, HashContext } from '../TypeHasher';
import type { TypeHierarchy } from '../TypeHierarchy';

export function checkSubtype(
    source: SemanticType,
    target: SemanticType,
    hierarchy: TypeHierarchy,
    isAssignable: (s: SemanticType, t: SemanticType) => boolean
): boolean {
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
        return Array.from(source.members.values()).every(
            member => isAssignable(member, target)
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
            current = hierarchy.getParent(current);
        }

        return false;
    }

    // Readonly collection subtyping (covariant)
    if (source.kind === 'readonly_collection' && target.kind === 'readonly_collection') {
        return checkSubtype(source.elementType, target.elementType, hierarchy, isAssignable);
    }

    // Mutable collection subtyping (invariant)
    if (source.kind === 'mutable_collection' && target.kind === 'mutable_collection') {
        return TypeHasher.hash(source.elementType, ctx) ===
            TypeHasher.hash(target.elementType, ctx);
    }

    // Generic subtyping with variance
    if (source.kind === 'generic' && target.kind === 'generic') {
        // Base types must match
        if (!checkSubtype(source.base, target.base, hierarchy, isAssignable)) {
            return false;
        }

        // Check each parameter with variance
        for (let i = 0; i < source.parameters.length; i++) {
            const s = source.parameters[i]!;
            const t = target.parameters[i]!;

            if (s.variance === 'covariant') {
                if (!checkSubtype(s.type, t.type, hierarchy, isAssignable)) return false;
            } else if (s.variance === 'contravariant') {
                if (!checkSubtype(t.type, s.type, hierarchy, isAssignable)) return false;
            } else if (s.variance === 'invariant') {
                if (TypeHasher.hash(s.type, ctx) !== TypeHasher.hash(t.type, ctx)) {
                    return false;
                }
            }
        }

        return true;
    }

    return false;
}
