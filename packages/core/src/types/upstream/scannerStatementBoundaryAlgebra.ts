/**
 * Language-neutral statement-boundary algebra.
 *
 * Delimiter recognition and cursor compatibility are owned by this domain.
 * The domain outcomes carry their next operation as typed data; consumers do
 * not dispatch through generic Result handlers. Parser traversal remains an
 * algorithm, while delimiter and boundary meaning live in closed judgments.
 */
import type {
  ScannerStatementBoundaryInterface,
  StatementBoundaryJudgment,
  StatementBoundaryQuery,
} from './scannerStatementBoundaryInterface';
import type { TokenEvidenceLocation } from './scannerTokenStructureAlgebra';

export type StatementDelimiterState = Readonly<{
  readonly parentheses: number;
  readonly brackets: number;
  readonly braces: number;
}>;

export type StatementBoundaryResolution =
  | Readonly<{ readonly kind: 'terminator'; readonly index: number; readonly state: StatementDelimiterState }>
  | Readonly<{ readonly kind: 'end_of_input'; readonly index: number; readonly state: StatementDelimiterState }>
  | Readonly<{ readonly kind: 'malformed'; readonly index: number; readonly expected?: string; readonly actual: string; readonly reason: 'invalid_start' | 'unexpected_closer' | 'mismatched_closer' | 'unclosed_delimiter' }>;

export type ValidStatementBoundaryResolution = Extract<StatementBoundaryResolution, { readonly kind: 'terminator' | 'end_of_input' }>;

export type StatementBoundaryInput<Token> = Readonly<{
  readonly tokens: readonly Token[];
  readonly start: number;
  readonly tokenValue: (token: Token) => string;
}>;

export interface StatementBoundaryAlgebra {
  readonly resolve: <Token>(input: StatementBoundaryInput<Token>) => StatementBoundaryResolution;
}

type Delimiter = Readonly<{ readonly opener: string; readonly closer: string }>;
const delimiters: readonly Delimiter[] = Object.freeze([
  { opener: '(', closer: ')' },
  { opener: '[', closer: ']' },
  { opener: '{', closer: '}' },
]);

type DelimiterJudgment =
  | Readonly<{ readonly kind: 'opener'; readonly delimiter: Delimiter }>
  | Readonly<{ readonly kind: 'closer'; readonly delimiter: Delimiter }>
  | Readonly<{ readonly kind: 'ordinary' }>;

/** Classification is data; delimiter meaning is not encoded in callback bundles. */
const delimiterJudgment = (value: string): DelimiterJudgment => {
  const opener = delimiters.find(delimiter => Object.is(delimiter.opener, value));
  if (opener !== undefined) return Object.freeze({ kind: 'opener', delimiter: opener });

  const closer = delimiters.find(delimiter => Object.is(delimiter.closer, value));
  if (closer !== undefined) return Object.freeze({ kind: 'closer', delimiter: closer });

  return Object.freeze({ kind: 'ordinary' });
};

type StatementPositionJudgment =
  | Readonly<{ readonly kind: 'top_level_terminator' }>
  | Readonly<{ readonly kind: 'ordinary_position' }>;

const statementPositionJudgment = (value: string, depth: number): StatementPositionJudgment =>
  Object.is(value, ';') && depth === 0
    ? Object.freeze({ kind: 'top_level_terminator' })
    : Object.freeze({ kind: 'ordinary_position' });

const emptyState: StatementDelimiterState = Object.freeze({ parentheses: 0, brackets: 0, braces: 0 });
const tokenLocation = <Token>(token: Token): TokenEvidenceLocation<Token> => ({ kind: 'token', evidence: token });
const endLocation = <Token>(): TokenEvidenceLocation<Token> => ({ kind: 'end_of_source' });

