import { describe, expect, it } from 'vitest';
import { scannerAssignmentPartsAlgebra } from '../scannerAssignmentPartsAlgebra';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';

describe('scannerAssignmentPartsAlgebra phase 1444 interface contract', () => {
  const query = (tokens: readonly string[]) => ({
    tokens,
    operators: [
      { token: '+=', kind: 'add' as const },
      { token: '=', kind: 'set' as const },
    ],
    locateOperator: (source: readonly string[], token: string) => scannerTokenStructureInterface.locateTopLevel({
      tokens: source,
      target: token,
      tokenValue: value => value,
    }),
    classifyTarget: (source: readonly string[]) => source.length === 1 && source[0]?.startsWith('$') ? { kind: 'resolved' as const, value: source[0] } : { kind: 'unresolved' as const, reason: 'not_recognized' as const },
    classifyValue: (source: readonly string[]) => source.length > 0 ? { kind: 'resolved' as const, value: source.join('') } : { kind: 'unresolved' as const, reason: 'not_recognized' as const },
    isReferenceMarker: (token: string | undefined) => token === '&',
  });

  it('returns source partitions instead of a cursor index', () => {
    expect(scannerAssignmentPartsAlgebra.resolve(query(['$count', '+=', '1']))).toEqual({
      kind: 'resolved',
      value: {
        target: '$count',
        operator: { kind: 'add' },
        reference: { kind: 'by_value' },
        value: '1',
        evidence: { before: ['$count'], token: '+=', after: ['1'] },
      },
    });
  });

  it('rejects duplicate operator rules as a contract violation', () => {
    const input = query(['$count', '=', '1']);
    expect(scannerAssignmentPartsAlgebra.resolve({ ...input, operators: [...input.operators, { token: '=', kind: 'set' as const }] })).toEqual({
      kind: 'contract_violation',
      reason: 'invalid_operator_rule',
    });
  });

  it('preserves malformed source evidence without exposing an index', () => {
    expect(scannerAssignmentPartsAlgebra.resolve(query(['$count', '=', '(', '1']))).toMatchObject({
      kind: 'malformed',
      location: { kind: 'end_of_source' },
      expected: ')',
      actual: '<end-of-input>',
    });
  });
  it('consumes upstream operator partitions without invoking the locator again', () => {
    const source = ['$count', '+=', '1'] as const;
    const result = scannerAssignmentPartsAlgebra.resolve({
      tokens: source,
      operators: [{ token: '+=', kind: 'add' as const }, { token: '=', kind: 'set' as const }],
      operatorEvidence: [{ before: ['$count'], token: '+=', after: ['1'] }],
      tokenValue: token => token,
      locateOperator: () => { throw new Error('duplicate operator search'); },
      classifyTarget: target => target.length === 1 && target[0]?.startsWith('$') ? { kind: 'resolved' as const, value: target[0] } : { kind: 'unresolved' as const, reason: 'not_recognized' as const },
      classifyValue: value => value.length > 0 ? { kind: 'resolved' as const, value: value.join('') } : { kind: 'unresolved' as const, reason: 'not_recognized' as const },
      isReferenceMarker: token => token === '&',
    });
    expect(result).toMatchObject({ kind: 'resolved', value: { operator: { kind: 'add' }, evidence: { before: ['$count'], token: '+=', after: ['1'] } } });
  });

});
