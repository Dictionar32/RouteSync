// target/typescript/nodes/TSInterfaceDeclaration.ts

import type { TSNode } from './TSNode';
import type { TSPropertySignature } from './TSPropertySignature';
import type { TSComment } from './TSComment';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Interface declaration node
 * 
 * Example:
 * ```typescript
 * export interface User {
 *   readonly id: number;
 *   name: string;
 * }
 * ```
 */
export class TSInterfaceDeclaration implements TSNode {
    public readonly kind = 'interface-declaration' as const;

    constructor(
        public readonly name: string,
        public readonly properties: TSPropertySignature[],
        public readonly extendsTypes: string[] = [],
        public readonly exported: boolean = true,
        public readonly comment?: TSComment
    ) { }

    /**
     * Add property to interface
     */
    public addProperty(prop: TSPropertySignature): TSInterfaceDeclaration {
        return new TSInterfaceDeclaration(
            this.name,
            [...this.properties, prop],
            this.extendsTypes,
            this.exported,
            this.comment
        );
    }

    /**
     * Add extends type
     */
    public addExtends(typeName: string): TSInterfaceDeclaration {
        return new TSInterfaceDeclaration(
            this.name,
            this.properties,
            [...this.extendsTypes, typeName],
            this.exported,
            this.comment
        );
    }

    /**
     * Set comment
     */
    public withComment(comment: TSComment): TSInterfaceDeclaration {
        return new TSInterfaceDeclaration(
            this.name,
            this.properties,
            this.extendsTypes,
            this.exported,
            comment
        );
    }

    /**
     * Accept visitor (Saraf - Neural Pathway)
     * Menghubungkan node interface ke visitor
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitInterfaceDeclaration(this);
    }
}
