import { describe, expect, it } from 'vitest';
import { scannerLoopStatementContractAlgebra } from '../scannerLoopStatementAlgebra';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

type Token = Readonly<{ value: string; type: string }>;
const token = (value: string): Token => ({ value, type: value.startsWith('$') ? 'VARIABLE' : value === '=>' ? 'ARROW' : 'PUNCTUATION' });
const resolve = (values: readonly string[], control: 'collection_iteration' | 'counted_iteration' | 'pretest_iteration') =>
  scannerLoopStatementContractAlgebra.resolve({
    tokens: values.map(token), control, tokenValue: item => item.value, tokenKind: item => item.type,
    structure: scannerTokenStructureInterface,
  });

describe('scanner loop statement contract algebra — phase 1468', () => {
  it('partitions a counted loop into exactly three source-backed clauses', () => {
    const judgment = resolve(['for', '(', '$i', '=', '0', ';', '$i', '<', '10', ';', '$i', '++', ')', '{', 'work', '(', ')', ';', '}'], 'counted_iteration');
    expect(judgment.kind).toBe('resolved');
    if (judgment.kind !== 'resolved') return;
    expect(judgment.evidence.clauses?.map(clause => clause.map(item => item.value))).toEqual([
      ['$i', '=', '0'], ['$i', '<', '10'], ['$i', '++'],
    ]);
    expect(judgment.evidence.body.map(item => item.value)).toEqual(['work', '(', ')', ';']);
  });

  it('resolves foreach iterable and value target without runtime delimiter scans', () => {
    const judgment = resolve(['foreach', '(', '$items', 'as', '$item', ')', '{', 'work', '(', '$item', ')', ';', '}'], 'collection_iteration');
    expect(judgment.kind).toBe('resolved');
    if (judgment.kind !== 'resolved') return;
    expect(judgment.evidence.iterable?.map(item => item.value)).toEqual(['$items']);
    expect(judgment.evidence.target).toEqual({ kind: 'value', variable: token('$item') });
  });

  it('resolves foreach key/value target', () => {
    const judgment = resolve(['foreach', '(', '$items', 'as', '$key', '=>', '$value', ')', '{', '}'], 'collection_iteration');
    expect(judgment.kind).toBe('resolved');
    if (judgment.kind !== 'resolved') return;
    expect(judgment.evidence.target).toEqual({ kind: 'key_value', key: token('$key'), value: token('$value') });
  });

  it('returns a closed malformed judgment for invalid counted clauses', () => {
    const judgment = resolve(['for', '(', '$i', ';', '$i', ')', '{', '}'], 'counted_iteration');
    expect(judgment.kind).toBe('malformed');
    if (judgment.kind === 'malformed') expect(judgment.reason).toBe('invalid_for_clauses');
  });

  it('does not claim a different control form', () => {
    expect(resolve(['while', '(', '$ok', ')', '{', '}'], 'counted_iteration').kind).toBe('not_applicable');
  });
});
