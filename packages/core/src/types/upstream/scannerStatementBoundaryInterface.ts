/**
 * Public, partition-based contract for statement-boundary recognition.
 *
 * The query's token list begins at the statement candidate. The contract does
 * not accept a cursor offset and its judgments do not expose numeric indices
 * or delimiter counters. The algebra owns delimiter reasoning; downstream
 * sequence traversal may maintain its own cursor as a separate concern.
 */
import type { TokenEvidenceLocation } from './scannerTokenStructureAlgebra';

export type StatementBoundaryQuery<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly tokenValue: (token: Token) => string;
}>;

export type StatementBoundaryJudgment<Token> =
  | Readonly<{
      readonly kind: 'terminator';
      readonly statement: readonly Token[];
      readonly terminator: Token;
      readonly remaining: readonly Token[];
    }>
  | Readonly<{
      readonly kind: 'end_of_input';
      readonly statement: readonly Token[];
    }>
  | Readonly<{
      readonly kind: 'malformed';
      readonly location: TokenEvidenceLocation<Token>;
      readonly expected?: string;
      readonly actual: string;
      readonly reason: 'unexpected_closer' | 'mismatched_closer' | 'unclosed_delimiter';
    }>;

export type ValidStatementBoundaryJudgment<Token> = Exclude<
  StatementBoundaryJudgment<Token>,
  Readonly<{ readonly kind: 'malformed' }>
>;

/** Semantic boundary for determining a statement partition from source evidence. */
export interface ScannerStatementBoundaryInterface {
  readonly resolve: <Token>(query: StatementBoundaryQuery<Token>) => StatementBoundaryJudgment<Token>;
}
