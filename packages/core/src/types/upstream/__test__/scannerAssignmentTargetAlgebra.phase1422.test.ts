import { describe, expect, it } from 'vitest';
import { scannerAssignmentTargetContractAlgebra } from '../scannerAssignmentTargetAlgebra';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';
import type { AssignmentTargetQuery } from '../scannerAssignmentTargetInterface';

type Identifier = Readonly<{ readonly kind: 'identifier'; readonly value: string }>;
type Expression = Readonly<{ readonly kind: 'expression'; readonly source: string }>;
type Entry =
  | Readonly<{ readonly kind: 'variable'; readonly name: Identifier }>
  | Readonly<{ readonly kind: 'reference'; readonly name: Identifier }>
  | Readonly<{ readonly kind: 'keyed'; readonly key: Expression; readonly target: Entry }>
  | Readonly<{ readonly kind: 'nested'; readonly pattern: Pattern }>
  | Readonly<{ readonly kind: 'skipped' }>;
type Pattern = Readonly<{ readonly kind: 'list'; readonly entries: readonly Entry[] }>;
type Target =
  | Readonly<{ readonly kind: 'variable'; readonly name: Identifier }>
  | Readonly<{ readonly kind: 'append'; readonly receiver: Expression }>
  | Readonly<{ readonly kind: 'array_element'; readonly receiver: Expression; readonly index: Expression }>
  | Readonly<{ readonly kind: 'property'; readonly receiver: Expression; readonly property: Identifier }>
  | Readonly<{ readonly kind: 'static' }>
  | Readonly<{ readonly kind: 'destructuring'; readonly pattern: Pattern }>;

const unresolved = <Value>() => ({ kind: 'unresolved' as const });
const resolved = <Value>(evidence: Value) => ({ kind: 'resolved' as const, evidence });
const identifier = (value: string): Identifier => ({ kind: 'identifier', value: value.slice(1) });
const query = (tokens: readonly string[]): AssignmentTargetQuery<string, Expression, Identifier, Target, Entry, Pattern> => ({
  tokens,
  tokenValue: token => token ?? '',
  isVariableToken: token => Boolean(token?.startsWith('$')),
  variableIdentifier: identifier,
  locateTopLevel: (source, target) => scannerTokenStructureInterface.locateTopLevel({ tokens: source, target, tokenValue: token => token }),
  matchLeadingDelimiter: source => scannerTokenStructureInterface.matchLeadingDelimiter({ tokens: source, tokenValue: token => token }),
  classifyExpression: source => ({ kind: 'expression', source: source.join('') }),
  classifyArrayAccess: () => unresolved(),
  classifyMember: () => unresolved(),
  classifyStaticProperty: () => unresolved(),
  variableTarget: name => ({ kind: 'variable', name }),
  appendTarget: receiver => ({ kind: 'append', receiver }),
  arrayElementTarget: access => ({ kind: 'array_element', receiver: access.target, index: access.index }),
  propertyTarget: property => ({ kind: 'property', receiver: property.receiver, property: property.property }),
  destructuringTarget: pattern => ({ kind: 'destructuring', pattern }),
  listPattern: entries => ({ kind: 'list', entries }),
  skippedEntry: () => ({ kind: 'skipped' }),
  keyedEntry: (key, target) => ({ kind: 'keyed', key, target }),
  nestedEntry: pattern => ({ kind: 'nested', pattern }),
  referenceVariableEntry: name => ({ kind: 'reference', name }),
  variableEntry: name => ({ kind: 'variable', name }),
  patternOfTarget: target => target.kind === 'destructuring' ? resolved(target.pattern) : unresolved(),
});

describe('scanner assignment target contract algebra', () => {
  it('resolves a plain variable through the canonical interface contract', () => {
    expect(scannerAssignmentTargetContractAlgebra.resolve(query(['$item']))).toMatchObject({ kind: 'resolved', target: { kind: 'variable', name: { value: 'item' } } });
  });
  it('resolves append targets before generic array access', () => {
    expect(scannerAssignmentTargetContractAlgebra.resolve(query(['$items', '[', ']']))).toMatchObject({ kind: 'resolved', target: { kind: 'append', receiver: { source: '$items' } } });
  });
  it('recursively resolves keyed, nested and reference destructuring entries', () => {
    expect(scannerAssignmentTargetContractAlgebra.resolve(query(['[', "'id'", '=>', '$id', ',', '[', '$name', ',', '&', '$email', ']', ']']))).toMatchObject({
      kind: 'resolved',
      target: { kind: 'destructuring', pattern: { kind: 'list', entries: [
        { kind: 'keyed', key: { source: "'id'" }, target: { kind: 'variable', name: { value: 'id' } } },
        { kind: 'nested', pattern: { kind: 'list', entries: [
          { kind: 'variable', name: { value: 'name' } },
          { kind: 'reference', name: { value: 'email' } },
        ] } },
      ] } },
    });
  });
  it('returns source-located malformed evidence for mismatched delimiters', () => {
    expect(scannerAssignmentTargetContractAlgebra.resolve(query(['[', '$item', ',', '(', '$other']))).toMatchObject({ kind: 'malformed', location: { kind: 'end_of_source' } });
  });
});
