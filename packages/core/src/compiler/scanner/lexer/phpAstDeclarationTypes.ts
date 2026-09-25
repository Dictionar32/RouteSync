import type { AstIdentifier, SourceLineNumber, SourceOffset } from './phpAstCoreTypes';
import type { PhpAstValue } from './phpAstExpressionTypes';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { DescriptionText } from '../../../types/upstream/valueObjects';


export type PhpDocTagAst =
    | { readonly kind: 'property'; readonly name: AstIdentifier; readonly type: TypeExpression }
    | { readonly kind: 'var'; readonly type: TypeExpression };

export type PhpDocAst = {
    readonly kind: 'phpdoc';
    readonly description: readonly DescriptionText[];
    readonly tags: readonly PhpDocTagAst[];
    readonly source: { readonly startOffset: SourceOffset; readonly endOffset: SourceOffset };
};

export type PhpPropertyVisibility = 'public' | 'protected' | 'private' | 'implicit';

export type PhpPropertyStorage = 'instance' | 'static';

export type PhpPropertyMutability = 'mutable' | 'readonly';

export type PhpPropertyTypeAst =
    | { readonly kind: 'declared'; readonly value: string }
    | { readonly kind: 'untyped' };

export type PhpPropertyInitializationAst =
    | { readonly kind: 'absent' }
    | { readonly kind: 'present'; readonly value: PhpAstValue };

export type PhpPropertyValueAst =
    | { readonly kind: 'absent' }
    | { readonly kind: 'present'; readonly value: PhpAstValue };

export type PhpPropertyPromotionAst =
    | { readonly kind: 'declared' }
    | {
        readonly kind: 'constructor_promoted';
        readonly constructorName: AstIdentifier;
        readonly parameterDefault: PhpPropertyValueAst;
    };

export type PhpClassPropertyAst = {
    readonly kind: 'class_property';
    readonly name: AstIdentifier;
    readonly visibility: PhpPropertyVisibility;
    readonly storage: PhpPropertyStorage;
    readonly mutability: PhpPropertyMutability;
    readonly type: PhpPropertyTypeAst;
    readonly promotion: PhpPropertyPromotionAst;
    readonly initialization: PhpPropertyInitializationAst;
    readonly documentation: PhpDocAst | { readonly kind: 'absent' };
    readonly startOffset: SourceOffset;
    readonly endOffset: SourceOffset;
    readonly startLine: SourceLineNumber;
    readonly endLine: SourceLineNumber;
};
