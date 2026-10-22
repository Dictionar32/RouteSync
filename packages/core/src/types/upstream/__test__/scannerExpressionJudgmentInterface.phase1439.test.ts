import { describe, expect, it } from 'vitest';
import { expressionStructureJudgmentAuthority } from '../scannerExpressionStructure';

describe('expression structure judgment interface phase 1439', () => {
  it('closes selected candidate evidence into a judgment with upstream provenance', () => {
    const selected = { kind: 'unary', operator: 'not', operand: ['enabled'] } as const;
    const judgment = expressionStructureJudgmentAuthority.resolve({
      contract: {
        candidates: [{ id: 'unary', priority: 10, resolve: () => ({ kind: 'some' as const, value: selected }) }],
        isResolved: value => value.kind === 'some',
      },
      sourceEvidence: ['!', 'enabled'],
      selectStructure: value => value.kind === 'some' ? value.value : undefined,
    });
    expect(judgment.kind).toBe('structured');
    if (judgment.kind === 'structured') {
      expect(judgment.provenance.ruleId).toBe('unary');
      expect(judgment.attempts).toEqual([{ candidate: 'unary', priority: 10, outcome: 'selected' }]);
    }
  });

  it('closes provider terminal evidence into malformed judgment without provider-supplied rule identity', () => {
    const sourceToken = ')' as const;
    type CandidateValue =
      | Readonly<{ kind: 'some'; value: string }>
      | Readonly<{ kind: 'malformed_source'; location: { kind: 'token'; evidence: typeof sourceToken }; expected: string; actual: string }>;
    const malformedEvidence: CandidateValue = { kind: 'malformed_source', location: { kind: 'token', evidence: sourceToken }, expected: ']', actual: ')' };
    const judgment = expressionStructureJudgmentAuthority.resolve({
      contract: {
        candidates: [{ id: 'delimiter', priority: 10, resolve: (): CandidateValue => malformedEvidence }],
        isResolved: (value: CandidateValue) => value.kind === 'some',
        isTerminal: (value: CandidateValue) => value.kind === 'malformed_source',
      },
      sourceEvidence: [sourceToken],
      selectStructure: (value: CandidateValue) => value.kind === 'some' ? { kind: 'unary' as const, operator: 'not', operand: [value.value] } : undefined,
      selectTerminal: (value: CandidateValue) => value.kind === 'malformed_source' ? value : undefined,
    });
    expect(judgment).toEqual({
      kind: 'malformed_source',
      ruleId: 'delimiter',
      location: { kind: 'token', evidence: sourceToken },
      expected: ']',
      actual: ')',
      attempts: [{ candidate: 'delimiter', priority: 10, outcome: 'terminal' }],
    });
  });
});
