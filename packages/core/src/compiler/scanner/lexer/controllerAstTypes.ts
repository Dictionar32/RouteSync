/** Syntax AST for Laravel controller declarations. */
import type { AstIdentifier, PhpAstValue, TokenDescriptor } from './phpAstTypes';
import type { ControllerBodyAst } from './controllerBodyAstTypes';

export type PhpParameterTypeAst =
    | { readonly kind: 'primitive'; readonly name: 'string' | 'int' | 'float' | 'bool' | 'mixed' }
    | { readonly kind: 'named'; readonly name: AstIdentifier }
    | { readonly kind: 'nullable'; readonly inner: PhpParameterTypeAst };

export interface ControllerParameterAst {
    readonly type: PhpParameterTypeAst;
    readonly name: AstIdentifier;
}

export interface AbsentResponseAttributeAst {
    readonly kind: 'absent';
}

export interface DeclaredResponseAttributeAst {
    readonly kind: 'declared';
    readonly className: AstIdentifier;
    readonly collection: boolean;
}

export type ResponseAttributeAst = AbsentResponseAttributeAst | DeclaredResponseAttributeAst;

export interface ReturnStatementAst {
    readonly expression: PhpAstValue;
    readonly source: TokenDescriptor;
}

export interface ControllerMethodAst {
    readonly name: AstIdentifier;
    readonly parameters: readonly ControllerParameterAst[];
    readonly responseAttribute: ResponseAttributeAst;
    readonly returns: readonly ReturnStatementAst[];
    readonly body: ControllerBodyAst;
    readonly source: TokenDescriptor;
}

export interface ControllerDeclarationAst {
    readonly className: AstIdentifier;
    readonly methods: readonly ControllerMethodAst[];
    readonly source: TokenDescriptor;
}
