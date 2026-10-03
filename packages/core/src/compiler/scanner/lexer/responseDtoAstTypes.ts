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

export interface ResponseDtoPropertyAst {
    readonly kind: 'response_dto_property';
    readonly visibility: 'public';
    readonly type: TypeExpression;
    readonly name: AstIdentifier;
    readonly source: TokenDescriptor;
}

export interface ResponseDtoDeclarationAst {
    readonly kind: 'response_dto_declaration';
    readonly className: AstIdentifier;
    readonly properties: readonly ResponseDtoPropertyAst[];
    readonly source: TokenDescriptor;
}
