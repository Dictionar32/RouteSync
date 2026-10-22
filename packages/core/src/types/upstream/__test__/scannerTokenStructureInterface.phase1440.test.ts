import { describe, expect, it } from 'vitest';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

describe('scannerTokenStructureInterface phase 1440', () => {
  const query = (tokens: readonly string[]) => ({ tokens, tokenValue: (token: string) => token });

  it('returns top-level operator partitions rather than a cursor', () => {
    expect(scannerTokenStructureInterface.locateTopLevel({ ...query(['$a', '+', '$b']), target: '+' })).toEqual({
      kind: 'found',
      occurrence: { before: ['$a'], token: '+', after: ['$b'] },
    });
  });

  it('returns a typed delimiter partition for a leading call delimiter', () => {
    expect(scannerTokenStructureInterface.matchLeadingDelimiter(query(['(', '$a', ',', '$b', ')']))).toEqual({
      kind: 'matched',
      evidence: { opening: '(', contents: ['$a', ',', '$b'], closing: ')', prefix: [], suffix: [] },
    });
  });

  it('returns a typed delimiter partition for a trailing array delimiter', () => {
    expect(scannerTokenStructureInterface.matchTrailingDelimiter(query(['$items', '[', '$key', ']']))).toEqual({
      kind: 'matched',
      evidence: { opening: '[', contents: ['$key'], closing: ']', prefix: ['$items'], suffix: [] },
    });
  });

  it('partitions top-level separators while preserving nested commas and empty segments', () => {
    expect(scannerTokenStructureInterface.partitionTopLevel({ ...query(['$a', ',', 'call', '(', '$x', ',', '$y', ')', ',', '$b', ',']), separator: ',' })).toEqual({
      kind: 'partitioned',
      parts: [['$a'], ['call', '(', '$x', ',', '$y', ')'], ['$b'], []],
    });
  });

  it('returns malformed evidence instead of partitioning unbalanced delimiters', () => {
    expect(scannerTokenStructureInterface.partitionTopLevel({ ...query(['$a', ',', 'call', '(', '$x']), separator: ',' })).toMatchObject({
      kind: 'malformed',
      expected: ')',
      actual: '<end-of-input>',
    });
  });

  it('preserves malformed delimiter evidence without exposing a numeric cursor', () => {
    expect(scannerTokenStructureInterface.matchLeadingDelimiter(query(['(', '$value', ']']))).toEqual({
      kind: 'malformed',
      location: { kind: 'token', evidence: ']' },
      expected: ')',
      actual: ']',
    });
  });
});
