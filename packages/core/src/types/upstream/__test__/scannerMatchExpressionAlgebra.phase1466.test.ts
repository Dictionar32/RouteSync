import { describe, expect, it } from 'vitest';
import { scannerMatchExpressionAlgebra } from '../scannerMatchExpressionAlgebra';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';
import { SCANNER_MATCH_MALFORMED, SCANNER_MATCH_RESOLVED, SCANNER_MATCH_ARM_CONDITIONAL, SCANNER_MATCH_ARM_DEFAULT } from '../scannerMatchExpressionInterface';

type Token = Readonly<{ value: string; id: number }>;
const tokenize = (source: string): readonly Token[] => Object.freeze(source.match(/=>|\$[a-z]+|[A-Za-z_]+|[{}(),]|\S/g)?.map((value, id) => Object.freeze({ value, id })) ?? []);
const query = (source: string) => {
  const tokens = tokenize(source);
  return {
    tokens,
    tokenValue: (token: Token) => token.value,
    sameToken: (left: Token, right: Token) => left.id === right.id,
    structure: scannerTokenStructureInterface,
  };
};

describe('scannerMatchExpressionAlgebra phase 1466', () => {
  it('resolves source-backed conditional and default arms through the shared structure interface', () => {
    const judgment = scannerMatchExpressionAlgebra.resolve(query('match ($x) { 1, 2 => foo($a, $b), default => null, }'));
    expect(judgment.kind).toBe(SCANNER_MATCH_RESOLVED);
    if (judgment.kind !== SCANNER_MATCH_RESOLVED) return;
    expect(judgment.evidence.subject.map(token => token.value)).toEqual(['$x']);
    expect(judgment.evidence.arms.map(arm => arm.kind)).toEqual([SCANNER_MATCH_ARM_CONDITIONAL, SCANNER_MATCH_ARM_DEFAULT]);
    const conditional = judgment.evidence.arms[0];
    expect(conditional?.kind === SCANNER_MATCH_ARM_CONDITIONAL ? conditional.conditions.map(part => part.map(token => token.value)) : []).toEqual([['1'], ['2']]);
    expect(judgment.evidence.arms[1]?.kind).toBe(SCANNER_MATCH_ARM_DEFAULT);
    expect(judgment.evidence.remaining).toEqual([]);
  });

  it('returns a closed malformed judgment for an empty condition', () => {
    const judgment = scannerMatchExpressionAlgebra.resolve(query('match ($x) { 1, => foo() }'));
    expect(judgment.kind).toBe(SCANNER_MATCH_MALFORMED);
    if (judgment.kind === SCANNER_MATCH_MALFORMED) expect(judgment.expected).toBe('non-empty condition');
  });

  it('does not claim source syntax that is not a match expression', () => {
    expect(scannerMatchExpressionAlgebra.resolve(query('$x + 1')).kind).toBe('not_applicable');
  });
});
