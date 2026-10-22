import { scannerExpressionCandidateAlgebra, type ExpressionCandidateAttempt, type ExpressionCandidateResolution } from './scannerExpressionCandidateAlgebra';
import type {
  ExpressionStructure,
  ExpressionStructureJudgment,
  ExpressionStructureJudgmentInterface,
  ExpressionStructureJudgmentRequest,
  ExpressionStructureTerminalEvidence,
} from './scannerExpressionJudgmentInterface';

export type {
  ExpressionEvidenceLocation,
  ExpressionStructure,
  ExpressionStructureJudgment,
  ExpressionStructureJudgmentInterface,
  ExpressionStructureJudgmentRequest,
  ExpressionStructureTerminalEvidence,
  ExpressionStructureContractViolationReason,
  ExpressionStructureResolution,
} from './scannerExpressionJudgmentInterface';

/**
 * Closes the candidate algebra's result into the public judgment contract.
 * This is the only place that constructs arbitration outcomes and provenance.
 */
const judgeExpressionStructureResolution = <Token, BinaryOperator, UnaryOperator, Id extends string, Value>(
  resolution: ExpressionCandidateResolution<Id, Value>,
  sourceEvidence: readonly Token[],
  selectedStructure: ExpressionStructure<Token, BinaryOperator, UnaryOperator> | undefined,
): ExpressionStructureJudgment<Token, BinaryOperator, UnaryOperator> => {
  switch (resolution.kind) {
    case 'contract_violation':
      return { kind: 'contract_violation', reason: resolution.reason };
    case 'terminal':
      return { kind: 'contract_violation', reason: 'terminal_candidate_without_judgment', attempts: resolution.attempts };
    case 'not_found':
      return {
        kind: 'not_structured',
        rejectedRules: resolution.attempts.map(attempt => attempt.candidate),
        attempts: resolution.attempts,
      };
    case 'resolved':
      return selectedStructure === undefined
        ? { kind: 'contract_violation', reason: 'selected_candidate_without_structure' }
        : {
            kind: 'structured',
            structure: selectedStructure,
            provenance: {
              ruleId: resolution.candidate,
              candidatePriority: resolution.priority,
              sourceEvidence,
              attempts: resolution.attempts,
            },
            attempts: resolution.attempts,
          };
  }
};

/** Concrete upstream implementation of the interface consumed by scanner wiring. */
const resolve = <Token, BinaryOperator, UnaryOperator, Id extends string, Value>(
  request: ExpressionStructureJudgmentRequest<Token, BinaryOperator, UnaryOperator, Id, Value>,
): ExpressionStructureJudgment<Token, BinaryOperator, UnaryOperator> => {
  const { contract, sourceEvidence, selectStructure, selectTerminal } = request;
  const resolution = scannerExpressionCandidateAlgebra.resolveFirst(contract);
  if (resolution.kind === 'terminal') {
    const terminalEvidence = selectTerminal?.(resolution.value);
    if (terminalEvidence === undefined) {
      return { kind: 'contract_violation', reason: 'terminal_candidate_without_judgment', attempts: resolution.attempts };
    }
    switch (terminalEvidence.kind) {
      case 'malformed_source':
        return { kind: 'malformed_source', ruleId: resolution.candidate, location: terminalEvidence.location, expected: terminalEvidence.expected, actual: terminalEvidence.actual, attempts: resolution.attempts };
      case 'contract_violation':
        return { kind: 'contract_violation', reason: terminalEvidence.reason, attempts: resolution.attempts };
    }
  }
  const selectedStructure = resolution.kind === 'resolved'
    ? selectStructure(resolution.value)
    : undefined;
  return judgeExpressionStructureResolution(resolution, sourceEvidence, selectedStructure);
};

export const expressionStructureJudgmentAuthority: ExpressionStructureJudgmentInterface = Object.freeze({ resolve });

