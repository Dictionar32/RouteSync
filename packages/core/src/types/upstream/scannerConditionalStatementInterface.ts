import type { TokenEvidenceLocation } from './scannerTokenStructureAlgebra';

/** Source-backed, cursor-free evidence for an `if` / `else if` / `else` chain. */
export type ScannerConditionalStatementEvidence<Token> = Readonly<{
  readonly keyword: Token;
  readonly condition: readonly Token[];
  readonly thenBody: readonly Token[];
  readonly elseBranch: ScannerConditionalElseBranch<Token>;
  /** Tokens after the complete conditional chain, not including the chain itself. */
  readonly remaining: readonly Token[];
}>;

export type ScannerConditionalElseBranch<Token> =
  | Readonly<{ readonly kind: 'none' }>
  | Readonly<{ readonly kind: 'else_if'; readonly statement: ScannerConditionalStatementEvidence<Token> }>
  | Readonly<{ readonly kind: 'else_block'; readonly keyword: Token; readonly body: readonly Token[] }>;

export type ScannerConditionalStatementJudgment<Token> =
  | Readonly<{ readonly kind: 'resolved'; readonly evidence: ScannerConditionalStatementEvidence<Token> }>
  | Readonly<{ readonly kind: 'not_applicable' }>
  | Readonly<{
      readonly kind: 'malformed';
      readonly location: TokenEvidenceLocation<Token>;
      readonly expected: string;
      readonly actual: string;
      readonly reason: 'expected_condition' | 'expected_then_body' | 'expected_else_body' | 'malformed_delimiter';
    }>;

export type ScannerConditionalStatementQuery<Token> = Readonly<{
  /** Suffix starts at the candidate `if` token. */
  readonly tokens: readonly Token[];
  readonly tokenValue: (token: Token) => string;
}>;

/** Resolves conditional grammar into source partitions; it does not construct AST nodes. */
export interface ScannerConditionalStatementInterface {
  readonly resolve: <Token>(query: ScannerConditionalStatementQuery<Token>) => ScannerConditionalStatementJudgment<Token>;
}
