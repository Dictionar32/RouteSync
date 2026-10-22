import type { DelimitedTokenJudgment, TokenEvidenceLocation, ScannerTokenStructureInterface } from './scannerTokenStructureInterface';

export type ScannerSwitchCaseEvidence<Token> = Readonly<{
  readonly kind: 'case' | 'default';
  readonly marker: Token;
  readonly labels: readonly (readonly Token[])[];
  readonly body: readonly Token[];
  readonly hasBreak: boolean;
}>;
export type ScannerSwitchStatementEvidence<Token> = Readonly<{
  readonly keyword: Token;
  readonly subject: readonly Token[];
  readonly cases: readonly ScannerSwitchCaseEvidence<Token>[];
  readonly remaining: readonly Token[];
}>;
export type ScannerSwitchStatementJudgment<Token> =
  | Readonly<{ readonly kind: 'resolved'; readonly evidence: ScannerSwitchStatementEvidence<Token> }>
  | Readonly<{ readonly kind: 'not_applicable' }>
  | Readonly<{ readonly kind: 'malformed'; readonly location: TokenEvidenceLocation<Token>; readonly expected: string; readonly actual: string; readonly reason: 'expected_subject' | 'expected_body' | 'malformed_delimiter' | 'missing_case_separator' | 'duplicate_default' }>;
export type ScannerSwitchStatementQuery<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly tokenValue: (token: Token) => string;
  readonly structure: ScannerTokenStructureInterface;
}>;
export interface ScannerSwitchStatementInterface {
  readonly resolve: <Token>(query: ScannerSwitchStatementQuery<Token>) => ScannerSwitchStatementJudgment<Token>;
}
