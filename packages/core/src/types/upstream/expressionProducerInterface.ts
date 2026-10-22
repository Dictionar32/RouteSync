import type { ExpressionAst, ExpressionOrigin } from './ast';
import type { SourceSpan } from './provenance';
import type { SourceFile } from './names';
import type { Expression } from './expression';

/** Named syntax evidence and provenance supplied to the PHP expression operation. */
export interface ExpressionFromPhpAstInput<SyntaxEvidence extends object> {
  readonly syntax: SyntaxEvidence;
  readonly sourceFile: SourceFile;
}

export interface ExpressionFromPhpAstOperationInterface<SyntaxEvidence extends object> {
  readonly project: (input: ExpressionFromPhpAstInput<SyntaxEvidence>) => Expression;
}

export interface ExpressionProducerInput<SyntaxEvidence extends object> {
  readonly syntax: SyntaxEvidence;
  readonly origin: ExpressionOrigin;
  readonly source: SourceSpan;
}

export interface ExpressionProducerInterface<SyntaxEvidence extends object> {
  readonly produce: (input: ExpressionProducerInput<SyntaxEvidence>) => ExpressionAst;
}

export interface ExpressionAstFromPhpAstInput<SyntaxEvidence extends object> {
  readonly syntax: SyntaxEvidence;
  readonly expression: Expression;
  readonly origin: ExpressionOrigin;
  readonly sourceFile: SourceFile;
}

export interface ExpressionAstFromPhpAstOperationInterface<SyntaxEvidence extends object> {
  readonly project: (input: ExpressionAstFromPhpAstInput<SyntaxEvidence>) => ExpressionAst;
}
