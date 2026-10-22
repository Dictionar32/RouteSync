import { describe, expect, it } from 'vitest';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

describe('property type partition contract phase 1475', () => {
  const partition = (source: string, separator: string) => scannerTokenStructureInterface.partitionTopLevel({
    tokens: Array.from(source),
    tokenValue: character => character,
    separator,
  });

  it('partitions union operators without splitting nested intersections', () => {
    expect(partition('(A&B)|C', '|')).toEqual({
      kind: 'partitioned',
      parts: [['(', 'A', '&', 'B', ')'], ['C']],
    });
  });

  it('partitions intersection operators without splitting nested unions', () => {
    expect(partition('A&(B|C)', '&')).toEqual({
      kind: 'partitioned',
      parts: [['A'], ['(', 'B', '|', 'C', ')']],
    });
  });

  it('returns malformed judgment for unbalanced type delimiters', () => {
    expect(partition('(A&B|C', '|')).toMatchObject({
      kind: 'malformed',
      expected: ')',
      actual: '<end-of-input>',
    });
  });
});
