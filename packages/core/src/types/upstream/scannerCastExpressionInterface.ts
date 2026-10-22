import type { TokenEvidenceLocation } from './scannerTokenStructureAlgebra';

export type ScannerCastType = 'int' | 'float' | 'string' | 'bool' | 'array' | 'object';

export type ScannerCastExpressionEvidence<Token> = Readonly<{
  readonly opening: Token;
  readonly typeToken: Token;
  readonly closing: Token;
  readonly castType: ScannerCastType;
  readonly operand: readonly Token[];
}>;

export type ScannerCastExpressionJudgment<Token> =
  | Readonly<{ readonly kind: 'resolved'; readonly evidence: ScannerCastExpressionEvidence<Token> }>
  | Readonly<{ readonly kind: 'not_applicable' }>
  | Readonly<{
      readonly kind: 'malformed';
      readonly location: TokenEvidenceLocation<Token>;
      readonly expected: string;
      readonly actual: string;
      readonly reason: 'missing_closing_delimiter' | 'missing_operand';
    }>;

export type ScannerCastExpressionQuery<Token> = Readonly<{
  /** The complete candidate expression, beginning at its first token. */
  readonly tokens: readonly Token[];
  readonly tokenValue: (token: Token) => string;
  readonly tokenKind: (token: Token) => string;
}>;

/** Recognizes PHP cast-expression syntax without constructing an AST or classifying its operand. */
export interface ScannerCastExpressionInterface {
  readonly resolve: <Token>(query: ScannerCastExpressionQuery<Token>) => ScannerCastExpressionJudgment<Token>;
}
