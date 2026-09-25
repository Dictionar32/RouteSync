import type { AstIdentifier, SourceLineNumber, SourceOffset } from './phpAstCoreTypes';
import type { PhpAstValue } from './phpAstExpressionTypes';
import type { PhpClassPropertyAst, PhpDocAst } from './phpAstDeclarationTypes';
import type { PhpBlock } from './phpAstStatementTypes';
import type { PhpParameter } from './phpAstExpressionTypes';

export type ModelDeclarationInheritanceAst =
  | { readonly kind: 'eloquent_model' }
  | { readonly kind: 'authenticatable' }
  | { readonly kind: 'class'; readonly name: AstIdentifier };

export type ModelMemberVisibilityAst =
  | { readonly kind: 'public' }
  | { readonly kind: 'protected' }
  | { readonly kind: 'private' };

export type ModelMethodReturnTypeAst =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: PhpAstValue };

export type ModelMethodAst = {
  readonly kind: 'model_method';
  readonly name: AstIdentifier;
  readonly documentation: PhpDocAst | { readonly kind: 'absent' };
  readonly visibility: ModelMemberVisibilityAst;
  readonly returnType: ModelMethodReturnTypeAst;
  readonly parameters: readonly PhpParameter[];
  readonly body: PhpBlock;
  readonly bodyStart: SourceOffset;
  readonly bodyEnd: SourceOffset;
  readonly startOffset: SourceOffset;
  readonly endOffset: SourceOffset;
  readonly startLine: SourceLineNumber;
  readonly endLine: SourceLineNumber;
};

export type ModelConstantAst = {
  readonly kind: 'model_constant';
  readonly visibility: ModelMemberVisibilityAst;
  readonly documentation: PhpDocAst | { readonly kind: 'absent' };
  readonly name: AstIdentifier;
  readonly value: PhpAstValue;
  readonly startOffset: SourceOffset;
  readonly endOffset: SourceOffset;
  readonly startLine: SourceLineNumber;
  readonly endLine: SourceLineNumber;
};

export type ModelDeclarationAst = {
  readonly kind: 'model_declaration';
  readonly name: AstIdentifier;
  readonly inheritance: ModelDeclarationInheritanceAst;
  readonly traits: readonly AstIdentifier[];
  readonly documentation: PhpDocAst | { readonly kind: 'absent' };
  readonly properties: readonly PhpClassPropertyAst[];
  readonly methods: readonly ModelMethodAst[];
  readonly constants: readonly ModelConstantAst[];
  readonly startOffset: SourceOffset;
  readonly endOffset: SourceOffset;
};
