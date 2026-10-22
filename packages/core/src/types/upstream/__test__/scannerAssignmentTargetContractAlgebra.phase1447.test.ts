import { describe, expect, it } from 'vitest';
import { scannerAssignmentTargetContractAlgebra } from '../scannerAssignmentTargetAlgebra';
import { scannerTokenStructureInterface } from '../scannerTokenStructureAlgebra';
import type { AssignmentTargetQuery } from '../scannerAssignmentTargetInterface';

type Identifier = Readonly<{ readonly value: string }>;
type Expression = Readonly<{ readonly source: string }>;
type Entry = Readonly<{ readonly kind: 'variable' | 'skipped' | 'reference'; readonly name?: Identifier }>;
type Pattern = Readonly<{ readonly entries: readonly Entry[] }>;
type Target = Readonly<{ readonly kind: 'variable' | 'destructuring'; readonly name?: Identifier; readonly pattern?: Pattern }>;
const unresolved = <Value>() => ({ kind: 'unresolved' as const });
const resolved = <Value>(evidence: Value) => ({ kind: 'resolved' as const, evidence });
const query = (tokens: readonly string[]): AssignmentTargetQuery<string, Expression, Identifier, Target, Entry, Pattern> => ({
  tokens,
  tokenValue: token => token ?? '',
  isVariableToken: token => token?.startsWith('$') ?? false,
  variableIdentifier: token => ({ value: token.slice(1) }),
  locateTopLevel: (source, target) => scannerTokenStructureInterface.locateTopLevel({ tokens: source, target, tokenValue: token => token }),
  matchLeadingDelimiter: source => scannerTokenStructureInterface.matchLeadingDelimiter({ tokens: source, tokenValue: token => token }),
  classifyExpression: source => ({ source: source.join('') }),
  classifyArrayAccess: () => unresolved(),
  classifyMember: () => unresolved(),
  classifyStaticProperty: () => unresolved(),
  variableTarget: name => ({ kind: 'variable', name }),
  appendTarget: () => ({ kind: 'variable' }),
  arrayElementTarget: () => ({ kind: 'variable' }),
  propertyTarget: () => ({ kind: 'variable' }),
  destructuringTarget: pattern => ({ kind: 'destructuring', pattern }),
  listPattern: entries => ({ entries }),
  skippedEntry: () => ({ kind: 'skipped' }),
  keyedEntry: (_key, target) => target,
  nestedEntry: () => ({ kind: 'skipped' }),
  referenceVariableEntry: name => ({ kind: 'reference', name }),
  variableEntry: name => ({ kind: 'variable', name }),
  patternOfTarget: target => target.pattern === undefined ? unresolved() : resolved(target.pattern),
});

describe('scanner assignment target contract algebra phase 1447', () => {
  it('resolves a variable target through the index-free query contract', () => {
    expect(scannerAssignmentTargetContractAlgebra.resolve(query(['$item']))).toMatchObject({ kind: 'resolved', target: { kind: 'variable', name: { value: 'item' } } });
  });
  it('resolves a destructuring target using delimiter evidence', () => {
    expect(scannerAssignmentTargetContractAlgebra.resolve(query(['[', '$left', ',', '$right', ']']))).toMatchObject({ kind: 'resolved', target: { kind: 'destructuring', pattern: { entries: [{ kind: 'variable', name: { value: 'left' } }, { kind: 'variable', name: { value: 'right' } }] } } });
  });
  it('returns source-located malformed evidence for invalid delimiter structure', () => {
    expect(scannerAssignmentTargetContractAlgebra.resolve(query(['[', '$left', ',', '(', '$right']))).toMatchObject({ kind: 'malformed', location: { kind: 'end_of_source' } });
  });
});
