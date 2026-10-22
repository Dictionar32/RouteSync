/**
 * Generic cursor/sequence algebra for scanner statement parsing.
 * It owns cursor progress and refuses to report a complete parse when a
 * boundary is malformed or a resolver violates the sequence contract.
 */
import { relationAdvanceIndex, relationGate } from '../../semantic/relations/relationalSequence';
import type { ScannerStatementSequenceInterface, StatementSequenceContract, StatementSequenceResolution } from './scannerStatementSequenceInterface';

// Preserve the historical type exports for existing test and package consumers.
export type { StructuredStatementResult, StructuredStatementJudgment, StatementSequenceContract, StatementSequenceResolution } from './scannerStatementSequenceInterface';
export type ScannerStatementSequenceAlgebra = ScannerStatementSequenceInterface;

const samePartition = <Token>(left: readonly Token[], right: readonly Token[]): boolean =>
  left.length === right.length && left.every((token, index) => Object.is(token, right[index]));

const parseAt = <Token, Statement>(
  contract: StatementSequenceContract<Token, Statement>,
  index: number,
  output: readonly Statement[],
): StatementSequenceResolution<Statement> => {
  if (index >= contract.tokens.length) return { kind: 'complete', statements: output, nextIndex: index };
  if (contract.isIgnorable(contract.tokens[index])) return parseAt(contract, relationAdvanceIndex(index, 1), output);

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
  const partitionIsValid = boundary.kind === 'end_of_input'
    ? statementLength === suffix.length
    : statementLength < suffix.length
      && Object.is(suffix[statementLength], boundary.terminator)
      && samePartition(boundary.remaining, suffix.slice(relationAdvanceIndex(statementLength, 1)))
      && boundary.remaining.length + statementLength + 1 === suffix.length;
  if (!partitionIsValid) return { kind: 'contract_violation', statements: output, index, reason: 'invalid_boundary' };

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
      return relationGate(resolved.nextIndex > index,
        () => parseAt(contract, resolved.nextIndex, [...output, resolved.statement]),
        () => ({ kind: 'contract_violation' as const, statements: output, index, reason: 'non_progressing_structured_statement' as const }));
    }
    case 'not_applicable': {
      const nextIndex = index + statementLength + (boundary.kind === 'terminator' ? 1 : 0);
      return relationGate(statementLength > 0 && nextIndex > index,
        () => parseAt(contract, nextIndex, [...output, contract.resolveSimple(boundary.statement)]),
        () => ({ kind: 'contract_violation' as const, statements: output, index, reason: 'non_progressing_simple_statement' as const }));
    }
  }
};

export const scannerStatementSequenceAlgebra: ScannerStatementSequenceInterface = Object.freeze({
  parse: <Token, Statement>(contract: StatementSequenceContract<Token, Statement>): StatementSequenceResolution<Statement> => parseAt(contract, 0, []),
});
