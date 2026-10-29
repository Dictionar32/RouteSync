/** Syntax AST for Laravel controller declarations. */
import type { AstIdentifier, PhpAstValue, TokenDescriptor } from './phpAstTypes';
import type { ControllerBodyAst } from './controllerBodyAstTypes';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';
import type { PhpParameterTypeAst as SharedPhpParameterTypeAst, PhpParameterDefaultAst as SharedPhpParameterDefaultAst } from './phpMethodAstTypes';
import type { PhpClassNameResolution, PhpQualifiedClassName } from '../../../types/upstream/phpClassNameResolutionInterface';
import type { ControllerStaticCallClassNameResolutionContext } from '../../../types/upstream/controllerStaticCallOriginInterface';

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
    /** Exact source span of the PHP attribute, from `#[` through its closing bracket. */
    readonly source: TokenDescriptor;
}

export type ResponseAttributeAst = AbsentResponseAttributeAst | DeclaredResponseAttributeAst;

export interface ReturnStatementAst {
    readonly expression: PhpAstValue;
    readonly source: TokenDescriptor;
}

export type ControllerMethodVisibilityAst = 'public' | 'protected' | 'private' | 'implicit';
export type ControllerMethodStorageAst = 'instance' | 'static';

export type ControllerMethodClassNameResolutionContext = ControllerStaticCallClassNameResolutionContext;


export interface ControllerMethodAst<Semantic extends boolean = true> {
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
    readonly body: ControllerBodyAst<Semantic>;
    readonly source: TokenDescriptor;
    /** Lexical class-resolution context from the owning PHP namespace region. */
    readonly classNameResolutionContext?: ControllerMethodClassNameResolutionContext;
}

export type ControllerInheritanceAst =
    | { readonly kind: 'none' }
    | { readonly kind: 'class'; readonly name: AstIdentifier; readonly identity: PhpClassNameResolution; readonly source: TokenDescriptor };

/** Parser-owned closure of named method declarations within a class body. */
export type ControllerMethodDeclarationInventory<Semantic extends boolean = true> =
    | Readonly<{
        readonly kind: 'controller_method_declaration_inventory_complete';
        readonly declarations: readonly ControllerMethodAst<Semantic>[];
    }>
    | Readonly<{
        readonly kind: 'controller_method_declaration_inventory_blocked';
        readonly candidates: readonly TokenDescriptor[];
    }>;

export interface ControllerDeclarationAst<Semantic extends boolean = true> {
    readonly attributes: readonly ControllerParameterAttributeAst[];
    readonly className: AstIdentifier;
    /** Canonical declared class identity from namespace evidence. */
    readonly classIdentity: PhpQualifiedClassName;
    /** Direct PHP parent-class evidence; unresolved parents remain explicit evidence. */
    readonly inheritance: ControllerInheritanceAst;
    /** Interfaces declared by the controller class; syntax evidence only. */
    readonly interfaces: readonly AstIdentifier[];
    readonly methods: readonly ControllerMethodAst<Semantic>[];
    /** Closed parser evidence; consumers must not treat a dropped parse candidate as absence. */
    readonly methodDeclarationInventory: ControllerMethodDeclarationInventory<Semantic>;
    readonly source: TokenDescriptor;
}
