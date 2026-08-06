/**
 * @file TSTypeAliasDeclaration.ts
 * @description TypeScript type alias declaration node
 * 
 * Represents type alias declarations dalam TypeScript AST.
 * Example: type UserId = number; type Response<T> = { data: T }
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';
import { TSTypeParameter } from './TSTypeParameter';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Type alias declaration node
 * 
 * Represents `type` declarations dalam TypeScript.
 * 
 * @example
 * ```typescript
 * // type UserId = number
 * new TSTypeAliasDeclaration(
 *   'UserId',
 *   TSTypeReference.number()
 * )
 * 
 * // type Response<T> = { data: T }
 * new TSTypeAliasDeclaration(
 *   'Response',
 *   new TSTypeLiteral([
 *     new TSPropertySignature('data', new TSTypeReference('T'))
 *   ]),
 *   [new TSTypeParameter('T')]
 * )
 * 
 * // export type Result = Success | Error
 * new TSTypeAliasDeclaration(
 *   'Result',
 *   new TSUnionType([
 *     new TSTypeReference('Success'),
 *     new TSTypeReference('Error')
 *   ]),
 *   [],
 *   true
 * )
 * ```
 */
export class TSTypeAliasDeclaration implements TSNode {
    public readonly kind: TSNodeKind = 'type-alias' as const;

    /**
     * Creates a type alias declaration
     * 
     * @param name - Alias name
     * @param type - Type definition
     * @param typeParameters - Optional generic type parameters
     * @param isExported - Whether to export the type
     * @param span - Optional source location
     * @param jsdoc - Optional JSDoc comment
     */
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

    /**
     * Create exported version of this type alias
     * Returns new instance (immutable)
     */
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

    /**
     * Add JSDoc comment
     * Returns new instance (immutable)
     */
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

    /**
     * Add type parameter
     * Returns new instance (immutable)
     */
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

    /**
     * Factory: Create simple type alias
     * 
     * @example
     * ```typescript
     * // type UserId = number
     * TSTypeAliasDeclaration.simple('UserId', TSTypeReference.number())
     * ```
     */
    public static simple(name: string, type: TSTypeNode): TSTypeAliasDeclaration {
        return new TSTypeAliasDeclaration(name, type);
    }

    /**
     * Factory: Create exported type alias
     * 
     * @example
     * ```typescript
     * // export type UserId = number
     * TSTypeAliasDeclaration.exported('UserId', TSTypeReference.number())
     * ```
     */
    public static exported(name: string, type: TSTypeNode): TSTypeAliasDeclaration {
        return new TSTypeAliasDeclaration(name, type, [], true);
    }

    /**
     * Factory: Create generic type alias
     * 
     * @example
     * ```typescript
     * // export type Response<T> = { data: T }
     * TSTypeAliasDeclaration.generic(
     *   'Response',
     *   typeLiteral,
     *   [new TSTypeParameter('T')]
     * )
     * ```
     */
    public static generic(
        name: string,
        type: TSTypeNode,
        typeParameters: readonly TSTypeParameter[]
    ): TSTypeAliasDeclaration {
        return new TSTypeAliasDeclaration(name, type, typeParameters, true);
    }

    /**
     * Accept visitor (Saraf - Neural Pathway)
     * Menghubungkan node type alias ke visitor
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitTypeAliasDeclaration(this);
    }
}
