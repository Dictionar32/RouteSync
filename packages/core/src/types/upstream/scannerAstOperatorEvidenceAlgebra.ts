/** Semantic operator evidence algebra. It binds typed operator identity to structural source evidence. */
import { scannerTokenStructureInterface } from './scannerTokenStructureAlgebra';
import {
  SCANNER_AST_OPERATOR_EVIDENCE_CONTRACT_VIOLATION,
  SCANNER_AST_OPERATOR_EVIDENCE_FOUND,
  SCANNER_AST_OPERATOR_EVIDENCE_MALFORMED,
  SCANNER_AST_OPERATOR_EVIDENCE_NOT_FOUND,
  SCANNER_AST_OPERATOR_EMPTY_SPELLING,
  SCANNER_AST_OPERATOR_DUPLICATE_IDENTITY,
  type ScannerAstOperatorEvidenceInterface,
  type ScannerAstOperatorEvidenceJudgment,
  type ScannerAstOperatorEvidenceQuery,
} from './scannerAstOperatorEvidenceInterface';

const resolve = <Token>(query: ScannerAstOperatorEvidenceQuery<Token>): ScannerAstOperatorEvidenceJudgment<Token> => {
  if (query.operator.spelling.length === 0) {
    return { kind: SCANNER_AST_OPERATOR_EVIDENCE_CONTRACT_VIOLATION, reason: SCANNER_AST_OPERATOR_EMPTY_SPELLING };
  }
  const structure = scannerTokenStructureInterface.locateTopLevel({
    tokens: query.tokens,
    target: query.operator.spelling,
    tokenValue: query.tokenValue,
  });
  switch (structure.kind) {
    case 'not_found':
      return { kind: SCANNER_AST_OPERATOR_EVIDENCE_NOT_FOUND, operator: query.operator };
    case 'malformed':
      return {
        kind: SCANNER_AST_OPERATOR_EVIDENCE_MALFORMED,
        operator: query.operator,
        location: structure.location,
        ...(structure.expected === undefined ? {} : { expected: structure.expected }),
        actual: structure.actual,
      };
    case 'found':
      return { kind: SCANNER_AST_OPERATOR_EVIDENCE_FOUND, operator: query.operator, occurrence: structure.occurrence };
  }
};

/** Contract validation for a closed vocabulary; duplicate identities are rejected before use. */
export const validateScannerAstOperatorVocabulary = <Identity extends symbol>(operators: readonly Readonly<{ identity: Identity; spelling: string }>[]) => {
  const identities = new Set<Identity>();
  for (const operator of operators) {
    if (operator.spelling.length === 0) return { kind: SCANNER_AST_OPERATOR_EVIDENCE_CONTRACT_VIOLATION, reason: SCANNER_AST_OPERATOR_EMPTY_SPELLING } as const;
    if (identities.has(operator.identity)) return { kind: SCANNER_AST_OPERATOR_EVIDENCE_CONTRACT_VIOLATION, reason: SCANNER_AST_OPERATOR_DUPLICATE_IDENTITY } as const;
    identities.add(operator.identity);
  }
  return { kind: SCANNER_AST_OPERATOR_EVIDENCE_FOUND } as const;
};

export const scannerAstOperatorEvidenceAlgebra: ScannerAstOperatorEvidenceInterface = Object.freeze({ resolve });
