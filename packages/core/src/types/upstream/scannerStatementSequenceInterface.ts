/**
 * Contract for sequence-level statement parsing.
 *
 * The sequence algebra owns cursor progress and validates the partition returned
 * by the boundary authority. Runtime callbacks may construct AST nodes, but may
 * not replace boundary reasoning or silently report a successful partial parse.
 */
import type { StatementBoundaryJudgment } from './scannerStatementBoundaryInterface';

export type StructuredStatementResult<Statement> = Readonly<{
  readonly statement: Statement;
  readonly nextIndex: number;
}>;

/** Closed result of structured-statement recognition and AST execution. */
export type StructuredStatementJudgment<Statement> =
  | Readonly<{ readonly kind: 'not_applicable' }>
  | Readonly<{ readonly kind: 'resolved'; readonly value: StructuredStatementResult<Statement> }>
  | Readonly<{ readonly kind: 'malformed'; readonly diagnostic: string }>
  | Readonly<{ readonly kind: 'contract_violation'; readonly reason: 'structured_rule_unresolved' | 'invalid_resolution' }>;

export type StatementSequenceContract<Token, Statement> = Readonly<{
  readonly tokens: readonly Token[];
  /** Lexical trivia policy only; this callback must not infer statement meaning. */
  readonly isIgnorable: (token: Token) => boolean;
  /** AST executor for structured statements; nextIndex must advance within the source. */
  readonly resolveStructured: (
    tokens: readonly Token[],
    start: number,
    end: number,
  ) => StructuredStatementJudgment<Statement>;
  /** Canonical boundary authority for the suffix beginning at the candidate statement. */
  readonly findBoundary: (tokens: readonly Token[]) => StatementBoundaryJudgment<Token>;
  /** AST executor for a simple statement already partitioned by the boundary authority. */
  readonly resolveSimple: (statement: readonly Token[]) => Statement;
}>;

export type StatementSequenceResolution<Statement> =
  | Readonly<{
      readonly kind: 'complete';
      readonly statements: readonly Statement[];
      readonly nextIndex: number;
    }>
  | Readonly<{
      readonly kind: 'malformed';
      readonly statements: readonly Statement[];
      readonly index: number;
      readonly diagnostic: string;
    }>
  | Readonly<{
      readonly kind: 'contract_violation';
      readonly statements: readonly Statement[];
      readonly index: number;
      readonly reason:
        | 'invalid_boundary'
        | 'malformed_boundary'
        | 'non_progressing_structured_statement'
        | 'non_progressing_simple_statement'
        | 'unresolved_structured_statement'
        | 'invalid_structured_resolution';
    }>;

export interface ScannerStatementSequenceInterface {
  readonly parse: <Token, Statement>(
    contract: StatementSequenceContract<Token, Statement>,
  ) => StatementSequenceResolution<Statement>;
}
