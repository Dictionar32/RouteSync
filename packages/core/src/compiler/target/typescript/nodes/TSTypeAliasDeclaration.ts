/**
 * @file TSTypeAliasDeclaration.ts
 * @description TypeScript type alias declaration node
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';
import { TSTypeParameter } from './TSTypeParameter';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Type alias declaration node.
 */
export class TSTypeAliasDeclaration implements TSNode {
    public readonly kind: TSNodeKind = 'type-alias' as const;

    constructor(
        public readonly name: string,
        public readonly type: TSTypeNode,
        public readonly typeParameters: readonly TSTypeParameter[] = [],
        public readonly isExported: boolean = false,
        public readonly span?: SourceSpan,
        public readonly jsdoc?: string
    ) {
        Object.freeze(this);
    }

    public asExported(): TSTypeAliasDeclaration {
        return new TSTypeAliasDeclaration(
            this.name,
            this.type,
            this.typeParameters,
            true,
            this.span,
            this.jsdoc
        );
    }

    public withJSDoc(jsdoc: string): TSTypeAliasDeclaration {
        return new TSTypeAliasDeclaration(
            this.name,
            this.type,
            this.typeParameters,
            this.isExported,
            this.span,
            jsdoc
        );
    }

    public addTypeParameter(param: TSTypeParameter): TSTypeAliasDeclaration {
        return new TSTypeAliasDeclaration(
            this.name,
            this.type,
            [...this.typeParameters, param],
            this.isExported,
            this.span,
            this.jsdoc
        );
    }

    public static simple(name: string, type: TSTypeNode): TSTypeAliasDeclaration {
        return new TSTypeAliasDeclaration(name, type);
    }

    public static exported(name: string, type: TSTypeNode): TSTypeAliasDeclaration {
        return new TSTypeAliasDeclaration(name, type, [], true);
    }

    public static generic(
        name: string,
        type: TSTypeNode,
        typeParameters: readonly TSTypeParameter[]
    ): TSTypeAliasDeclaration {
        return new TSTypeAliasDeclaration(name, type, typeParameters, true);
    }

    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitTypeAliasDeclaration(this);
    }
}
