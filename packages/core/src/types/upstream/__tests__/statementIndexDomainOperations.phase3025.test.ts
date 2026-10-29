import { describe, expect, it } from 'vitest';
import { statementIndexOperations } from '../valueObjects';

describe('statement index domain operations — phase 3025', () => {
  it('owns statement succession instead of requiring consumer-side numeric arithmetic', () => {
    const first = statementIndexOperations.first;
    const second = statementIndexOperations.successor(first);
    const third = statementIndexOperations.successor(second);

    expect(first).toEqual({ kind: 'statement_index', ordinal: { kind: 'number_value', value: 0 } });
    expect(second.ordinal.value).toBe(1);
    expect(third.ordinal.value).toBe(2);
  });

  it('returns an explicit domain ordering judgment', () => {
    const first = statementIndexOperations.first;
    const second = statementIndexOperations.successor(first);

    expect(statementIndexOperations.compare(first, first)).toEqual({ kind: 'same_statement_index' });
    expect(statementIndexOperations.compare(first, second)).toEqual({ kind: 'earlier_statement_index' });
    expect(statementIndexOperations.compare(second, first)).toEqual({ kind: 'later_statement_index' });
    expect(statementIndexOperations.same(first, first)).toBe(true);
    expect(statementIndexOperations.same(first, second)).toBe(false);
  });
});
