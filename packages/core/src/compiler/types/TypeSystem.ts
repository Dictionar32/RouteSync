/**
 * @module compiler/types/TypeSystem
 * @description Core type system operations (join, meet, subtyping, assignability).
 * Active Consumer delegating to focused type system sub-domain components.
 */

import type { SemanticType } from './SemanticType';
import type { TypeHierarchy } from './TypeHierarchy';
import {
    computeJoin,
    computeMeet,
    checkSubtype,
    checkAssignable
} from './system';

export { computeJoin, computeMeet, checkSubtype, checkAssignable };

/**
 * Type system with lattice operations and subtyping.
 * Coordinates type lattice, subtyping relation, and assignability checking.
 */
export class TypeSystem {
    constructor(private readonly hierarchy: TypeHierarchy) { }

    /**
     * Compute the join (least upper bound) of two types.
     */
    public join(a: SemanticType, b: SemanticType): SemanticType {
        return computeJoin(a, b);
    }

    /**
     * Compute the meet (greatest lower bound) of two types.
     */
    public meet(a: SemanticType, b: SemanticType): SemanticType {
        return computeMeet(a, b);
    }

    /**
     * Check if source is a subtype of target.
     */
    public isSubtype(source: SemanticType, target: SemanticType): boolean {
        return checkSubtype(source, target, this.hierarchy, (s, t) => this.isAssignable(s, t));
    }

    /**
     * Check if source is assignable to target.
     */
    public isAssignable(source: SemanticType, target: SemanticType): boolean {
        return checkAssignable(source, target, (s, t) => this.isSubtype(s, t));
    }
}
