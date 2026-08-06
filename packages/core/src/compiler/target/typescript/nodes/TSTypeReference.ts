// target/typescript/nodes/TSTypeReference.ts

import type { TSNode } from './TSNode';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Type reference node
 * 
 * Examples:
 * - number
 * - string
 * - Array<User>
 * - string | null
 */
export class TSTypeReference implements TSNode {
    public readonly kind = 'type-reference' as const;

    constructor(
        public readonly name: string,
        public readonly typeArguments: TSTypeReference[] = [],
        public readonly isArray: boolean = false
    ) { }

    /**
     * Make array type
     */
    public toArray(): TSTypeReference {
        return new TSTypeReference(this.name, this.typeArguments, true);
    }

    /**
     * Add generic type argument
     */
    public addTypeArgument(arg: TSTypeReference): TSTypeReference {
        return new TSTypeReference(
            this.name,
            [...this.typeArguments, arg],
            this.isArray
        );
    }

    /**
     * Built-in primitive types
     */
    public static string(): TSTypeReference {
        return new TSTypeReference('string');
    }

    public static number(): TSTypeReference {
        return new TSTypeReference('number');
    }

    public static boolean(): TSTypeReference {
        return new TSTypeReference('boolean');
    }

    public static null(): TSTypeReference {
        return new TSTypeReference('null');
    }

    public static undefined(): TSTypeReference {
        return new TSTypeReference('undefined');
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitTypeReference(this);
    }
}
