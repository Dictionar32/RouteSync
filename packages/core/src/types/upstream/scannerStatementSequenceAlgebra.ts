/**
 * Generic cursor/sequence algebra for scanner statement parsing.
 * It owns cursor progress and refuses to report a complete parse when a
 * boundary is malformed or a resolver violates the sequence contract.
 */
import type { ScannerStatementSequenceInterface, StatementSequenceContract, StatementSequenceResolution } from './scannerStatementSequenceInterface';
import type { StatementBoundaryJudgment, ValidStatementBoundaryJudgment } from './scannerStatementBoundaryInterface';

// Preserve the historical type exports for existing test and package consumers.
export type { StructuredStatementResult, StructuredStatementJudgment, StatementSequenceContract, StatementSequenceResolution } from './scannerStatementSequenceInterface';
export type ScannerStatementSequenceAlgebra = ScannerStatementSequenceInterface;

const samePartition = <Token>(left: readonly Token[], right: readonly Token[]): boolean =>
  left.length === right.length && left.every((token, index) => Object.is(token, right[index]));

/** Domain-owned cursor progression: traversal arithmetic stays behind this operation. */
type StatementSequenceCursor = Readonly<{
  readonly index: number;
  readonly advancePastCurrent: () => StatementSequenceCursor;
  readonly advanceBy: (distance: number) => StatementSequenceCursor;
}>;

const statementSequenceCursor = (index: number): StatementSequenceCursor => Object.freeze({
  index,
  advancePastCurrent: () => statementSequenceCursor(index + 1),
  advanceBy: (distance: number) => statementSequenceCursor(index + distance),
});

type StatementSequenceProgressJudgment = Readonly<{
  readonly kind: 'progressing';
  readonly nextIndex: number;
  readonly continueWith: <Result>(onProgress: (nextIndex: number) => Result, onStalled: () => Result) => Result;
}> | Readonly<{
  readonly kind: 'stalled';
  readonly nextIndex: number;
  readonly continueWith: <Result>(onProgress: (nextIndex: number) => Result, onStalled: () => Result) => Result;
}>;

const statementSequenceProgress = (currentIndex: number, nextIndex: number): StatementSequenceProgressJudgment =>
  nextIndex > currentIndex
    ? Object.freeze({
        kind: 'progressing',
        nextIndex,
        continueWith: <Result>(onProgress: (value: number) => Result, _onStalled: () => Result): Result => onProgress(nextIndex),
      })
    : Object.freeze({
        kind: 'stalled',
        nextIndex,
        continueWith: <Result>(_onProgress: (value: number) => Result, onStalled: () => Result): Result => onStalled(),
      });

type StatementPartitionJudgment = Readonly<{
  readonly kind: 'valid_partition';
  readonly continueWith: <Result>(onValid: () => Result, onInvalid: () => Result) => Result;
}> | Readonly<{
  readonly kind: 'invalid_partition';
  readonly continueWith: <Result>(onValid: () => Result, onInvalid: () => Result) => Result;
}>;

const statementPartitionJudgment = <Token>(
  boundary: ValidStatementBoundaryJudgment<Token>,
  suffix: readonly Token[],
): StatementPartitionJudgment => {
  const statementLength = boundary.statement.length;
  const valid = boundary.kind === 'end_of_input'
    ? statementLength === suffix.length || statementLength === 0
    : statementLength < suffix.length
      && Object.is(suffix[statementLength], boundary.terminator)
      && samePartition(boundary.remaining, suffix.slice(statementSequenceCursor(statementLength).advancePastCurrent().index))
      && boundary.remaining.length + statementLength + 1 === suffix.length;
  return valid
    ? Object.freeze({ kind: 'valid_partition', continueWith: <Result>(onValid: () => Result, _onInvalid: () => Result): Result => onValid() })
    : Object.freeze({ kind: 'invalid_partition', continueWith: <Result>(_onValid: () => Result, onInvalid: () => Result): Result => onInvalid() });
};

const parseAt = <Token, Statement>(
  contract: StatementSequenceContract<Token, Statement>,
  index: number,
  output: readonly Statement[],
): StatementSequenceResolution<Statement> => {
  if (index >= contract.tokens.length) return { kind: 'complete', statements: output, nextIndex: index };
  if (contract.isIgnorable(contract.tokens[index])) return parseAt(contract, statementSequenceCursor(index).advancePastCurrent().index, output);

  const suffix = contract.tokens.slice(index);
  const boundary = contract.findBoundary(suffix);
  if (boundary.kind === 'malformed') {
    const relativeIndex = boundary.location.kind === 'end_of_source'
      ? suffix.length
      : suffix.indexOf(boundary.location.evidence);
    const evidenceIndex = relativeIndex < 0 ? index : index + relativeIndex;
    const expected = boundary.expected === undefined ? '' : `; expected ${boundary.expected}`;
    return {
      kind: 'malformed',
      statements: output,
      index: evidenceIndex,
      diagnostic: `Malformed statement boundary (${boundary.reason})${expected}; received ${boundary.actual}`,
    };
  }

  const statementLength = boundary.statement.length;
  const partitionJudgment = statementPartitionJudgment(boundary, suffix);
  const invalidPartition = (): StatementSequenceResolution<Statement> => ({ kind: 'contract_violation', statements: output, index, reason: 'invalid_boundary' });
  const continueFromPartition = (): StatementSequenceResolution<Statement> => {
    const structured = contract.resolveStructured(contract.tokens, index, index + statementLength);
    switch (structured.kind) {
      case 'malformed':
        return { kind: 'malformed', statements: output, index, diagnostic: structured.diagnostic };
      case 'contract_violation':
        return { kind: 'contract_violation', statements: output, index, reason: structured.reason === 'invalid_resolution' ? 'invalid_structured_resolution' : 'unresolved_structured_statement' };
      case 'resolved': {
        const resolved = structured.value;
        if (resolved.nextIndex > contract.tokens.length) {
          return { kind: 'contract_violation', statements: output, index, reason: 'invalid_structured_resolution' };
        }
        return statementSequenceProgress(index, resolved.nextIndex).continueWith(
          nextIndex => parseAt(contract, nextIndex, [...output, resolved.statement]),
          () => ({ kind: 'contract_violation' as const, statements: output, index, reason: 'non_progressing_structured_statement' as const }),
        );
      }
      case 'not_applicable': {
        const nextIndex = statementSequenceCursor(index).advanceBy(statementLength + (boundary.kind === 'terminator' ? 1 : 0)).index;
        return statementSequenceProgress(index, nextIndex).continueWith(
          next => parseAt(contract, next, [...output, contract.resolveSimple(boundary.statement)]),
          () => ({ kind: 'contract_violation' as const, statements: output, index, reason: 'non_progressing_simple_statement' as const }),
        );
      }
    }
  };
  return partitionJudgment.continueWith(continueFromPartition, invalidPartition);

};

export const scannerStatementSequenceAlgebra: ScannerStatementSequenceInterface = Object.freeze({
  parse: <Token, Statement>(contract: StatementSequenceContract<Token, Statement>): StatementSequenceResolution<Statement> => parseAt(contract, 0, []),
});
