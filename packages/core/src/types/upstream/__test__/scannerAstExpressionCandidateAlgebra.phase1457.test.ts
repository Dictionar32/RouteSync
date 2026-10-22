import { describe, expect, it } from 'vitest';
import { scannerAstExpressionCandidateContractAlgebra } from '../scannerAstExpressionCandidateAlgebra';
import { SCANNER_EXPRESSION_CANDIDATE as CANDIDATE } from '../scannerAstExpressionCandidateInterface';

type Token = Readonly<{ value: string; type: string }>;
const token = (value: string, type = 'SYMBOL'): Token => ({ value, type });
const resolve = (values: readonly Token[]) => scannerAstExpressionCandidateContractAlgebra.resolve({
  tokens: values,
  tokenValue: item => item.value,
  tokenKind: item => item.type,
});
const candidateIds = (values: readonly Token[]) => {
  const judgment = resolve(values);
  return judgment.kind === 'resolved' ? judgment.candidates.map(candidate => candidate.id) : [];
};

describe('scanner expression candidate algebra phase 1457', () => {
  it('returns not-applicable for empty evidence', () => {
    expect(resolve([])).toEqual({ kind: 'not_applicable' });
  });
  it('recognizes cast from its leading token evidence', () => {
    expect(candidateIds([token('('), token('int', 'IDENTIFIER'), token(')'), token('$x', 'VARIABLE')])).toContain(CANDIDATE.cast);
  });
  it('does not select instanceof when the operator is nested', () => {
    expect(candidateIds([token('('), token('$x', 'VARIABLE'), token('instanceof'), token('Foo', 'IDENTIFIER'), token(')')])).not.toContain(CANDIDATE.instanceof);
  });
  it('selects top-level instanceof and carries its partition evidence upstream', () => {
    const judgment = resolve([token('$x', 'VARIABLE'), token('instanceof'), token('Foo', 'IDENTIFIER')]);
    expect(candidateIds([token('$x', 'VARIABLE'), token('instanceof'), token('Foo', 'IDENTIFIER')])).toContain(CANDIDATE.instanceof);
    if (judgment.kind === 'resolved') {
      const candidate = judgment.candidates.find(entry => entry.id === CANDIDATE.instanceof);
      expect(candidate?.operatorEvidence?.[0]).toEqual({ before: [token('$x', 'VARIABLE')], token: token('instanceof'), after: [token('Foo', 'IDENTIFIER')] });
    }
  });
  it('retains the structural fallback candidate', () => {
    expect(candidateIds([token('$value', 'VARIABLE')])).toContain(CANDIDATE.compound);
  });
  it('recognizes assignment candidates only at top level', () => {
    expect(candidateIds([token('$x', 'VARIABLE'), token('='), token('1', 'NUMBER')])).toContain(CANDIDATE.assignment);
    expect(candidateIds([token('('), token('$x', 'VARIABLE'), token('='), token('1', 'NUMBER'), token(')')])).not.toContain(CANDIDATE.assignment);
  });
});
