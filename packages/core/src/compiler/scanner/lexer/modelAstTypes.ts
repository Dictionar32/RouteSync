import type { AstIdentifier, SourceLineNumber, SourceOffset } from './phpAstCoreTypes';
import type { PhpAstValue } from './phpAstExpressionTypes';

export type ModelDeclarationInheritanceAst =
  | { readonly kind: 'eloquent_model' }
  | { readonly kind: 'authenticatable' }
  | { readonly kind: 'class'; readonly name: AstIdentifier };

export type ModelMethodAst = {
  readonly kind: 'model_method';
  readonly name: AstIdentifier;
  readonly returnType: PhpAstValue;
  readonly returns: readonly PhpAstValue[];
  readonly bodyStart: SourceOffset;
  readonly bodyEnd: SourceOffset;
  readonly startOffset: SourceOffset;
  readonly endOffset: SourceOffset;
  readonly startLine: SourceLineNumber;
  readonly endLine: SourceLineNumber;
};

export type ModelConstantAst = {
  readonly kind: 'model_constant';
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
  readonly methods: readonly ModelMethodAst[];
  readonly constants: readonly ModelConstantAst[];
  readonly startOffset: SourceOffset;
  readonly endOffset: SourceOffset;
};
