/**
 * @file TSFunctionDeclaration.ts
 * @description TypeScript function declaration node
 * 
 * Represents function declarations dalam TypeScript AST.
 * Example: function greet(name: string): void { }
 * 
 * SKELETON ONLY - NO IMPLEMENTATION LOGIC YET
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';
import type { TSParameter } from './TSMethodSignature';
import { TSTypeParameter } from './TSTypeParameter';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Function declaration node
 * 
 * Represents standalone function declarations (not methods).
 * 
 * @example
 * ```typescript
 * // function greet(name: string): void
 * new TSFunctionDeclaration(
 *   'greet',
 *   [new TSParameter('name', TSTypeReference.string())],
 *   TSTypeReference.void()
 * )
 * 
 * // export function add(a: number, b: number): number
 * new TSFunctionDeclaration(
 *   'add',
 *   [
 *     new TSParameter('a', TSTypeReference.number()),
 *     new TSParameter('b', TSTypeReference.number())
 *   ],
 *   TSTypeReference.number(),
 *   [],
 *   true
 * )
 * 
 * // async function<T> fetch(id: T): Promise<T>
 * new TSFunctionDeclaration(
 *   'fetch',
 *   [new TSParameter('id', new TSTypeReference('T'))],
 *   new TSTypeReference('Promise', [new TSTypeReference('T')]),
 *   [new TSTypeParameter('T')],
 *   true,
 *   true
 * )
 * ```
 */
export class TSFunctionDeclaration implements TSNode {
    public readonly kind: TSNodeKind = 'function-declaration' as const;

    /**
     * Creates a function declaration
     * 
     * @param name - Function name
     * @param parameters - Function parameters
     * @param returnType - Return type
     * @param typeParameters - Generic type parameters
     * @param isExported - Whether to export the function
     * @param isAsync - Whether function is async
     * @param span - Optional source location
     * @param jsdoc - Optional JSDoc comment
     */
    constructor(
        public readonly name: string,
        public readonly parameters: readonly TSParameter[],
        public readonly returnType: TSTypeNode,
        public readonly typeParameters: readonly TSTypeParameter[] = [],
        public readonly isExported: boolean = false,
        public readonly isAsync: boolean = false,
        public readonly span?: SourceSpan,
        public readonly jsdoc?: string
    ) {
        Object.freeze(this);
    }

    /**
     * Create exported version of this function
     * Returns new instance (immutable)
     */
    public asExported(): TSFunctionDeclaration {
        return new TSFunctionDeclaration(
            this.name,
            this.parameters,
            this.returnType,
            this.typeParameters,
            true,
            this.isAsync,
            this.span,
            this.jsdoc
        );
    }

    /**
     * Create async version of this function
     * Returns new instance (immutable)
     */
    public asAsync(): TSFunctionDeclaration {
        return new TSFunctionDeclaration(
            this.name,
            this.parameters,
            this.returnType,
            this.typeParameters,
            this.isExported,
            true,
            this.span,
            this.jsdoc
        );
    }

    /**
     * Add JSDoc comment
     * Returns new instance (immutable)
     */
    public withJSDoc(jsdoc: string): TSFunctionDeclaration {
        return new TSFunctionDeclaration(
            this.name,
            this.parameters,
            this.returnType,
            this.typeParameters,
            this.isExported,
            this.isAsync,
            this.span,
            jsdoc
        );
    }

    /**
     * Add parameter
     * Returns new instance (immutable)
     */
    public addParameter(param: TSParameter): TSFunctionDeclaration {
        return new TSFunctionDeclaration(
            this.name,
            [...this.parameters, param],
            this.returnType,
            this.typeParameters,
            this.isExported,
            this.isAsync,
            this.span,
            this.jsdoc
        );
    }

    /**
     * Add type parameter
     * Returns new instance (immutable)
     */
    public addTypeParameter(param: TSTypeParameter): TSFunctionDeclaration {
        return new TSFunctionDeclaration(
            this.name,
            this.parameters,
            this.returnType,
            [...this.typeParameters, param],
            this.isExported,
            this.isAsync,
            this.span,
            this.jsdoc
        );
    }

    /**
     * Factory: Create simple function
     * 
     * @example
     * ```typescript
     * // function greet(): void
     * TSFunctionDeclaration.simple('greet', TSTypeReference.void())
     * ```
     */
    public static simple(name: string, returnType: TSTypeNode): TSFunctionDeclaration {
        return new TSFunctionDeclaration(name, [], returnType);
    }

    /**
     * Factory: Create function with parameters
     * 
     * @example
     * ```typescript
     * // function add(a: number, b: number): number
     * TSFunctionDeclaration.withParams(
     *   'add',
     *   [
     *     new TSParameter('a', TSTypeReference.number()),
     *     new TSParameter('b', TSTypeReference.number())
     *   ],
     *   TSTypeReference.number()
     * )
     * ```
     */
    public static withParams(
        name: string,
        parameters: readonly TSParameter[],
        returnType: TSTypeNode
    ): TSFunctionDeclaration {
        return new TSFunctionDeclaration(name, parameters, returnType);
    }

    /**
     * Factory: Create exported function
     * 
     * @example
     * ```typescript
     * // export function greet(): void
     * TSFunctionDeclaration.exported('greet', TSTypeReference.void())
     * ```
     */
    public static exported(name: string, returnType: TSTypeNode): TSFunctionDeclaration {
        return new TSFunctionDeclaration(name, [], returnType, [], true);
    }

    /**
     * Factory: Create async function
     * 
     * @example
     * ```typescript
     * // async function fetch(): Promise<void>
     * TSFunctionDeclaration.async(
     *   'fetch',
     *   new TSTypeReference('Promise', [TSTypeReference.void()])
     * )
     * ```
     */
    public static async(name: string, returnType: TSTypeNode): TSFunctionDeclaration {
        return new TSFunctionDeclaration(name, [], returnType, [], false, true);
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitFunctionDeclaration(this);
    }
}
