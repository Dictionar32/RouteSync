/** Syntax AST for Laravel response DTO declarations. */
import type { AstIdentifier, TokenDescriptor } from './phpAstTypes';

export type PhpPropertyTypeAst =
    | { readonly kind: 'primitive'; readonly name: 'string' | 'int' | 'float' | 'bool'; readonly nullable: boolean }
    | { readonly kind: 'mixed'; readonly nullable: boolean }
    | { readonly kind: 'named'; readonly name: AstIdentifier; readonly nullable: boolean };

export interface ResponseDtoPropertyAst {
    readonly visibility: 'public';
    readonly type: PhpPropertyTypeAst;
    readonly name: AstIdentifier;
    readonly source: TokenDescriptor;
}

export interface ResponseDtoDeclarationAst {
    readonly className: AstIdentifier;
    readonly properties: readonly ResponseDtoPropertyAst[];
    readonly source: TokenDescriptor;
}
