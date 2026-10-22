import type { TokenEvidenceLocation, ScannerTokenStructureInterface } from './scannerTokenStructureInterface';

export type ScannerLoopControl = 'collection_iteration' | 'counted_iteration' | 'pretest_iteration';
export type ScannerLoopTarget<Token> =
  | Readonly<{ readonly kind: 'value'; readonly variable: Token }>
  | Readonly<{ readonly kind: 'key_value'; readonly key: Token; readonly value: Token }>;
export type ScannerLoopStatementBaseEvidence<Token> = Readonly<{
  readonly keyword: Token;
  readonly header: readonly Token[];
  readonly body: readonly Token[];
  readonly remaining: readonly Token[];
}>;

/** A resolved loop carries exactly the evidence required by its control form. */
export type ScannerLoopStatementEvidence<Token> =
  | (ScannerLoopStatementBaseEvidence<Token> & Readonly<{ readonly control: 'pretest_iteration' }>)
  | (ScannerLoopStatementBaseEvidence<Token> & Readonly<{
      readonly control: 'counted_iteration';
      readonly clauses: readonly [readonly Token[], readonly Token[], readonly Token[]];
    }>)
  | (ScannerLoopStatementBaseEvidence<Token> & Readonly<{
      readonly control: 'collection_iteration';
      readonly iterable: readonly Token[];
      readonly target: ScannerLoopTarget<Token>;
    }>);
export type ScannerLoopStatementJudgment<Token> =
  | Readonly<{ readonly kind: 'resolved'; readonly evidence: ScannerLoopStatementEvidence<Token> }>
  | Readonly<{ readonly kind: 'not_applicable' }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected: string; readonly actual: string; readonly reason: 'expected_header' | 'expected_body' | 'malformed_delimiter' | 'invalid_for_clauses' | 'missing_as' | 'invalid_iteration_target' }>;
export type ScannerLoopStatementQuery<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly control: ScannerLoopControl;
  readonly tokenValue: (token: Token) => string;
  readonly tokenKind: (token: Token) => string;
  readonly structure: ScannerTokenStructureInterface;
}>;
export interface ScannerLoopStatementInterface {
  readonly resolve: <Token>(query: ScannerLoopStatementQuery<Token>) => ScannerLoopStatementJudgment<Token>;
}
