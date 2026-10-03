import { describe, expect, it } from 'vitest';
import { relationResolve } from './relationalSequence';
import {
  applyDecisionRewrites,
  decisionClosure,
  deriveDecision,
  deriveTransitions,
  type CandidateWitness,
  type DecisionRelation,
  type PredicateWitness,
  type Transition,
} from './semanticDecisionCalculus';

const predicate = (id: string, value: boolean): PredicateWitness => Object.freeze({ predicate: id, value });
const candidate = (id: string, value: string, requires: readonly string[] = []): CandidateWitness<string> => Object.freeze({
  candidate: id,
  value,
  requires,
  excludes: Object.freeze([]),
  dependsOn: Object.freeze([]),
});

describe('Phase 336 semantic decision calculus', () => {
  it('derives a permitted candidate from guarded relations', () => {
    const relation: DecisionRelation<string> = Object.freeze({
      candidates: Object.freeze([candidate('true-branch', 'A', ['enabled']), candidate('fallback', 'B')]),
      predicates: Object.freeze([predicate('enabled', true)]),
    });
    expect(deriveDecision(relation)).toEqual({ kind: 'some', value: { candidate: 'true-branch', value: 'A' } });
  });

  it('derives transitions from predicate witnesses', () => {
    const relation: DecisionRelation<string> = Object.freeze({
      candidates: Object.freeze([candidate('root', 'A')]),
      predicates: Object.freeze([predicate('ready', true)]),
    });
    const transitions: readonly Transition[] = Object.freeze([
      Object.freeze({ from: 'root', to: 'next', requires: Object.freeze(['ready']) }),
      Object.freeze({ from: 'root', to: 'blocked', requires: Object.freeze(['missing']) }),
    ]);
    expect(deriveTransitions(relation, transitions)).toHaveLength(1);
    expect(deriveTransitions(relation, transitions)[0].to).toBe('next');
  });

  it('applies declarative rewrites without exposing source control constructs', () => {
    const output = applyDecisionRewrites(
      [Object.freeze({ id: 'normalize', source: 'raw', target: 'normalized', requires: Object.freeze(['valid']), produces: Object.freeze([Object.freeze({ candidate: 'normalized', value: 'N' })]) })],
      'raw',
      Object.freeze([predicate('valid', true)]),
    );
    expect(output).toEqual([Object.freeze({ candidate: 'normalized', value: 'N' })]);
  });

  it('reaches a monotone closure', () => {
    const result = decisionClosure(
      Object.freeze([Object.freeze({ candidate: 'seed', value: 'A' })]),
      facts => relationResolve(facts.length > 0, () => Object.freeze([Object.freeze({ candidate: 'closed', value: 'B' })]), () => Object.freeze([])),
    );
    expect(result.converged).toBe(true);
    expect(result.value).toHaveLength(2);
  });
});