/** Canonical partition judgment. Delimiter-stack reasoning remains upstream. */
const resolveStatementBoundary = <Token>(query: StatementBoundaryQuery<Token>): StatementBoundaryJudgment<Token> => {
  const scan = (index: number, stack: readonly Delimiter[]): StatementBoundaryJudgment<Token> => {
    const token = query.tokens[index];
    if (token === undefined) {
      const top = stack.at(-1);
      if (top === undefined) return { kind: 'end_of_input', statement: query.tokens };
      return { kind: 'malformed', location: endLocation<Token>(), expected: top.closer, actual: '<end-of-input>', reason: 'unclosed_delimiter' };
    }

    const value = query.tokenValue(token);
    const position = statementPositionJudgment(value, stack.length);
    if (position.kind === 'top_level_terminator') {
      return { kind: 'terminator', statement: query.tokens.slice(0, index), terminator: token, remaining: query.tokens.slice(index + 1) };
    }

    const delimiter = delimiterJudgment(value);
    if (delimiter.kind === 'opener') return scan(index + 1, [...stack, delimiter.delimiter]);
    if (delimiter.kind === 'closer') {
      const top = stack.at(-1);
      if (top === undefined) return { kind: 'malformed', location: tokenLocation(token), actual: value, reason: 'unexpected_closer' };
      if (Object.is(top.closer, delimiter.delimiter.closer)) return scan(index + 1, stack.slice(0, -1));
      return { kind: 'malformed', location: tokenLocation(token), expected: top.closer, actual: value, reason: 'mismatched_closer' };
    }
    return scan(index + 1, stack);
  };

  return scan(0, []);
};

/** Canonical upstream runtime contract: interface first, implementation second. */
export const scannerStatementBoundaryContractAlgebra: ScannerStatementBoundaryInterface = Object.freeze({
  resolve: resolveStatementBoundary,
});

type StartCursorJudgment =
  | Readonly<{ readonly kind: 'valid_start'; readonly start: number; readonly toStatementBoundaryResolution: <Token>(input: StatementBoundaryInput<Token>) => StatementBoundaryResolution }>
  | Readonly<{ readonly kind: 'invalid_start'; readonly start: number; readonly toStatementBoundaryResolution: <Token>(input: StatementBoundaryInput<Token>) => StatementBoundaryResolution }>;

const toCompatibilityResolution = <Token>(
  judgment: StatementBoundaryJudgment<Token>,
  input: StatementBoundaryInput<Token>,
  start: number,
): StatementBoundaryResolution => {
  if (judgment.kind === 'terminator') {
    return { kind: 'terminator', index: start + judgment.statement.length, state: emptyState };
  }
  if (judgment.kind === 'end_of_input') {
    return { kind: 'end_of_input', index: start + judgment.statement.length, state: emptyState };
  }

  const index = judgment.location.kind === 'end_of_source'
    ? input.tokens.length
    : input.tokens.indexOf(judgment.location.evidence, start);
  const locationIndex = index < 0 ? input.tokens.length : index;
  const expected = judgment.expected;
  return Object.freeze({
    kind: 'malformed',
    index: locationIndex,
    ...(expected === undefined ? {} : { expected }),
    actual: judgment.actual,
    reason: judgment.reason,
  });
};

/** Cursor validity is an outcome with a domain-specific projection operation. */
const startCursorJudgment = (start: number, length: number): StartCursorJudgment => {
  if (!Number.isInteger(start) || start < 0 || start > length) {
    return Object.freeze({
      kind: 'invalid_start',
      start,
      toStatementBoundaryResolution: <Token>(input: StatementBoundaryInput<Token>): StatementBoundaryResolution => ({
        kind: 'malformed',
        index: start,
        expected: '<valid-index>',
        actual: String(start),
        reason: 'invalid_start',
      }),
    });
  }
  return Object.freeze({
    kind: 'valid_start',
    start,
    toStatementBoundaryResolution: <Token>(input: StatementBoundaryInput<Token>): StatementBoundaryResolution => {
      const suffix = input.tokens.slice(start);
      const judgment = scannerStatementBoundaryContractAlgebra.resolve({ tokens: suffix, tokenValue: input.tokenValue });
      return toCompatibilityResolution(judgment, input, start);
    },
  });
};

/** Compatibility facade; canonical delimiter recognition remains upstream. */
export const scannerStatementBoundaryAlgebra: StatementBoundaryAlgebra = Object.freeze({
  resolve: <Token>(input: StatementBoundaryInput<Token>): StatementBoundaryResolution =>
    startCursorJudgment(input.start, input.tokens.length).toStatementBoundaryResolution(input),
});
