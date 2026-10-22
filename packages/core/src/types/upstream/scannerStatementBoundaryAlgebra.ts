/**
 * Language-neutral statement-boundary algebra.
 *
 * The partition judgment is the semantic authority. The cursor-shaped API is
 * retained only as a compatibility facade for the statement-sequence layer;
 * it delegates to the partition contract and contains no delimiter reasoning.
 */
import { relationEqual, relationAll } from '../../semantic/relations/semanticRelations';
import { relationAdvanceIndex, relationGate } from '../../semantic/relations/relationalSequence';
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
const openerFor = (value: string): Delimiter | undefined => delimiters.find(entry => entry.opener === value);
const closerFor = (value: string): Delimiter | undefined => delimiters.find(entry => entry.closer === value);
const emptyState: StatementDelimiterState = Object.freeze({ parentheses: 0, brackets: 0, braces: 0 });
const tokenLocation = <Token>(token: Token): TokenEvidenceLocation<Token> => ({ kind: 'token', evidence: token });
const endLocation = <Token>(): TokenEvidenceLocation<Token> => ({ kind: 'end_of_source' });

/** Canonical partition judgment. All delimiter-stack reasoning lives here. */
export const scannerStatementBoundaryContractAlgebra: ScannerStatementBoundaryInterface = Object.freeze({
  resolve: <Token>(query: StatementBoundaryQuery<Token>): StatementBoundaryJudgment<Token> => {
    const scan = (
      index: number,
      stack: readonly Delimiter[],
    ): StatementBoundaryJudgment<Token> => {
      if (index >= query.tokens.length) {
        const top = stack[stack.length - 1];
        return top === undefined
          ? { kind: 'end_of_input', statement: query.tokens }
          : {
              kind: 'malformed',
              location: endLocation<Token>(),
              expected: top.closer,
              actual: '<end-of-input>',
              reason: 'unclosed_delimiter',
            };
      }

      const token = query.tokens[index];
      const value = query.tokenValue(token);
      if (relationAll([relationEqual(value, ';'), relationEqual(stack.length, 0)])) {
        return {
          kind: 'terminator',
          statement: query.tokens.slice(0, index),
          terminator: token,
          remaining: query.tokens.slice(relationAdvanceIndex(index, 1)),
        };
      }

      const opener = openerFor(value);
      if (opener !== undefined) return scan(relationAdvanceIndex(index, 1), [...stack, opener]);

      const closer = closerFor(value);
      if (closer !== undefined) {
        const top = stack[stack.length - 1];
        if (top === undefined) {
          return { kind: 'malformed', location: tokenLocation(token), actual: value, reason: 'unexpected_closer' };
        }
        if (top.closer !== value) {
          return { kind: 'malformed', location: tokenLocation(token), expected: top.closer, actual: value, reason: 'mismatched_closer' };
        }
        return scan(relationAdvanceIndex(index, 1), stack.slice(0, -1));
      }

      return scan(relationAdvanceIndex(index, 1), stack);
    };

    return scan(0, []);
  },
});

/**
 * Legacy cursor-shaped compatibility facade. It projects the canonical
 * partition judgment into the older index shape; it does not scan delimiters.
 */
export const scannerStatementBoundaryAlgebra: StatementBoundaryAlgebra = Object.freeze({
  resolve: <Token>(input: StatementBoundaryInput<Token>): StatementBoundaryResolution => relationGate(
    relationAll([input.start >= 0, input.start <= input.tokens.length]),
    () => {
      const suffix = input.tokens.slice(input.start);
      const judgment = scannerStatementBoundaryContractAlgebra.resolve({ tokens: suffix, tokenValue: input.tokenValue });
      switch (judgment.kind) {
        case 'terminator':
          return {
            kind: 'terminator',
            index: input.start + judgment.statement.length,
            state: emptyState,
          };
        case 'end_of_input':
          return { kind: 'end_of_input', index: input.start + judgment.statement.length, state: emptyState };
        case 'malformed': {
          const index = judgment.location.kind === 'end_of_source'
            ? input.tokens.length
            : input.tokens.indexOf(judgment.location.evidence, input.start);
          return {
            kind: 'malformed',
            index: index < 0 ? input.tokens.length : index,
            ...(judgment.expected === undefined ? {} : { expected: judgment.expected }),
            actual: judgment.actual,
            reason: judgment.reason,
          };
        }
      }
    },
    () => ({ kind: 'malformed' as const, index: input.start, expected: '<valid-index>', actual: String(input.start), reason: 'invalid_start' as const }),
  ),
});
