/** Canonical algebra for structured-statement control evidence. */
import type {
  ScannerStatementControlInterface,
  ScannerStatementControlJudgment,
  ScannerStatementControlKind,
  ScannerStatementControlQuery,
} from './scannerStatementControlInterface';

type ControlKeyword = Readonly<{ readonly keyword: string; readonly control: ScannerStatementControlKind }>;

type ControlKeywordJudgment =
  | Readonly<{
      readonly kind: 'recognized';
      readonly control: ScannerStatementControlKind;
      readonly toScannerStatementControlJudgment: <Token>(evidence: Token) => ScannerStatementControlJudgment<Token>;
    }>
  | Readonly<{
      readonly kind: 'unrecognized';
      readonly toScannerStatementControlJudgment: <Token>(evidence: Token) => ScannerStatementControlJudgment<Token>;
    }>;

type TokenHeadJudgment<Token> =
  | Readonly<{
      readonly kind: 'token_present';
      readonly evidence: Token;
      readonly toScannerStatementControlJudgment: (query: ScannerStatementControlQuery<Token>) => ScannerStatementControlJudgment<Token>;
    }>
  | Readonly<{
      readonly kind: 'token_absent';
      readonly toScannerStatementControlJudgment: (query: ScannerStatementControlQuery<Token>) => ScannerStatementControlJudgment<Token>;
    }>;

/** PHP spellings are evidence; semantic control kinds are domain knowledge. */
const controlKeywordCatalog: readonly ControlKeyword[] = Object.freeze([
  { keyword: 'if', control: 'conditional' },
  { keyword: 'foreach', control: 'collection_iteration' },
  { keyword: 'for', control: 'counted_iteration' },
  { keyword: 'while', control: 'pretest_iteration' },
  { keyword: 'switch', control: 'selection_dispatch' },
  { keyword: 'try', control: 'exception_guard' },
  { keyword: 'throw', control: 'exception_raise' },
]);

/** Recognition is owned by a named catalog operation, not a Map-based side channel. */
const recognizeControlKeyword = (value: string): ControlKeywordJudgment => {
  const recognized = controlKeywordCatalog.find(entry => Object.is(entry.keyword, value));
  if (recognized === undefined) {
    return Object.freeze({
      kind: 'unrecognized',
      toScannerStatementControlJudgment: <Token>(evidence: Token): ScannerStatementControlJudgment<Token> => ({
        kind: 'not_structured',
        evidence,
      }),
    });
  }
  return Object.freeze({
    kind: 'recognized',
    control: recognized.control,
    toScannerStatementControlJudgment: <Token>(evidence: Token): ScannerStatementControlJudgment<Token> => ({
      kind: 'structured',
      control: recognized.control,
      evidence,
    }),
  });
};

/** Presence is modeled as a closed token-head judgment with a domain operation. */
const tokenHeadJudgment = <Token>(tokens: readonly Token[]): TokenHeadJudgment<Token> => {
  const evidence = tokens.at(0);
  if (evidence === undefined) {
    return Object.freeze({
      kind: 'token_absent',
      toScannerStatementControlJudgment: () => ({ kind: 'not_structured' }),
    });
  }
  return Object.freeze({
    kind: 'token_present',
    evidence,
    toScannerStatementControlJudgment: (query: ScannerStatementControlQuery<Token>): ScannerStatementControlJudgment<Token> =>
      recognizeControlKeyword(query.tokenValue(evidence)).toScannerStatementControlJudgment(evidence),
  });
};

const resolveControlEvidence = <Token>(query: ScannerStatementControlQuery<Token>): ScannerStatementControlJudgment<Token> =>
  tokenHeadJudgment(query.tokens).toScannerStatementControlJudgment(query);

export const scannerStatementControlContractAlgebra: ScannerStatementControlInterface = Object.freeze({
  resolve: resolveControlEvidence,
});
