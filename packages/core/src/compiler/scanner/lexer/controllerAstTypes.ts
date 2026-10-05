/** Syntax AST for Laravel controller declarations. */
import type { AstIdentifier, PhpAstValue, TokenDescriptor } from './phpAstTypes';
import type { ControllerBodyAst } from './controllerBodyAstTypes';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';
import type { PhpParameterTypeAst as SharedPhpParameterTypeAst, PhpParameterDefaultAst as SharedPhpParameterDefaultAst } from './phpMethodAstTypes';

export type PhpParameterTypeAst = SharedPhpParameterTypeAst;

export type ControllerParameterDefaultAst = SharedPhpParameterDefaultAst;

export type ControllerParameterAttributeArgumentAst =
    | { readonly kind: 'positional'; readonly value: PhpAstValue }
    | { readonly kind: 'named'; readonly name: AstIdentifier; readonly value: PhpAstValue }
    | { readonly kind: 'unpacked'; readonly value: PhpAstValue };

export interface ControllerParameterAttributeAst {
    readonly name: AstIdentifier;
    readonly arguments: readonly ControllerParameterAttributeArgumentAst[];
    readonly source: TokenDescriptor;
}

export type ControllerDeclaredReturnTypeAst =
    | { readonly kind: 'absent' }
    | { readonly kind: 'declared'; readonly type: PhpParameterTypeAst };

export interface ControllerParameterAst {
    readonly attributes: readonly ControllerParameterAttributeAst[];
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

export type ControllerMethodVisibilityAst = 'public' | 'protected' | 'private' | 'implicit';
export type ControllerMethodStorageAst = 'instance' | 'static';

export interface ControllerMethodAst {
    /** Method-level PHP attributes are syntax evidence; semantic interpretation remains upstream. */
    readonly attributes: readonly ControllerParameterAttributeAst[];
    readonly visibility: ControllerMethodVisibilityAst;
    /** PHP storage evidence; static is required for Laravel HasMiddleware::middleware(). */
    readonly storage: ControllerMethodStorageAst;
    readonly name: AstIdentifier;
    readonly parameters: readonly ControllerParameterAst[];
    readonly responseAttribute: ResponseAttributeAst;
    readonly declaredReturnType: ControllerDeclaredReturnTypeAst;
    readonly returns: readonly ReturnStatementAst[];
    readonly body: ControllerBodyAst;
    readonly source: TokenDescriptor;
}

export type ControllerInheritanceAst =
    | { readonly kind: 'none' }
    | { readonly kind: 'class'; readonly name: AstIdentifier; readonly source: TokenDescriptor };

export interface ControllerDeclarationAst {
    readonly attributes: readonly ControllerParameterAttributeAst[];
    readonly className: AstIdentifier;
    /** Direct PHP parent-class evidence; unresolved parents remain explicit evidence. */
    readonly inheritance: ControllerInheritanceAst;
    /** Interfaces declared by the controller class; syntax evidence only. */
    readonly interfaces: readonly AstIdentifier[];
    readonly methods: readonly ControllerMethodAst[];
    readonly source: TokenDescriptor;
}
