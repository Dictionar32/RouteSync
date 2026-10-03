import { solveSemanticRelations, type SemanticRelation, type SemanticRelationRewrite } from './semanticRelationSolver';

type Relation = 'predicate' | 'choice' | 'iteration' | 'reachable';
const v = (variable: string) => ({ variable });
const seed: SemanticRelation<Relation>[] = [
  { relation: 'predicate', arguments: ['p', 'choice'] },
  { relation: 'iteration', arguments: ['a', 'b'] },
  { relation: 'iteration', arguments: ['b', 'c'] },
];
const rules: SemanticRelationRewrite<Relation>[] = [
  { id: 'predicate-choice', priority: 10, when: [{ relation: 'predicate', arguments: [v('p'), 'choice'] }], then: [{ relation: 'choice', arguments: [v('p'), 'selected'] }] },
  { id: 'iteration-reachable', priority: 10, when: [{ relation: 'iteration', arguments: [v('a'), v('b')] }], then: [{ relation: 'reachable', arguments: [v('a'), v('b')] }] },
  { id: 'reachable-transitive', priority: 0, when: [{ relation: 'reachable', arguments: [v('a'), v('b')] }, { relation: 'reachable', arguments: [v('b'), v('c')] }], then: [{ relation: 'reachable', arguments: [v('a'), v('c')] }] },
];
const solved = solveSemanticRelations(seed, rules);
if (!solved.some(f => f.relation === 'choice' && f.arguments[0] === 'p')) throw new Error('choice rewrite failed');
if (!solved.some(f => f.relation === 'reachable' && f.arguments[0] === 'a' && f.arguments[1] === 'c')) throw new Error('fixed point join failed');
