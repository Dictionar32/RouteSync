/**
 * Closed semantic contract for recognizing a structured PHP statement from
 * its leading source-token evidence. Runtime consumers receive a judgment,
 * not a private keyword-classification helper.
 */
export type ScannerStatementControlKind =
  | 'conditional'
  | 'collection_iteration'
  | 'counted_iteration'
  | 'pretest_iteration'
  | 'selection_dispatch'
  | 'exception_guard'
  | 'exception_raise';

export type ScannerStatementControlQuery<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly tokenValue: (token: Token) => string;
}>;

export type ScannerStatementControlJudgment<Token> =
  | Readonly<{
      readonly kind: 'structured';
      readonly control: ScannerStatementControlKind;
      readonly evidence: Token;
    }>
  | Readonly<{
      readonly kind: 'not_structured';
      readonly evidence?: Token;
    }>;

/** Recognizes a closed structured-statement control kind from source evidence. */
export interface ScannerStatementControlInterface {
  readonly resolve: <Token>(query: ScannerStatementControlQuery<Token>) => ScannerStatementControlJudgment<Token>;
}
