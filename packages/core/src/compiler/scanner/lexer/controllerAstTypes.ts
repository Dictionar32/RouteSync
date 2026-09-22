/** Syntax AST for Laravel controller declarations. */
import type { AstIdentifier, PhpAstValue, TokenDescriptor } from './phpAstTypes';
import type { ControllerBodyAst } from './controllerBodyAstTypes';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';
import type { PhpParameterTypeAst as SharedPhpParameterTypeAst, PhpParameterDefaultAst as SharedPhpParameterDefaultAst } from './phpMethodAstTypes';

export type PhpParameterTypeAst = SharedPhpParameterTypeAst;

export type ControllerParameterDefaultAst = SharedPhpParameterDefaultAst;

export type ControllerDeclaredReturnTypeAst =
    | { readonly kind: 'absent' }
    | { readonly kind: 'declared'; readonly type: PhpParameterTypeAst };

export interface ControllerParameterAst {
    readonly type: PhpParameterTypeAst;
    readonly defaultValue: ControllerParameterDefaultAst;
    readonly name: AstIdentifier;
    /** Semantic binding is established by the controller scanner, not reconstructed downstream. */
    readonly semantic: ControllerVariableSemantic;
    readonly source: TokenDescriptor;
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
    readonly declaredReturnType: ControllerDeclaredReturnTypeAst;
    readonly returns: readonly ReturnStatementAst[];
    readonly body: ControllerBodyAst;
    readonly source: TokenDescriptor;
}

export interface ControllerDeclarationAst {
    readonly className: AstIdentifier;
    readonly methods: readonly ControllerMethodAst[];
    readonly source: TokenDescriptor;
}
