/**
 * @file TSParameter.ts
 * @description Parameter node for method and function signatures
 *
 * Represents method and function parameters in TypeScript AST.
 * Example: name: string, id?: number, options: Partial<Config> = {}
 *
 * @module compiler/target/typescript/nodes
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';

/**
 * Parameter node for method and function signatures
 */
export class TSParameter implements TSNode {
    public readonly kind: TSNodeKind = 'method-signature' as const;

    /**
     * Creates a parameter
     * 
     * @param name - Parameter name
     * @param type - Parameter type
     * @param optional - Whether parameter is optional
     * @param defaultValue - Optional default value expression
     * @param span - Optional source location
     */
    constructor(
        public readonly name: string,
        public readonly type: TSTypeNode,
        public readonly optional: boolean = false,
        public readonly defaultValue?: string,
        public readonly span?: SourceSpan
    ) {
        Object.freeze(this);
    }

    /**
     * Make parameter optional
     * Returns new instance (immutable)
     */
    public asOptional(): TSParameter {
        return new TSParameter(
            this.name,
            this.type,
            true,
            this.defaultValue,
            this.span
        );
    }

    /**
     * Add default value
     * Returns new instance (immutable)
     */
    public withDefault(defaultValue: string): TSParameter {
        return new TSParameter(
            this.name,
            this.type,
            this.optional,
            defaultValue,
            this.span
        );
    }
}
