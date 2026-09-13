/**
 * @file TSFunctionDeclaration.ts
 * @description TypeScript function declaration node
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSTypeNode } from './TSTypeNode';
import type { TSParameter } from './TSMethodSignature';
import { TSTypeParameter } from './TSTypeParameter';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Function declaration node representing standalone functions.
 */
export class TSFunctionDeclaration implements TSNode {
    public readonly kind: TSNodeKind = 'function-declaration' as const;

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

    public static simple(name: string, returnType: TSTypeNode): TSFunctionDeclaration {
        return new TSFunctionDeclaration(name, [], returnType);
    }

    public static withParams(
        name: string,
        parameters: readonly TSParameter[],
        returnType: TSTypeNode
    ): TSFunctionDeclaration {
        return new TSFunctionDeclaration(name, parameters, returnType);
    }

    public static exported(name: string, returnType: TSTypeNode): TSFunctionDeclaration {
        return new TSFunctionDeclaration(name, [], returnType, [], true);
    }

    public static async(name: string, returnType: TSTypeNode): TSFunctionDeclaration {
        return new TSFunctionDeclaration(name, [], returnType, [], false, true);
    }

    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitFunctionDeclaration(this);
    }
}
