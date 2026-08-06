// target/typescript/nodes/TSPropertySignature.ts

import type { TSNode } from './TSNode';
import type { TSTypeReference } from './TSTypeReference';
import type { TSComment } from './TSComment';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Property signature in interface/type
 * 
 * Example:
 * ```typescript
 * readonly id: number;
 * name?: string;
 * ```
 */
export class TSPropertySignature implements TSNode {
    public readonly kind = 'property-signature' as const;

    constructor(
        public readonly name: string,
        public readonly type: TSTypeReference | import('./TSArrayType').TSArrayType | import('./TSUnionType').TSUnionType | import('./TSIntersectionType').TSIntersectionType,
        public readonly optional: boolean = false,
        public readonly readonly: boolean = false,
        public readonly comment?: TSComment
    ) { }

    /**
     * Make property optional
     */
    public makeOptional(): TSPropertySignature {
        return new TSPropertySignature(
            this.name,
            this.type,
            true,
            this.readonly,
            this.comment
        );
    }

    /**
     * Make property readonly
     */
    public makeReadonly(): TSPropertySignature {
        return new TSPropertySignature(
            this.name,
            this.type,
            this.optional,
            true,
            this.comment
        );
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitPropertySignature(this);
    }
}
