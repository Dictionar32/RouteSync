import { describe, expect, it } from 'vitest';
import { scannerStatementSequenceAlgebra, type StatementSequenceContract } from '../scannerStatementSequenceAlgebra';
import type { StatementBoundaryJudgment } from '../scannerStatementBoundaryInterface';

const boundary = (tokens: readonly string[]): StatementBoundaryJudgment<string> => ({ kind: 'end_of_input', statement: tokens });
const base = (tokens: readonly string[]): StatementSequenceContract<string, string> => ({
  tokens,
  isIgnorable: token => token === ';',
  findBoundary: source => boundary(source),
  resolveStructured: () => ({ kind: 'not_applicable' as const }),
  resolveSimple: statement => statement.join(''),
});

describe('scannerStatementSequenceAlgebra phase 1419', () => {
  it('returns a complete result with the full sequence', () => {
    expect(scannerStatementSequenceAlgebra.parse(base(['a', '+', 'b']))).toEqual({ kind: 'complete', statements: ['a+b'], nextIndex: 3 });
  });
  it('consumes partition judgments and advances past the terminator', () => {
    const contract: StatementSequenceContract<string, string> = {
      ...base(['a', ';', 'b']),
      findBoundary: source => {
        const index = source.indexOf(';');
        return index < 0
          ? { kind: 'end_of_input', statement: source }
          : { kind: 'terminator', statement: source.slice(0, index), terminator: source[index], remaining: source.slice(index + 1) };
      },
    };
    expect(scannerStatementSequenceAlgebra.parse(contract)).toEqual({ kind: 'complete', statements: ['a', 'b'], nextIndex: 3 });
  });

  it('rejects a boundary whose returned partitions do not cover the source suffix', () => {
    const contract: StatementSequenceContract<string, string> = {
      ...base(['a', ';', 'b']),
      findBoundary: source => ({ kind: 'terminator', statement: source.slice(0, 1), terminator: ';', remaining: source.slice(2, 2) }),
    };
    expect(scannerStatementSequenceAlgebra.parse(contract)).toEqual({ kind: 'contract_violation', statements: [], index: 0, reason: 'invalid_boundary' });
  });

  it('does not return a successful partial prefix when the boundary cannot advance', () => {
    const contract = { ...base(['a']), findBoundary: (source: readonly string[]) => ({ kind: 'end_of_input' as const, statement: source.slice(0, 0) }) };
    expect(scannerStatementSequenceAlgebra.parse(contract)).toEqual({ kind: 'contract_violation', statements: [], index: 0, reason: 'non_progressing_simple_statement' });
  });
  it('does not continue when the statement boundary is malformed', () => {
    const contract = {
      ...base(['a', ')', ';']),
      findBoundary: (source: readonly string[]) => ({ kind: 'malformed' as const, location: { kind: 'token' as const, evidence: source[1] ?? ')' }, actual: ')', reason: 'unexpected_closer' as const }),
    };
    expect(scannerStatementSequenceAlgebra.parse(contract)).toEqual({ kind: 'malformed', statements: [], index: 1, diagnostic: 'Malformed statement boundary (unexpected_closer); received )' });
  });

  it('rejects a structured resolver that violates cursor progress', () => {
    const contract: StatementSequenceContract<string, string> = {
      ...base(['if', 'x']),
      findBoundary: source => boundary(source),
      resolveStructured: () => ({ kind: 'resolved' as const, value: { statement: 'if', nextIndex: 0 } }),
    };
    expect(scannerStatementSequenceAlgebra.parse(contract)).toEqual({ kind: 'contract_violation', statements: [], index: 0, reason: 'non_progressing_structured_statement' });
  });

  it('rejects a structured resolver that advances beyond the token source', () => {
    const contract: StatementSequenceContract<string, string> = {
      ...base(['if', 'x']),
      resolveStructured: () => ({ kind: 'resolved' as const, value: { statement: 'if', nextIndex: 3 } }),
    };
    expect(scannerStatementSequenceAlgebra.parse(contract)).toEqual({ kind: 'contract_violation', statements: [], index: 0, reason: 'invalid_structured_resolution' });
  });

  it('does not fall through to simple parsing when a structured statement is malformed', () => {
    let simpleCalls = 0;
    const contract: StatementSequenceContract<string, string> = {
      ...base(['if', '(', ')']),
      resolveStructured: () => ({ kind: 'malformed', diagnostic: 'missing condition body' }),
      resolveSimple: statement => { simpleCalls += 1; return statement.join(''); },
    };
    expect(scannerStatementSequenceAlgebra.parse(contract)).toEqual({ kind: 'malformed', statements: [], index: 0, diagnostic: 'missing condition body' });
    expect(simpleCalls).toBe(0);
  });

  it('treats a recognized structured control without a matching rule as a contract violation', () => {
    const contract: StatementSequenceContract<string, string> = {
      ...base(['if', 'x']),
      resolveStructured: () => ({ kind: 'contract_violation', reason: 'structured_rule_unresolved' }),
    };
    expect(scannerStatementSequenceAlgebra.parse(contract)).toEqual({ kind: 'contract_violation', statements: [], index: 0, reason: 'unresolved_structured_statement' });
  });
});
