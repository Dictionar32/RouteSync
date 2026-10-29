import { describe, expect, it } from 'vitest';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

describe('scannerTokenStructureInterface phase 1440', () => {
  const query = (tokens: readonly string[]) => ({ tokens, tokenValue: (token: string) => token });

  it('returns top-level operator partitions rather than a cursor', () => {
    const judgment = scannerTokenStructureInterface.locateTopLevel({ ...query(['$a', '+', '$b']), target: '+' });
    expect(judgment).toMatchObject({
      kind: 'found',
      occurrence: { before: ['$a'], token: '+', after: ['$b'] },
    });
    expect(judgment.continueWith({
      found: occurrence => occurrence.token,
      notFound: () => 'missing',
      malformed: failure => failure.actual,
    })).toBe('+');
  });

  it('continues a not-found occurrence judgment through its domain operation', () => {
    const judgment = scannerTokenStructureInterface.locateTopLevel({ ...query(['$a', '+', '$b']), target: '*' });
    expect(judgment.continueWith({
      found: () => 'found',
      notFound: () => 'not-found-domain-result',
      malformed: failure => failure.actual,
    })).toBe('not-found-domain-result');
  });

  it('returns a typed delimiter partition for a leading call delimiter', () => {
    expect(scannerTokenStructureInterface.matchLeadingDelimiter(query(['(', '$a', ',', '$b', ')']))).toMatchObject({
      kind: 'matched',
      evidence: { opening: '(', contents: ['$a', ',', '$b'], closing: ')', prefix: [], suffix: [] },
    });
  });

  it('returns a typed delimiter partition for a trailing array delimiter', () => {
    expect(scannerTokenStructureInterface.matchTrailingDelimiter(query(['$items', '[', '$key', ']']))).toMatchObject({
      kind: 'matched',
      evidence: { opening: '[', contents: ['$key'], closing: ']', prefix: ['$items'], suffix: [] },
    });
  });

  it('partitions top-level separators while preserving nested commas and empty segments', () => {
    expect(scannerTokenStructureInterface.partitionTopLevel({ ...query(['$a', ',', 'call', '(', '$x', ',', '$y', ')', ',', '$b', ',']), separator: ',' })).toMatchObject({
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
    expect(scannerTokenStructureInterface.matchLeadingDelimiter(query(['(', '$value', ']']))).toMatchObject({
      kind: 'malformed',
      location: { kind: 'token', evidence: ']' },
      expected: ')',
      actual: ']',
    });
  });

  it('continues delimiter judgments through domain handlers', () => {
    const judgment = scannerTokenStructureInterface.matchLeadingDelimiter(query(['(', '$x', ')']));
    expect(judgment.continueWith({
      matched: evidence => evidence.contents.join(''),
      notFound: () => 'not-found-domain-result',
      malformed: failure => failure.actual,
    })).toBe('$x');
  });

  it('continues occurrence collections through domain handlers', () => {
    const judgment = scannerTokenStructureInterface.locateTopLevelCandidates({ ...query(['$a', '+', '$b']), targets: ['+', '-'] });
    expect(judgment.continueWith({
      complete: occurrences => occurrences.map(occurrence => occurrence.token).join(''),
      malformed: failure => failure.actual,
    })).toBe('+');
  });

  it('continues partitions through domain handlers', () => {
    const judgment = scannerTokenStructureInterface.partitionTopLevel({ ...query(['$a', ',', '$b']), separator: ',' });
    expect(judgment.continueWith({
      partitioned: parts => parts.length,
      malformed: failure => failure.actual.length,
    })).toBe(2);
  });

});
