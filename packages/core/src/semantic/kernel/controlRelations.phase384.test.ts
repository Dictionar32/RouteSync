import { describe, expect, it } from 'vitest';
import {
  candidate,
  candidateAdmissible,
  controlClosure,
  guardRelation,
  topology,
  relationKind,
} from './controlRelations';

const setLattice = Object.freeze({
  bottom: new Set<string>(),
  join: (left: ReadonlySet<string>, right: ReadonlySet<string>) => new Set([...left, ...right]),
  equal: (left: ReadonlySet<string>, right: ReadonlySet<string>) =>
    left.size === right.size && [...left].every(value => right.has(value)),
});

describe('phase 384 declarative control relations', () => {
  it('represents guard topology as relations', () => {
    const graph = topology([guardRelation('condition', 'candidate', 'truth-witness')]);
    expect(relationKind(graph, 'guard')).toHaveLength(1);
  });

  it('admits candidates through declarative guard and dependency witnesses', () => {
    const entry = candidate('route', 'resolved', ['guard'], ['dependency']);
    expect(candidateAdmissible(entry, value => value === 'resolved', value => value === 'guard', value => value === 'dependency')).toBe(true);
  });

  it('computes recurrence through a lattice fixed point', () => {
    const result = controlClosure(setLattice, new Set(['seed']), value => new Set([...value, 'closed']), 8);
    expect(result.value).toEqual(new Set(['seed', 'closed']));
    expect(result.converged).toBe(true);
  });
});
