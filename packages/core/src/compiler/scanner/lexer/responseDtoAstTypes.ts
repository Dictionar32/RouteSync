/**
 * Semantic interface for Laravel response DTO declarations.
 *
 * This boundary intentionally carries the canonical upstream TypeExpression
 * instead of introducing a second parsed-property type algebra.  The scanner
 * is responsible for syntax evidence; semantic type meaning belongs to the
 * upstream type vocabulary and is therefore shared by resolver, analysis and
 * lowering stages.
 */
import type { AstIdentifier, TokenDescriptor } from './phpAstTypes';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { ClassName } from '../../../types/upstream/names';
import type { PhpClassNameResolutionContext } from '../../../types/upstream/phpClassNameResolutionInterface';

export type ResponseDtoPropertyTypeEvidence =
    | Readonly<{ readonly kind: 'php_primitive_property_type'; readonly expression: TypeExpression; readonly source: TokenDescriptor }>
    | Readonly<{ readonly kind: 'php_mixed_property_type'; readonly expression: Extract<TypeExpression, { readonly kind: 'mixed' }>; readonly source: TokenDescriptor }>
    | Readonly<{ readonly kind: 'php_class_reference_property_type'; readonly expression: TypeExpression; readonly sourceName: ClassName; readonly lexicalContext: PhpClassNameResolutionContext; readonly source: TokenDescriptor }>
    | Readonly<{ readonly kind: 'php_unsupported_property_type_syntax'; readonly expression: Extract<TypeExpression, { readonly kind: 'mixed' }>; readonly source: TokenDescriptor }>;

export interface ResponseDtoPropertyAst {
    readonly kind: 'response_dto_property';
    readonly visibility: 'public';
    /** Canonical type vocabulary consumed by existing downstream projections. */
    readonly type: TypeExpression;
    /** Original type evidence needed before a class reference can be canonically bound. */
    readonly typeEvidence: ResponseDtoPropertyTypeEvidence;
    readonly name: AstIdentifier;
    readonly source: TokenDescriptor;
}

export interface ResponseDtoDeclarationAst {
    readonly kind: 'response_dto_declaration';
    readonly className: AstIdentifier;
    readonly properties: readonly ResponseDtoPropertyAst[];
    readonly source: TokenDescriptor;
}
