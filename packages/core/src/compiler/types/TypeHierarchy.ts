/**
 * @module compiler/types/TypeHierarchy
 * @description Type hierarchy interface for subtyping relationships
 * 
 * Defines the interface for querying type hierarchies, used by the type system
 * to determine subtyping relationships between reference types.
 */

import type { SemanticType } from './SemanticType';
import type { Presence } from '../../types/upstream/presence';

/**
 * Type hierarchy interface.
 * 
 * Implementations provide parent type information for subtyping checks.
 * This allows the type system to traverse inheritance chains.
 * 
 * @example
 * ```typescript
 * class ModelHierarchy implements TypeHierarchy {
 *   getParent(type: SemanticType): SemanticType | undefined {
 *     if (type.kind === 'reference' && type.name === 'Admin') {
 *       return ReferenceType('App\\Models', 'User');
 *     }
 *     return undefined;
 *   }
 * }
 * ```
 */
export interface TypeHierarchy {
    /**
     * Get the parent type of a given type.
     * 
     * Returns an explicit absent relation if the type has no parent (top of hierarchy).
     * Used for subtyping checks in TypeSystem.
     * 
     * @param type - Type to query
     * @returns Parent type or undefined
     */
    getParent(type: SemanticType): Presence<SemanticType>;
}
