/**
 * @file TSTypeParameter.ts
 * @description TypeScript type parameter node (generic type parameter)
 * 
 * Represents generic type parameters dalam TypeScript.
 * Example: T, K extends string, V = unknown
 * 
 * SKELETON ONLY - NO IMPLEMENTATION LOGIC YET
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';

/**
 * Type parameter for generic types
 * 
 * @example
 * ```typescript
 * // T
 * new TSTypeParameter('T')
 * 
 * // T extends User
 * new TSTypeParameter('T', new TSTypeReference('User'))
 * 
 * // T extends User = DefaultUser
 * new TSTypeParameter(
 *   'T',
 *   new TSTypeReference('User'),
 *   new TSTypeReference('DefaultUser')
 * )
 * ```
 */
export class TSTypeParameter implements TSNode {
    public readonly kind: TSNodeKind = 'type-parameter' as const;

    /**
     * Creates a type parameter
     * 
     * @param name - Parameter name (e.g., 'T', 'K', 'V')
     * @param constraint - Optional constraint (extends clause)
     * @param defaultType - Optional default type
     * @param span - Optional source location
     */
    constructor(
        public readonly name: string,
        public readonly constraint?: TSTypeNode,
        public readonly defaultType?: TSTypeNode,
        public readonly span?: SourceSpan
    ) {
        Object.freeze(this);
    }

    /**
     * Add constraint
     * Returns new instance (immutable)
     */
    public withConstraint(constraint: TSTypeNode): TSTypeParameter {
        return new TSTypeParameter(
            this.name,
            constraint,
            this.defaultType,
            this.span
        );
    }

    /**
     * Add default type
     * Returns new instance (immutable)
     */
    public withDefault(defaultType: TSTypeNode): TSTypeParameter {
        return new TSTypeParameter(
            this.name,
            this.constraint,
            defaultType,
            this.span
        );
    }

    /**
     * Factory: Create simple type parameter
     * 
     * @example
     * ```typescript
     * // T
     * TSTypeParameter.simple('T')
     * ```
     */
    public static simple(name: string): TSTypeParameter {
        return new TSTypeParameter(name);
    }

    /**
     * Factory: Create constrained type parameter
     * 
     * @example
     * ```typescript
     * // T extends User
     * TSTypeParameter.constrained('T', new TSTypeReference('User'))
     * ```
     */
    public static constrained(name: string, constraint: TSTypeNode): TSTypeParameter {
        return new TSTypeParameter(name, constraint);
    }
}
