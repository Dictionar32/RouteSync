import { describe, expect, it } from 'vitest';
import { scannerAstOperatorEvidenceAlgebra, validateScannerAstOperatorVocabulary } from '../scannerAstOperatorEvidenceAlgebra';
import {
  SCANNER_AST_OPERATOR,
  SCANNER_AST_OPERATOR_EVIDENCE_FOUND,
  SCANNER_AST_OPERATOR_EVIDENCE_MALFORMED,
  SCANNER_AST_OPERATOR_EVIDENCE_NOT_FOUND,
  SCANNER_AST_OPERATOR_EVIDENCE_CONTRACT_VIOLATION,
} from '../scannerAstOperatorEvidenceInterface';

describe('typed AST operator evidence contract phase 1459', () => {
  it('returns a complete partition for a top-level match arm arrow', () => {
    expect(scannerAstOperatorEvidenceAlgebra.resolve({
      tokens: ['condition', '=>', 'value'], operator: SCANNER_AST_OPERATOR.fatArrow, tokenValue: token => token,
    })).toEqual({
      kind: SCANNER_AST_OPERATOR_EVIDENCE_FOUND,
      operator: SCANNER_AST_OPERATOR.fatArrow,
      occurrence: { before: ['condition'], token: '=>', after: ['value'] },
    });
  });

  it('does not select an operator nested inside delimiters', () => {
    expect(scannerAstOperatorEvidenceAlgebra.resolve({
      tokens: ['call', '(', 'a', '=>', 'b', ')'], operator: SCANNER_AST_OPERATOR.fatArrow, tokenValue: token => token,
    })).toEqual({ kind: SCANNER_AST_OPERATOR_EVIDENCE_NOT_FOUND, operator: SCANNER_AST_OPERATOR.fatArrow });
  });

  it('preserves malformed delimiter evidence', () => {
    expect(scannerAstOperatorEvidenceAlgebra.resolve({
      tokens: ['(', 'value', 'as'], operator: SCANNER_AST_OPERATOR.as, tokenValue: token => token,
    })).toMatchObject({ kind: SCANNER_AST_OPERATOR_EVIDENCE_MALFORMED, expected: ')', actual: '<end-of-input>' });
  });

  it('rejects duplicate semantic operator identity in a vocabulary', () => {
    expect(validateScannerAstOperatorVocabulary([
      SCANNER_AST_OPERATOR.as,
      SCANNER_AST_OPERATOR.as,
    ])).toEqual({ kind: SCANNER_AST_OPERATOR_EVIDENCE_CONTRACT_VIOLATION, reason: expect.any(Symbol) });
  });
});
