import { describe, expect, it } from 'vitest';
import { scannerSwitchStatementContractAlgebra } from '../scannerSwitchStatementAlgebra';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

const resolve = (tokens: readonly string[]) => scannerSwitchStatementContractAlgebra.resolve({
  tokens,
  tokenValue: token => token,
  structure: scannerTokenStructureInterface,
});

describe('scanner switch statement contract phase 1469', () => {
  it('partitions case labels, bodies, fall-through evidence and default', () => {
    const judgment = resolve(['switch', '(', '$x', ')', '{', 'case', '1', ':', '$a', '=', '1', ';', 'case', '2', ',', '3', ':', 'break', ';', 'default', ':', '$b', ';', '}']);
    expect(judgment.kind).toBe('resolved');
    if (judgment.kind !== 'resolved') return;
    expect(judgment.evidence.subject).toEqual(['$x']);
    expect(judgment.evidence.cases.map(item => item.kind)).toEqual(['case', 'case', 'default']);
    expect(judgment.evidence.cases[1]?.labels).toEqual([['2'], ['3']]);
    expect(judgment.evidence.cases[1]?.hasBreak).toBe(true);
    expect(judgment.evidence.cases[2]?.body).toEqual(['$b', ';']);
  });

  it('returns not-applicable for a non-switch source', () => {
    expect(resolve(['while', '(', '$x', ')', '{', '}'])).toEqual({ kind: 'not_applicable' });
  });

  it('rejects an empty subject', () => {
    expect(resolve(['switch', '(', ')', '{', '}'])).toMatchObject({ kind: 'malformed', reason: 'expected_subject' });
  });

  it('rejects a missing case separator', () => {
    expect(resolve(['switch', '(', '$x', ')', '{', 'case', '1', '$a', ';', '}'])).toMatchObject({ kind: 'malformed', reason: 'missing_case_separator' });
  });

  it('rejects duplicate default labels', () => {
    expect(resolve(['switch', '(', '$x', ')', '{', 'default', ':', '$a', ';', 'default', ':', '$b', ';', '}'])).toMatchObject({ kind: 'malformed', reason: 'duplicate_default' });
  });
});
