/**
 * @file TSMethodSignature.ts
 * @description TypeScript method signature node (for interfaces)
 * 
 * Represents method signatures dalam TypeScript interfaces.
 * Example: getName(): string; setName(name: string): void;
 * 
 * SKELETON ONLY - NO IMPLEMENTATION LOGIC YET
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';
import { TSTypeParameter } from './TSTypeParameter';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Parameter node for method signatures
 * 
 * @example
 * ```typescript
 * // name: string
 * new TSParameter('name', TSTypeReference.string())
 * 
 * // id?: number
 * new TSParameter('id', TSTypeReference.number(), true)
 * 
 * // options: Partial<Config> = {}
 * new TSParameter(
 *   'options',
 *   new TSTypeReference('Partial', [new TSTypeReference('Config')]),
 *   false,
 *   '{}'
 * )
 * ```
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

/**
 * Method signature node
 * 
 * Represents method signatures dalam interfaces dan type literals.
 * 
 * @example
 * ```typescript
 * // getName(): string
 * new TSMethodSignature(
 *   'getName',
 *   [],
 *   TSTypeReference.string()
 * )
 * 
 * // setName(name: string): void
 * new TSMethodSignature(
 *   'setName',
 *   [new TSParameter('name', TSTypeReference.string())],
 *   TSTypeReference.void()
 * )
 * 
 * // fetch<T>(id: number): Promise<T>
 * new TSMethodSignature(
 *   'fetch',
 *   [new TSParameter('id', TSTypeReference.number())],
 *   new TSTypeReference('Promise', [new TSTypeReference('T')]),
 *   [new TSTypeParameter('T')]
 * )
 * ```
 */
export class TSMethodSignature implements TSNode {
    public readonly kind: TSNodeKind = 'method-signature' as const;

    /**
     * Creates a method signature
     * 
     * @param name - Method name
     * @param parameters - Method parameters
     * @param returnType - Return type
     * @param typeParameters - Optional generic type parameters
     * @param optional - Whether method is optional
     * @param span - Optional source location
     * @param jsdoc - Optional JSDoc comment
     */
    constructor(
        public readonly name: string,
        public readonly parameters: readonly TSParameter[],
        public readonly returnType: TSTypeNode,
        public readonly typeParameters: readonly TSTypeParameter[] = [],
        public readonly optional: boolean = false,
        public readonly span?: SourceSpan,
        public readonly jsdoc?: string
    ) {
        Object.freeze(this);
    }

    /**
     * Make method optional
     * Returns new instance (immutable)
     */
    public asOptional(): TSMethodSignature {
        return new TSMethodSignature(
            this.name,
            this.parameters,
            this.returnType,
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
    public withJSDoc(jsdoc: string): TSMethodSignature {
        return new TSMethodSignature(
            this.name,
            this.parameters,
            this.returnType,
            this.typeParameters,
            this.optional,
            this.span,
            jsdoc
        );
    }

    /**
     * Add parameter
     * Returns new instance (immutable)
     */
    public addParameter(param: TSParameter): TSMethodSignature {
        return new TSMethodSignature(
            this.name,
            [...this.parameters, param],
            this.returnType,
            this.typeParameters,
            this.optional,
            this.span,
            this.jsdoc
        );
    }

    /**
     * Factory: Create simple method
     * 
     * @example
     * ```typescript
     * // getName(): string
     * TSMethodSignature.simple('getName', TSTypeReference.string())
     * ```
     */
    public static simple(name: string, returnType: TSTypeNode): TSMethodSignature {
        return new TSMethodSignature(name, [], returnType);
    }

    /**
     * Factory: Create method with parameters
     * 
     * @example
     * ```typescript
     * // setName(name: string): void
     * TSMethodSignature.withParams(
     *   'setName',
     *   [new TSParameter('name', TSTypeReference.string())],
     *   TSTypeReference.void()
     * )
     * ```
     */
    public static withParams(
        name: string,
        parameters: readonly TSParameter[],
        returnType: TSTypeNode
    ): TSMethodSignature {
        return new TSMethodSignature(name, parameters, returnType);
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitMethodSignature(this);
    }
}
