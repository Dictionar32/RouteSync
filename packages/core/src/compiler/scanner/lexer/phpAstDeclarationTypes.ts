import type { AstIdentifier, SourceLineNumber, SourceOffset } from './phpAstCoreTypes';
import type { PhpAstValue } from './phpAstExpressionTypes';

export type PhpPropertyVisibility = 'public' | 'protected' | 'private' | 'implicit';

export type PhpClassPropertyAst = {
    readonly kind: 'class_property';
    readonly name: AstIdentifier;
    readonly visibility: PhpPropertyVisibility;
    readonly value: PhpAstValue;
    readonly startOffset: SourceOffset;
    readonly endOffset: SourceOffset;
    readonly startLine: SourceLineNumber;
    readonly endLine: SourceLineNumber;
};
