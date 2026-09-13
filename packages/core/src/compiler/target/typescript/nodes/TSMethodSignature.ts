/**
 * @file TSMethodSignature.ts
 * @description TypeScript method signature node (for interfaces)
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';
import { TSTypeParameter } from './TSTypeParameter';
import type { TSVisitor } from '../visitor/TSVisitor';
import { TSParameter } from './TSParameter';

export { TSParameter };

/**
 * Method signature node for interfaces and type literals.
 */
export class TSMethodSignature implements TSNode {
    public readonly kind: TSNodeKind = 'method-signature' as const;

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

    public static simple(name: string, returnType: TSTypeNode): TSMethodSignature {
        return new TSMethodSignature(name, [], returnType);
    }

    public static withParams(
        name: string,
        parameters: readonly TSParameter[],
        returnType: TSTypeNode
    ): TSMethodSignature {
        return new TSMethodSignature(name, parameters, returnType);
    }

    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitMethodSignature(this);
    }
}
