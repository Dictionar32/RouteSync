import { describe, expect, it } from 'vitest';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

type Token = Readonly<{ value: string }>;
const token = (value: string): Token => ({ value });
const partition = (values: readonly string[]) => scannerTokenStructureInterface.partitionTopLevel({
  tokens: values.map(token),
  separator: ',',
  tokenValue: item => item.value,
});

describe('inline-array source partition contract phase 1474', () => {
  it('partitions only top-level commas and preserves a trailing empty segment', () => {
    expect(partition(['$a', ',', 'call', '(', '$b', ',', '$c', ')', ','])).toMatchObject({
      kind: 'partitioned',
      parts: [[{ value: '$a' }], [{ value: 'call' }, { value: '(' }, { value: '$b' }, { value: ',' }, { value: '$c' }, { value: ')' }], []],
    });
  });

  it('returns a malformed judgment for mismatched delimiters instead of a normal partition', () => {
    expect(partition(['call', '(', '$a', ']'])).toMatchObject({ kind: 'malformed', actual: ']' });
  });

  it('keeps a single empty partition for an empty source', () => {
    expect(partition([])).toMatchObject({ kind: 'partitioned', parts: [[]] });
  });
});
