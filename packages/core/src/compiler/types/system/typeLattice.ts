/**
 * typeLattice.ts
 *
 * Join and meet lattice operations on SemanticType.
 *
 * @module compiler/types/system
 */

import {
    SemanticType,
    UnionType,
    NeverType
} from '../SemanticType';
import { TypeHasher, HashContext } from '../TypeHasher';

export function computeJoin(a: SemanticType, b: SemanticType): SemanticType {
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

export function computeMeet(a: SemanticType, b: SemanticType): SemanticType {
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
