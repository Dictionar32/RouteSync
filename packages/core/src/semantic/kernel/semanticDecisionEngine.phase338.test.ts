import { describe, expect, it } from 'vitest';
import { relationOptionFold } from './relationalSequence';
import {
  decisionCandidate,
  dependency,
  exclusion,
  requirement,
  solveDecision,
} from './semanticDecisionEngine';

describe('Phase 338 declarative semantic decision engine', () => {
  it('selects a witness from requirements without source-control dispatch', () => {
    const result = solveDecision([
      decisionCandidate('blocked', 'A', [requirement('ready', false)]),
      decisionCandidate('ready', 'B', [requirement('ready', true)]),
    ]);
    expect(relationOptionFold(result, () => 'none', witness => witness.id)).toBe('ready');
  });

  it('enforces exclusion and dependency relations', () => {
    const result = solveDecision([
      decisionCandidate('excluded', 'A', [], [exclusion('blocked', true)]),
      decisionCandidate('missing-dependency', 'B', [], [], [dependency('dep', false)]),
      decisionCandidate('valid', 'C', [requirement('ready', true)], [], [dependency('dep', true)]),
    ]);
    expect(relationOptionFold(result, () => 'none', witness => witness.value)).toBe('C');
  });
});
