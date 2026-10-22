import { describe, expect, it } from 'vitest';
import { SCANNER_EXPRESSION_STRUCTURE_PRIORITY, scannerExpressionCandidateAlgebra, scannerExpressionStructurePriority } from '../scannerExpressionCandidateAlgebra';

describe('scannerExpressionCandidateAlgebra phase 1424', () => {
  it('selects by explicit semantic priority and does not evaluate later candidates', () => {
    const evaluated: string[] = [];
    const result = scannerExpressionCandidateAlgebra.resolveFirst({
      candidates: [
        { id: 'first', priority: 10, resolve: () => { evaluated.push('first'); return { kind: 'none' as const }; } },
        { id: 'second', priority: 20, resolve: () => { evaluated.push('second'); return { kind: 'some' as const, value: 42 }; } },
        { id: 'third', priority: 30, resolve: () => { evaluated.push('third'); return { kind: 'some' as const, value: 99 }; } },
      ],
      isResolved: value => value.kind === 'some',
    });
    expect(result).toEqual({ kind: 'resolved', candidate: 'second', priority: 20, value: { kind: 'some', value: 42 }, attempts: [{ candidate: 'first', priority: 10, outcome: 'rejected' }, { candidate: 'second', priority: 20, outcome: 'selected' }] });
    expect(evaluated).toEqual(['first', 'second']);
  });


  it('stops arbitration on terminal source evidence without treating it as a selected structure', () => {
    const evaluated: string[] = [];
    const result = scannerExpressionCandidateAlgebra.resolveFirst({
      candidates: [
        { id: 'conditional', priority: 10, resolve: () => ({ kind: 'malformed_source' as const, index: 2, expected: ':', actual: '<end-of-expression>' }) },
        { id: 'operator', priority: 20, resolve: () => { evaluated.push('operator'); return { kind: 'some' as const, value: 'binary' }; } },
      ],
      isResolved: value => value.kind === 'some',
      isTerminal: value => value.kind === 'malformed_source',
    });
    expect(result).toEqual({
      kind: 'terminal', candidate: 'conditional', priority: 10,
      value: { kind: 'malformed_source', index: 2, expected: ':', actual: '<end-of-expression>' },
      attempts: [{ candidate: 'conditional', priority: 10, outcome: 'terminal' }],
    });
    expect(evaluated).toEqual([]);
  });

  it('reports not_found when no candidate resolves', () => {
    expect(scannerExpressionCandidateAlgebra.resolveFirst({
      candidates: [{ id: 'empty', priority: 10, resolve: () => undefined }],
      isResolved: value => value !== undefined,
    })).toEqual({ kind: 'not_found', attempts: [{ candidate: 'empty', priority: 10, outcome: 'rejected' }] });
  });

  it('rejects duplicate candidate identities before evaluating any candidate', () => {
    let evaluated = false;
    expect(scannerExpressionCandidateAlgebra.resolveFirst({
      candidates: [
        { id: 'duplicate', priority: 10, resolve: () => { evaluated = true; return true; } },
        { id: 'duplicate', priority: 10, resolve: () => true },
      ],
      isResolved: value => value,
    })).toEqual({ kind: 'contract_violation', reason: 'duplicate_candidate_id' });
    expect(evaluated).toBe(false);
  });

  it('rejects duplicate priorities before evaluating any candidate', () => {
    let evaluated = false;
    expect(scannerExpressionCandidateAlgebra.resolveFirst({
      candidates: [
        { id: 'left', priority: 5, resolve: () => { evaluated = true; return true; } },
        { id: 'right', priority: 5, resolve: () => true },
      ],
      isResolved: value => value,
    })).toEqual({ kind: 'contract_violation', reason: 'duplicate_priority' });
    expect(evaluated).toBe(false);
  });

  it('rejects invalid priorities before evaluating candidates', () => {
    let evaluated = false;
    expect(scannerExpressionCandidateAlgebra.resolveFirst({
      candidates: [{ id: 'invalid', priority: -1, resolve: () => { evaluated = true; return true; } }],
      isResolved: value => value,
    })).toEqual({ kind: 'contract_violation', reason: 'invalid_priority' });
    expect(evaluated).toBe(false);
  });

  it('returns a resolved candidate identity with the original value', () => {
    const value = Object.freeze({ kind: 'some' as const, value: 'ast' });
    expect(scannerExpressionCandidateAlgebra.resolveFirst({
      candidates: [{ id: 'ast-expression', priority: 10, resolve: () => value }],
      isResolved: candidate => candidate.kind === 'some',
    })).toEqual({ kind: 'resolved', candidate: 'ast-expression', priority: 10, value, attempts: [{ candidate: 'ast-expression', priority: 10, outcome: 'selected' }] });
  });
});


describe('upstream expression candidate priority policy', () => {
  it('owns the canonical structural ordering outside scanner runtime', () => {
    expect(SCANNER_EXPRESSION_STRUCTURE_PRIORITY).toEqual({
      'short-ternary': 10, ternary: 20, 'array-access': 30, call: 40, 'root-operator': 50, unary: 60,
    });
    expect(scannerExpressionStructurePriority('root-operator')).toBe(50);
  });
});
